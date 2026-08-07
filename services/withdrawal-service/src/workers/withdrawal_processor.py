"""
Worker de processamento de saques.
Monitora e processa saques automaticamente.
"""

import asyncio
import logging
import signal
import sys
from datetime import datetime
from typing import Optional

from src.config.database import get_db_context
from src.config.settings import settings
from src.services.eulen_service import get_eulen_service
from src.services.lwk_service import get_lwk_service
from src.services.withdrawal_service import WithdrawalService

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class WithdrawalProcessor:
    """
    Worker que processa saques automaticamente.

    Responsabilidades:
    1. Monitorar depósitos em endereços LWK
    2. Processar envio para Eulen quando receber DePix
    3. Verificar status de saques na Eulen
    4. Expirar saques não pagos
    """

    def __init__(self) -> None:
        """Inicializa o processor."""
        self.running = False
        self.poll_interval = settings.withdrawal_poll_interval_seconds
        self._lwk_service = None
        self._eulen_service = None

    def _get_lwk_service(self):
        """Lazy load do LWK service."""
        if self._lwk_service is None:
            self._lwk_service = get_lwk_service()
        return self._lwk_service

    def _get_eulen_service(self):
        """Lazy load do Eulen service."""
        if self._eulen_service is None:
            self._eulen_service = get_eulen_service()
        return self._eulen_service

    async def start(self) -> None:
        """Inicia o processor."""
        self.running = True
        logger.info("=" * 50)
        logger.info("Withdrawal Processor iniciado")
        logger.info(f"Intervalo de polling: {self.poll_interval}s")
        logger.info("=" * 50)

        while self.running:
            try:
                await self._process_cycle()
            except Exception as e:
                logger.exception(f"Erro no ciclo de processamento: {e}")

            await asyncio.sleep(self.poll_interval)

        logger.info("Withdrawal Processor encerrado")

    def stop(self) -> None:
        """Para o processor graciosamente."""
        logger.info("Encerrando Withdrawal Processor...")
        self.running = False

    async def _process_cycle(self) -> None:
        """Executa um ciclo de processamento."""
        logger.debug(f"Iniciando ciclo - {datetime.utcnow().isoformat()}")

        # 1. Processar saques pendentes (verificar se recebeu DePix)
        await self._process_pending_withdrawals()

        # 2. Verificar status de saques enviados para Eulen
        await self._check_sent_withdrawals()

        # 3. Expirar saques antigos
        await self._expire_old_withdrawals()

        logger.debug("Ciclo concluído")

    async def _process_pending_withdrawals(self) -> None:
        """
        Processa saques pendentes.
        Verifica se recebeu DePix e processa o envio para Eulen.
        """
        async with get_db_context() as db:
            service = WithdrawalService(
                db=db,
                lwk_service=self._get_lwk_service(),
                eulen_service=self._get_eulen_service(),
            )

            # Sincronizar LWK
            try:
                self._get_lwk_service().sync()
            except Exception as e:
                logger.error(f"Erro ao sincronizar LWK: {e}")
                return

            # Buscar saques pendentes
            pending = await service.get_pending_withdrawals()

            if pending:
                logger.info(f"Processando {len(pending)} saques pendentes")

            for withdrawal in pending:
                try:
                    # Verificar balanço no endereço
                    balance = self._get_lwk_service().get_address_balance(
                        withdrawal.flyerx_address
                    )

                    if balance >= withdrawal.total_depix_cents:
                        logger.info(
                            f"DePix recebido para saque {withdrawal.id}: "
                            f"{balance} >= {withdrawal.total_depix_cents}"
                        )

                        # Processar envio para Eulen
                        success = await service.process_received_deposit(withdrawal.id)

                        if success:
                            logger.info(f"Saque {withdrawal.id} enviado para Eulen")
                        else:
                            logger.error(f"Falha ao processar saque {withdrawal.id}")

                except Exception as e:
                    logger.error(f"Erro ao processar saque {withdrawal.id}: {e}")

    async def _check_sent_withdrawals(self) -> None:
        """
        Verifica status de saques enviados para Eulen.
        Atualiza status quando PIX for enviado.
        """
        async with get_db_context() as db:
            service = WithdrawalService(
                db=db,
                lwk_service=self._get_lwk_service(),
                eulen_service=self._get_eulen_service(),
            )

            # Buscar saques enviados para Eulen
            sent = await service.get_sent_withdrawals()

            if sent:
                logger.debug(f"Verificando {len(sent)} saques enviados")

            for withdrawal in sent:
                try:
                    new_status = await service.check_eulen_status(withdrawal.id)

                    if new_status == "completed":
                        logger.info(f"Saque {withdrawal.id} completado!")
                    elif new_status == "failed":
                        logger.error(f"Saque {withdrawal.id} falhou")

                except Exception as e:
                    logger.error(f"Erro ao verificar status {withdrawal.id}: {e}")

    async def _expire_old_withdrawals(self) -> None:
        """Expira saques que não receberam DePix no prazo."""
        async with get_db_context() as db:
            service = WithdrawalService(
                db=db,
                lwk_service=self._get_lwk_service(),
                eulen_service=self._get_eulen_service(),
            )

            count = await service.expire_old_withdrawals()

            if count > 0:
                logger.info(f"Expirados {count} saques")


# ===== Entry Point =====

processor: Optional[WithdrawalProcessor] = None


def handle_shutdown(signum, frame):
    """Handler para sinais de shutdown."""
    logger.info(f"Recebido sinal {signum}")
    if processor:
        processor.stop()


async def main():
    """Função principal do worker."""
    global processor

    # Registrar handlers de sinal
    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)

    # Criar e iniciar processor
    processor = WithdrawalProcessor()

    try:
        await processor.start()
    except KeyboardInterrupt:
        logger.info("Interrompido pelo usuário")
        processor.stop()
    finally:
        # Cleanup
        eulen = get_eulen_service()
        await eulen.close()


if __name__ == "__main__":
    asyncio.run(main())
