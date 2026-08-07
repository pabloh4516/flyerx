"""
Serviço de integração com API Eulen (Pix2Depix).
Responsável por criar e consultar saques via API Eulen.
"""

import logging
import uuid
from dataclasses import dataclass
from enum import Enum
from typing import Optional

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from src.config.settings import settings

logger = logging.getLogger(__name__)

# Modo mock para desenvolvimento
EULEN_MOCK_MODE = settings.eulen_mock_mode


class EulenWithdrawStatus(str, Enum):
    """Status possíveis de um saque na Eulen."""

    UNSENT = "unsent"  # Aguardando DePix
    SENDING = "sending"  # Enviando PIX
    SENT = "sent"  # PIX enviado
    ERROR = "error"  # Erro
    CANCELED = "canceled"  # Cancelado
    REFUNDED = "refunded"  # Reembolsado


@dataclass
class EulenWithdrawResponse:
    """Resposta da criação de saque na Eulen."""

    withdrawal_id: str
    deposit_address: str
    deposit_amount_cents: int
    payout_amount_cents: int


@dataclass
class EulenWithdrawStatusResponse:
    """Resposta do status de saque na Eulen."""

    id: str
    status: EulenWithdrawStatus
    deposit_amount_cents: int
    payout_amount_cents: int
    blockchain_tx_id: Optional[str] = None
    receipt_url: Optional[str] = None
    error_message: Optional[str] = None


