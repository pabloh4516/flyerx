"""
Serviço de saques (Withdrawals).
Orquestra a lógica de negócio entre LWK e Eulen.
"""

import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.settings import settings
from src.models.withdrawal import (
    DailyWithdrawLimit,
    TransactionLog,
    TransactionType,
    Withdrawal,
    WithdrawalStatus,
)
from src.services.eulen_service import EulenService, EulenWithdrawStatus
from src.services.lwk_service import LWKService

logger = logging.getLogger(__name__)

# Asset ID do DePix na Liquid Network (mainnet)
DEPIX_ASSET_ID = "02f22f8d9c76ab41661a2729e4752e2c5d1a263012141b86ea98af5472df5189"

# Fator de conversão: 1 centavo = 1,000,000 unidades DePix (8 decimais como BTC)
CENTS_TO_DEPIX_UNITS = 1_000_000


class WithdrawalServiceError(Exception):
    """Erro no serviço de saques."""

    pass


class WithdrawalService:
    """
    Serviço principal para processamento de saques.

    Responsabilidades:
    - Criar novas solicitações de saque
    - Calcular taxas
    - Processar depósitos recebidos
    - Enviar DePix para Eulen
    - Atualizar status dos saques
    """

    def __init__(
        self,
        db: AsyncSession,
        lwk_service: LWKService,
        eulen_service: EulenService,
    ) -> None:
        """
        Inicializa o serviço.

        Args:
            db: Sessão do banco de dados
            lwk_service: Serviço LWK
            eulen_service: Serviço Eulen
        """
        self.db = db
        self.lwk = lwk_service
        self.eulen = eulen_service

    def calculate_fees(self, amount_cents: int) -> dict:
        """
        Calcula as taxas do saque.

        Args:
            amount_cents: Valor solicitado em centavos

        Returns:
            dict com breakdown das taxas
        """
        # Taxa Eulen: 1% com mínimo de R$ 1,00
        eulen_percent = Decimal("0.01")
        eulen_min = 100  # R$ 1,00 em centavos
        eulen_fee = max(int(amount_cents * eulen_percent), eulen_min)

        # Taxa do parceiro Flyerx
        partner_percent = Decimal(str(settings.partner_withdraw_fee_percent))
        partner_fixed = settings.partner_withdraw_fee_fixed_cents
        partner_min = settings.partner_withdraw_fee_min_cents

        partner_fee_calc = int(amount_cents * partner_percent) + partner_fixed
        partner_fee = max(partner_fee_calc, partner_min)

        total_fee = eulen_fee + partner_fee
        total_depix = amount_cents + total_fee

        return {
            "requested_amount_cents": amount_cents,
            "eulen_fee_cents": eulen_fee,
            "partner_fee_cents": partner_fee,
            "total_fee_cents": total_fee,
            "total_depix_cents": total_depix,
        }

    async def get_or_create_daily_limit(self, tax_number: str) -> DailyWithdrawLimit:
        """
        Busca ou cria registro de limite diário para um CPF/CNPJ.
        Reseta o volume se for um novo dia.
        """
        # Limpar formatação do CPF/CNPJ
        clean_tax = tax_number.replace(".", "").replace("-", "").replace("/", "")

        result = await self.db.execute(
            select(DailyWithdrawLimit).where(DailyWithdrawLimit.tax_number == clean_tax)
        )
        limit_record = result.scalar_one_or_none()

        today = datetime.utcnow().date()

        if limit_record is None:
            # Criar novo registro
            limit_record = DailyWithdrawLimit(
                tax_number=clean_tax,
                daily_volume_cents=0,
                max_daily_cents=500000,  # R$ 5.000,00 padrão
                last_reset_date=datetime.utcnow(),
            )
            self.db.add(limit_record)
            await self.db.commit()
            await self.db.refresh(limit_record)
            logger.info(f"Criado registro de limite para CPF/CNPJ: {clean_tax[:3]}***")
        else:
            # Verificar se precisa resetar (novo dia)
            last_reset = limit_record.last_reset_date.date() if limit_record.last_reset_date else None
            if last_reset != today:
                limit_record.daily_volume_cents = 0
                limit_record.last_reset_date = datetime.utcnow()
                await self.db.commit()
                logger.info(f"Reset do volume diário para CPF/CNPJ: {clean_tax[:3]}***")

        return limit_record

    async def validate_daily_limit(self, tax_number: str, amount_cents: int) -> tuple[bool, str, int]:
        """
        Valida se o CPF/CNPJ pode sacar o valor solicitado.

        Returns:
            tuple: (pode_sacar, mensagem_erro, limite_restante)
        """
        limit_record = await self.get_or_create_daily_limit(tax_number)

        # Se tiver EUID, poderia consultar limite real na Eulen
        # Por enquanto, usar limite local
        max_daily = limit_record.max_daily_cents
        current_volume = limit_record.daily_volume_cents
        remaining = max_daily - current_volume

        if amount_cents > remaining:
            msg = f"Limite diário excedido para este CPF/CNPJ. Disponível: R$ {remaining/100:.2f}"
            logger.warning(f"Limite excedido: solicitado {amount_cents}, disponível {remaining}")
            return False, msg, remaining

        return True, "", remaining

    async def increment_daily_volume(self, tax_number: str, amount_cents: int) -> None:
        """
        Incrementa o volume diário de saques para um CPF/CNPJ.
        """
        limit_record = await self.get_or_create_daily_limit(tax_number)
        limit_record.daily_volume_cents += amount_cents
        await self.db.commit()
        logger.info(f"Volume atualizado para {tax_number[:3]}***: +{amount_cents} = {limit_record.daily_volume_cents}")

    async def create_withdrawal(
        self,
        user_id: str,
        pix_key: str,
        pix_key_type: str,
        beneficiary_tax_number: str,
        amount_cents: int,
    ) -> Withdrawal:
        """
        Cria uma nova solicitação de saque.

        Gera um endereço LWK para o usuário enviar DePix.
        A chamada para Eulen será feita APENAS quando o DePix for recebido.

        Args:
            user_id: ID do usuário
            pix_key: Chave PIX do destinatário
            pix_key_type: Tipo da chave PIX
            beneficiary_tax_number: CPF/CNPJ do titular
            amount_cents: Valor a receber em centavos

        Returns:
            Withdrawal criado

        Raises:
            WithdrawalServiceError: Se houver erro na criação
        """
        logger.info(f"Criando saque para usuário {user_id}: {amount_cents} centavos")

        # 1. Validar limite diário do CPF/CNPJ
        can_withdraw, error_msg, remaining = await self.validate_daily_limit(
            beneficiary_tax_number, amount_cents
        )
        if not can_withdraw:
            raise WithdrawalServiceError(error_msg)

        # 2. Calcular taxas
        fees = self.calculate_fees(amount_cents)
        logger.debug(f"Taxas calculadas: {fees}")

        # 3. Gerar endereço LWK para o usuário receber DePix
        # NOTA: A chamada para Eulen será feita APENAS quando recebermos o DePix
        flyerx_address, address_index = self.lwk.get_new_address()
        logger.info(f"Endereço LWK gerado: {flyerx_address[:30]}...")

        # 4. Criar registro no banco (sem eulen_withdrawal_id ainda)
        withdrawal = Withdrawal(
            user_id=user_id,
            pix_key=pix_key,
            pix_key_type=pix_key_type,
            beneficiary_tax_number=beneficiary_tax_number,
            requested_amount_cents=amount_cents,
            partner_fee_cents=fees["partner_fee_cents"],
            eulen_fee_cents=fees["eulen_fee_cents"],
            total_depix_cents=fees["total_depix_cents"],
            flyerx_address=flyerx_address,
            flyerx_address_index=address_index,
            eulen_deposit_address=None,  # Será preenchido quando chamar Eulen
            eulen_withdrawal_id=None,    # Será preenchido quando chamar Eulen
            status=WithdrawalStatus.PENDING,
            expires_at=datetime.utcnow() + timedelta(hours=settings.withdrawal_expiration_hours),
        )

        withdrawal.add_status_history(WithdrawalStatus.PENDING, "Saque criado")

        self.db.add(withdrawal)
        await self.db.commit()
        await self.db.refresh(withdrawal)

        # 6. Incrementar volume diário do CPF/CNPJ
        await self.increment_daily_volume(beneficiary_tax_number, amount_cents)

        logger.info(f"Saque criado: {withdrawal.id}")
        return withdrawal

    async def get_withdrawal(self, withdrawal_id: str) -> Optional[Withdrawal]:
        """Busca um saque pelo ID."""
        result = await self.db.execute(
            select(Withdrawal).where(Withdrawal.id == withdrawal_id)
        )
        return result.scalar_one_or_none()

    async def get_withdrawal_by_address(self, address: str) -> Optional[Withdrawal]:
        """Busca um saque pelo endereço LWK."""
        result = await self.db.execute(
            select(Withdrawal).where(Withdrawal.flyerx_address == address)
        )
        return result.scalar_one_or_none()

    async def list_withdrawals(
        self,
        user_id: str,
        status: Optional[WithdrawalStatus] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Withdrawal]:
        """Lista saques de um usuário."""
        query = select(Withdrawal).where(Withdrawal.user_id == user_id)

        if status:
            query = query.where(Withdrawal.status == status)

        query = query.order_by(Withdrawal.created_at.desc())
        query = query.limit(limit).offset(offset)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_pending_withdrawals(self) -> List[Withdrawal]:
        """Busca saques pendentes não expirados."""
        result = await self.db.execute(
            select(Withdrawal)
            .where(Withdrawal.status == WithdrawalStatus.PENDING)
            .where(Withdrawal.expires_at > datetime.utcnow())
        )
        return list(result.scalars().all())

    async def get_sent_withdrawals(self) -> List[Withdrawal]:
        """Busca saques enviados para Eulen (aguardando confirmação)."""
        result = await self.db.execute(
            select(Withdrawal).where(
                Withdrawal.status == WithdrawalStatus.SENT_TO_EULEN
            )
        )
        return list(result.scalars().all())

    async def process_received_deposit(self, withdrawal_id: str) -> bool:
        """
        Processa um depósito recebido.

        1. Verifica se o valor está correto
        2. Atualiza status
        3. Separa taxa do parceiro
        4. Envia para Eulen

        Args:
            withdrawal_id: ID do saque

        Returns:
            bool: True se processado com sucesso
        """
        withdrawal = await self.get_withdrawal(withdrawal_id)
        if not withdrawal:
            logger.error(f"Saque não encontrado: {withdrawal_id}")
            return False

        # Verificar balanço no endereço
        balance = self.lwk.get_address_balance(withdrawal.flyerx_address)
        logger.info(f"Balanço do endereço {withdrawal.flyerx_address[:20]}...: {balance}")

        if balance < withdrawal.total_depix_cents:
            logger.debug(f"Balanço insuficiente: {balance} < {withdrawal.total_depix_cents}")
            return False

        # Atualizar status
        withdrawal.status = WithdrawalStatus.DEPIX_RECEIVED
        withdrawal.user_deposit_at = datetime.utcnow()
        withdrawal.add_status_history(WithdrawalStatus.DEPIX_RECEIVED, "DePix recebido")
        await self.db.commit()

        logger.info(f"DePix recebido para saque {withdrawal_id}")

        # Processar envio para Eulen
        return await self._send_to_eulen(withdrawal)

    async def _send_to_eulen(self, withdrawal: Withdrawal) -> bool:
        """
        Cria saque na Eulen e envia DePix para o endereço dela.

        Args:
            withdrawal: Saque a processar

        Returns:
            bool: True se enviado com sucesso
        """
        withdrawal.status = WithdrawalStatus.PROCESSING
        withdrawal.add_status_history(WithdrawalStatus.PROCESSING, "Processando envio")
        await self.db.commit()

        try:
            # 1. Criar saque na Eulen (agora que temos o DePix)
            logger.info(f"Criando saque na Eulen para withdrawal {withdrawal.id}")

            eulen_response = await self.eulen.create_withdraw(
                pix_key=withdrawal.pix_key,
                tax_number=withdrawal.beneficiary_tax_number,
                payout_amount_cents=withdrawal.requested_amount_cents,
                pix_key_type=withdrawal.pix_key_type,
            )

            # Salvar dados da Eulen
            withdrawal.eulen_withdrawal_id = eulen_response.withdrawal_id
            withdrawal.eulen_deposit_address = eulen_response.deposit_address
            await self.db.commit()

            logger.info(f"Saque criado na Eulen: {eulen_response.withdrawal_id}")

            # 2. Calcular valor a enviar (total - taxa do parceiro)
            # A taxa do parceiro fica na carteira Flyerx
            amount_to_eulen_cents = withdrawal.total_depix_cents - withdrawal.partner_fee_cents

            # Converter centavos para unidades DePix (8 decimais)
            # 1 centavo = 1,000,000 unidades DePix
            amount_to_eulen_units = amount_to_eulen_cents * CENTS_TO_DEPIX_UNITS

            logger.info(
                f"Enviando {amount_to_eulen_cents} centavos ({amount_to_eulen_units} units) para Eulen "
                f"(taxa parceiro: {withdrawal.partner_fee_cents} centavos)"
            )

            # 3. Enviar DePix para endereço da Eulen
            txid_obj = self.lwk.send(
                to_address=eulen_response.deposit_address,
                amount_sats=amount_to_eulen_units,
                asset_id=DEPIX_ASSET_ID,
            )
            # Converter objeto Txid para string
            txid = str(txid_obj)

            # Registrar log de transação
            tx_log = TransactionLog(
                withdrawal_id=withdrawal.id,
                type=TransactionType.SENT,
                tx_id=txid,
                from_address=withdrawal.flyerx_address,
                to_address=withdrawal.eulen_deposit_address,
                amount_cents=amount_to_eulen_cents,
            )
            self.db.add(tx_log)

            # Se houver taxa do parceiro, registrar
            if withdrawal.partner_fee_cents > 0:
                fee_log = TransactionLog(
                    withdrawal_id=withdrawal.id,
                    type=TransactionType.FEE,
                    amount_cents=withdrawal.partner_fee_cents,
                )
                self.db.add(fee_log)

            # Atualizar saque
            withdrawal.flyerx_to_eulen_tx_id = txid
            withdrawal.sent_to_eulen_at = datetime.utcnow()
            withdrawal.status = WithdrawalStatus.SENT_TO_EULEN
            withdrawal.add_status_history(
                WithdrawalStatus.SENT_TO_EULEN,
                f"DePix enviado para Eulen. TX: {txid}",
            )

            await self.db.commit()

            logger.info(f"DePix enviado para Eulen: {txid}")
            return True

        except Exception as e:
            logger.error(f"Erro ao enviar para Eulen: {e}")

            withdrawal.status = WithdrawalStatus.FAILED
            withdrawal.error_message = str(e)
            withdrawal.retry_count += 1
            withdrawal.add_status_history(WithdrawalStatus.FAILED, f"Erro: {e}")

            await self.db.commit()
            return False

    async def check_eulen_status(self, withdrawal_id: str) -> Optional[str]:
        """
        Verifica e atualiza status do saque na Eulen.

        Args:
            withdrawal_id: ID do saque

        Returns:
            str: Status atual ou None se erro
        """
        withdrawal = await self.get_withdrawal(withdrawal_id)
        if not withdrawal or not withdrawal.eulen_withdrawal_id:
            return None

        try:
            eulen_status = await self.eulen.get_withdraw_status(
                withdrawal.eulen_withdrawal_id
            )

            if eulen_status.status == EulenWithdrawStatus.SENT:
                withdrawal.status = WithdrawalStatus.COMPLETED
                withdrawal.completed_at = datetime.utcnow()
                withdrawal.receipt_url = eulen_status.receipt_url
                withdrawal.add_status_history(
                    WithdrawalStatus.COMPLETED,
                    "PIX enviado com sucesso",
                )
                logger.info(f"Saque {withdrawal_id} completado")

            elif eulen_status.status == EulenWithdrawStatus.ERROR:
                withdrawal.status = WithdrawalStatus.FAILED
                withdrawal.error_message = eulen_status.error_message or "Erro na Eulen"
                withdrawal.add_status_history(
                    WithdrawalStatus.FAILED,
                    f"Erro Eulen: {eulen_status.error_message}",
                )
                logger.error(f"Saque {withdrawal_id} falhou: {eulen_status.error_message}")

            elif eulen_status.status == EulenWithdrawStatus.CANCELED:
                withdrawal.status = WithdrawalStatus.CANCELED
                withdrawal.add_status_history(
                    WithdrawalStatus.CANCELED,
                    "Cancelado pela Eulen",
                )

            elif eulen_status.status == EulenWithdrawStatus.REFUNDED:
                withdrawal.status = WithdrawalStatus.REFUNDED
                withdrawal.add_status_history(
                    WithdrawalStatus.REFUNDED,
                    "Reembolsado pela Eulen",
                )

            await self.db.commit()
            return withdrawal.status.value

        except Exception as e:
            logger.error(f"Erro ao verificar status Eulen: {e}")
            return None

    async def expire_old_withdrawals(self) -> int:
        """
        Expira saques pendentes que passaram do prazo.

        Returns:
            int: Número de saques expirados
        """
        result = await self.db.execute(
            select(Withdrawal)
            .where(Withdrawal.status == WithdrawalStatus.PENDING)
            .where(Withdrawal.expires_at <= datetime.utcnow())
        )

        expired = list(result.scalars().all())
        count = 0

        for withdrawal in expired:
            withdrawal.status = WithdrawalStatus.EXPIRED
            withdrawal.add_status_history(
                WithdrawalStatus.EXPIRED,
                "Expirado por falta de pagamento",
            )
            count += 1

        if count > 0:
            await self.db.commit()
            logger.info(f"{count} saques expirados")

        return count

    async def cancel_withdrawal(
        self,
        withdrawal_id: str,
        user_id: str,
    ) -> bool:
        """
        Cancela um saque pendente.

        Args:
            withdrawal_id: ID do saque
            user_id: ID do usuário (para validação)

        Returns:
            bool: True se cancelado
        """
        withdrawal = await self.get_withdrawal(withdrawal_id)

        if not withdrawal:
            return False

        if withdrawal.user_id != user_id:
            logger.warning(f"Tentativa de cancelar saque de outro usuário")
            return False

        if withdrawal.status != WithdrawalStatus.PENDING:
            logger.warning(f"Saque {withdrawal_id} não pode ser cancelado (status: {withdrawal.status})")
            return False

        withdrawal.status = WithdrawalStatus.CANCELED
        withdrawal.add_status_history(
            WithdrawalStatus.CANCELED,
            "Cancelado pelo usuário",
        )

        await self.db.commit()
        logger.info(f"Saque {withdrawal_id} cancelado pelo usuário")
        return True