class EulenAPIError(Exception):
    """Erro da API Eulen."""

    def __init__(self, message: str, status_code: int = 0, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class EulenService:
    """
    Serviço para interagir com a API Eulen (Pix2Depix).

    Responsabilidades:
    - Criar ordens de saque (DePix → PIX)
    - Consultar status de saques
    - Obter informações de usuário (limites)
    """

    def __init__(self, mock_mode: bool = False) -> None:
        """Inicializa o serviço Eulen."""
        self.base_url = settings.eulen_api_url.rstrip("/")
        self.token = settings.eulen_api_token
        self._client: Optional[httpx.AsyncClient] = None
        self._mock_mode = mock_mode or EULEN_MOCK_MODE
        self._mock_statuses: dict[str, EulenWithdrawStatus] = {}

        if self._mock_mode:
            logger.warning("EulenService em modo MOCK - respostas simuladas")

    async def _get_client(self) -> httpx.AsyncClient:
        """Retorna cliente HTTP configurado."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": "application/json",
                },
                timeout=30.0,
            )
        return self._client

    async def close(self) -> None:
        """Fecha o cliente HTTP."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException)),
    )
    async def create_withdraw(
        self,
        pix_key: str,
        tax_number: str,
        payout_amount_cents: int,
        euid: Optional[str] = None,
        pix_key_type: Optional[str] = None,
    ) -> EulenWithdrawResponse:
        """
        Cria uma ordem de saque na Eulen.

        Args:
            pix_key: Chave PIX do destinatário
            tax_number: CPF/CNPJ do titular da chave
            payout_amount_cents: Valor a receber em centavos
            euid: Eulen User ID (opcional, usar tax_number OU euid)
            pix_key_type: Tipo da chave PIX (CPF, CNPJ, EMAIL, PHONE, RANDOM)

        Returns:
            EulenWithdrawResponse com dados do saque

        Raises:
            EulenAPIError: Se a API retornar erro
        """
        # Modo mock para desenvolvimento
        if self._mock_mode:
            return self._mock_create_withdraw(payout_amount_cents)

        client = await self._get_client()

        # Normalizar chave PIX de telefone (adicionar +55 se necessário)
        # IMPORTANTE: Só adiciona +55 se for TELEFONE, não CPF/CNPJ
        normalized_pix_key = pix_key
        if pix_key_type == "PHONE":
            clean = pix_key.replace("+", "").replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
            if clean.isdigit() and not pix_key.startswith("+"):
                normalized_pix_key = f"+55{clean}"
                logger.info(f"Chave PIX telefone normalizada: {pix_key} -> {normalized_pix_key}")

        # IMPORTANTE: API aceita taxNumber OU euid, não ambos
        payload = {
            "pixKey": normalized_pix_key,
            "payoutAmountInCents": payout_amount_cents,
        }

        # Priorizar taxNumber se informado
        if tax_number:
            payload["taxNumber"] = tax_number
        elif euid:
            payload["euid"] = euid
        else:
            raise EulenAPIError("taxNumber ou euid é obrigatório")

        logger.info(f"Criando saque na Eulen: {payout_amount_cents} centavos para {pix_key}")

        try:
            response = await client.post("/withdraw", json=payload)

            data = response.json() if response.content else {}

            # A API Eulen envolve a resposta em "response"
            result_data = data.get("response", data)

            # Verifica erro na resposta
            if response.status_code != 200 or "errorMessage" in result_data:
                error_msg = result_data.get("errorMessage", data.get("error", f"HTTP {response.status_code}"))
                logger.error(f"Erro Eulen: {error_msg}")
                raise EulenAPIError(
                    message=error_msg,
                    status_code=response.status_code,
                    details=data,
                )

            result = EulenWithdrawResponse(
                withdrawal_id=result_data["withdrawalId"],
                deposit_address=result_data["depositAddress"],
                deposit_amount_cents=result_data["depositAmountInCents"],
                payout_amount_cents=result_data["payoutAmountInCents"],
            )

            logger.info(f"Saque criado: {result.withdrawal_id}")
            return result

        except httpx.RequestError as e:
            logger.error(f"Erro de conexão com Eulen: {e}")
            raise

    def _mock_create_withdraw(self, payout_amount_cents: int) -> EulenWithdrawResponse:
        """Cria resposta mock para testes."""
        # Taxa Eulen mock: 1% (mínimo R$1)
        eulen_fee = max(100, int(payout_amount_cents * 0.01))
        deposit_amount = payout_amount_cents + eulen_fee

        result = EulenWithdrawResponse(
            withdrawal_id=f"mock_eulen_{uuid.uuid4().hex[:12]}",
            deposit_address=f"lq1qqeulen_mock_{uuid.uuid4().hex[:16]}",
            deposit_amount_cents=deposit_amount,
            payout_amount_cents=payout_amount_cents,
        )
        logger.info(f"[MOCK] Saque criado: {result.withdrawal_id}")
        return result

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException)),
    )
    async def get_withdraw_status(
        self,
        withdrawal_id: str,
    ) -> EulenWithdrawStatusResponse:
        """
        Consulta status de um saque na Eulen.

        Args:
            withdrawal_id: ID do saque retornado na criação

        Returns:
            EulenWithdrawStatusResponse com status atual

        Raises:
            EulenAPIError: Se a API retornar erro
        """
        # Modo mock para desenvolvimento
        if self._mock_mode:
            return self._mock_get_status(withdrawal_id)

        client = await self._get_client()

        logger.debug(f"Consultando status do saque: {withdrawal_id}")

        try:
            response = await client.get(f"/withdraw-status?id={withdrawal_id}")

            data = response.json() if response.content else {}

            # A API Eulen envolve a resposta em "response"
            result_data = data.get("response", data)

            # Verifica erro na resposta
            if response.status_code != 200 or "errorMessage" in result_data:
                error_msg = result_data.get("errorMessage", data.get("error", f"HTTP {response.status_code}"))
                raise EulenAPIError(
                    message=error_msg,
                    status_code=response.status_code,
                    details=data,
                )

            return EulenWithdrawStatusResponse(
                id=result_data.get("id", withdrawal_id),
                status=EulenWithdrawStatus(result_data["status"]),
                deposit_amount_cents=result_data["depositAmountInCents"],
                payout_amount_cents=result_data["payoutAmountInCents"],
                blockchain_tx_id=result_data.get("blockchainTxID"),
                receipt_url=result_data.get("receiptUrl"),
            )

        except httpx.RequestError as e:
            logger.error(f"Erro de conexão com Eulen: {e}")
            raise

    def _mock_get_status(self, withdrawal_id: str) -> EulenWithdrawStatusResponse:
        """Retorna status mock para testes."""
        # Simula progressão de status
        current = self._mock_statuses.get(withdrawal_id, EulenWithdrawStatus.UNSENT)

        # Progride status a cada consulta
        if current == EulenWithdrawStatus.UNSENT:
            self._mock_statuses[withdrawal_id] = EulenWithdrawStatus.SENDING
        elif current == EulenWithdrawStatus.SENDING:
            self._mock_statuses[withdrawal_id] = EulenWithdrawStatus.SENT

        new_status = self._mock_statuses.get(withdrawal_id, current)

        result = EulenWithdrawStatusResponse(
            id=withdrawal_id,
            status=new_status,
            deposit_amount_cents=10100,  # Mock
            payout_amount_cents=10000,  # Mock
            blockchain_tx_id=f"mock_tx_{withdrawal_id[:8]}" if new_status == EulenWithdrawStatus.SENT else None,
            receipt_url=f"https://mock.receipt/{withdrawal_id}" if new_status == EulenWithdrawStatus.SENT else None,
        )
        logger.info(f"[MOCK] Status de {withdrawal_id}: {new_status.value}")
        return result

    async def get_user_info(self, euid: str) -> dict:
        """
        Obtém informações do usuário na Eulen.

        Args:
            euid: Eulen User ID

        Returns:
            dict com informações do usuário (limites, etc.)
        """
        client = await self._get_client()

        try:
            response = await client.get(f"/user-info?euid={euid}")

            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                raise EulenAPIError(
                    message=error_data.get("error", f"HTTP {response.status_code}"),
                    status_code=response.status_code,
                    details=error_data,
                )

            return response.json()

        except httpx.RequestError as e:
            logger.error(f"Erro de conexão com Eulen: {e}")
            raise


# Instância singleton
_eulen_service: Optional[EulenService] = None


def get_eulen_service() -> EulenService:
    """Retorna instância singleton do EulenService."""
    global _eulen_service
    if _eulen_service is None:
        _eulen_service = EulenService()
    return _eulen_service
