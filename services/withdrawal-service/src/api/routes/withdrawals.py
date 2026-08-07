"""
Rotas internas de API para saques (withdrawals).
Microserviço chamado pelo Laravel.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.auth import verify_internal_api_key
from src.api.schemas.withdrawal import (
    EstimateFeeRequest,
    EstimateFeeResponse,
    FeeBreakdown,
    WithdrawalListResponse,
    WithdrawalResponse,
    WithdrawalStatusResponse,
)
from src.config.database import get_db
from src.models.withdrawal import WithdrawalStatus
from src.services.eulen_service import get_eulen_service
from src.services.lwk_service import get_lwk_service
from src.services.withdrawal_service import WithdrawalService, WithdrawalServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/withdrawals", tags=["withdrawals"])


# ===== Request Models (Laravel envia user_id) =====

class CreateWithdrawalInternalRequest(BaseModel):
    """Request interno para criar saque (Laravel -> Python)."""

    user_id: str = Field(..., description="ID do usuário (do Laravel)")
    pix_key: str = Field(..., min_length=1, max_length=100)
    pix_key_type: str = Field(..., pattern="^(CPF|CNPJ|EMAIL|PHONE|RANDOM)$")
    beneficiary_tax_number: str = Field(..., min_length=11, max_length=14)
    amount_cents: int = Field(..., gt=0, le=600000, description="Valor em centavos")


class CancelWithdrawalRequest(BaseModel):
    """Request para cancelar saque."""

    user_id: str = Field(..., description="ID do usuário (do Laravel)")


# ===== Dependency =====

def get_withdrawal_service(
    db: AsyncSession = Depends(get_db),
) -> WithdrawalService:
    """Dependency para obter o WithdrawalService."""
    return WithdrawalService(
        db=db,
        lwk_service=get_lwk_service(),
        eulen_service=get_eulen_service(),
    )


# ===== Endpoints =====

@router.post("", response_model=WithdrawalResponse)
async def create_withdrawal(
    request: CreateWithdrawalInternalRequest,
    _: bool = Depends(verify_internal_api_key),
    service: WithdrawalService = Depends(get_withdrawal_service),
):
    """
    Cria uma nova solicitação de saque.

    **Endpoint interno** - chamado pelo Laravel.

    O saque será criado com status 'pending'. O usuário deve enviar DePix
    para o endereço retornado (flyerx_address) para que o saque seja processado.

    Returns:
        WithdrawalResponse com dados do saque e endereço para envio
    """
    logger.info(f"[Laravel] Criando saque para usuário {request.user_id}: {request.amount_cents} centavos")

    try:
        withdrawal = await service.create_withdrawal(
            user_id=request.user_id,
            pix_key=request.pix_key,
            pix_key_type=request.pix_key_type,
            beneficiary_tax_number=request.beneficiary_tax_number,
            amount_cents=request.amount_cents,
        )

        return WithdrawalResponse.from_withdrawal(withdrawal)

    except WithdrawalServiceError as e:
        logger.error(f"Erro ao criar saque: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Erro inesperado ao criar saque: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")


@router.get("/{withdrawal_id}", response_model=WithdrawalResponse)
async def get_withdrawal(
    withdrawal_id: str,
    user_id: str = Query(..., description="ID do usuário para validação"),
    _: bool = Depends(verify_internal_api_key),
    service: WithdrawalService = Depends(get_withdrawal_service),
):
    """
    Consulta detalhes de um saque.

    **Endpoint interno** - chamado pelo Laravel.

    Args:
        withdrawal_id: ID do saque
        user_id: ID do usuário (para validação de ownership)

    Returns:
        WithdrawalResponse com dados completos do saque
    """
    withdrawal = await service.get_withdrawal(withdrawal_id)

    if not withdrawal:
        raise HTTPException(status_code=404, detail="Saque não encontrado")

    if withdrawal.user_id != user_id:
        raise HTTPException(status_code=403, detail="Acesso negado")

    return WithdrawalResponse.from_withdrawal(withdrawal)


@router.get("/{withdrawal_id}/status", response_model=WithdrawalStatusResponse)
async def get_withdrawal_status(
    withdrawal_id: str,
    user_id: str = Query(..., description="ID do usuário para validação"),
    _: bool = Depends(verify_internal_api_key),
    service: WithdrawalService = Depends(get_withdrawal_service),
):
    """
    Consulta status simplificado de um saque.

    **Endpoint interno** - chamado pelo Laravel.
    Endpoint otimizado para polling frequente.

    Args:
        withdrawal_id: ID do saque
        user_id: ID do usuário (para validação de ownership)

    Returns:
        WithdrawalStatusResponse com status atual
    """
    withdrawal = await service.get_withdrawal(withdrawal_id)

    if not withdrawal:
        raise HTTPException(status_code=404, detail="Saque não encontrado")

    if withdrawal.user_id != user_id:
        raise HTTPException(status_code=403, detail="Acesso negado")

    breakdown = FeeBreakdown(
        requested_amount=withdrawal.requested_amount_cents / 100,
        partner_fee=withdrawal.partner_fee_cents / 100,
        eulen_fee=withdrawal.eulen_fee_cents / 100,
        total_fee=(withdrawal.partner_fee_cents + withdrawal.eulen_fee_cents) / 100,
        total_depix=withdrawal.total_depix_cents / 100,
    )

    return WithdrawalStatusResponse(
        id=withdrawal.id,
        status=withdrawal.status.value,
        breakdown=breakdown,
        user_tx_id=withdrawal.user_tx_id,
        receipt_url=withdrawal.receipt_url,
        created_at=withdrawal.created_at,
        completed_at=withdrawal.completed_at,
    )


@router.get("", response_model=WithdrawalListResponse)
async def list_withdrawals(
    user_id: str = Query(..., description="ID do usuário"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    limit: int = Query(20, ge=1, le=100, description="Limite de resultados"),
    offset: int = Query(0, ge=0, description="Offset para paginação"),
    _: bool = Depends(verify_internal_api_key),
    service: WithdrawalService = Depends(get_withdrawal_service),
):
    """
    Lista saques do usuário.

    **Endpoint interno** - chamado pelo Laravel.

    Args:
        user_id: ID do usuário
        status: Filtrar por status (pending, completed, etc.)
        limit: Limite de resultados (default: 20, max: 100)
        offset: Offset para paginação

    Returns:
        WithdrawalListResponse com lista de saques
    """
    # Converter status string para enum
    status_enum = None
    if status:
        try:
            status_enum = WithdrawalStatus(status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Status inválido: {status}. Valores válidos: {[s.value for s in WithdrawalStatus]}",
            )

    withdrawals = await service.list_withdrawals(
        user_id=user_id,
        status=status_enum,
        limit=limit,
        offset=offset,
    )

    return WithdrawalListResponse(
        items=[WithdrawalResponse.from_withdrawal(w) for w in withdrawals],
        total=len(withdrawals),
        limit=limit,
        offset=offset,
    )


@router.post("/{withdrawal_id}/cancel")
async def cancel_withdrawal(
    withdrawal_id: str,
    request: CancelWithdrawalRequest,
    _: bool = Depends(verify_internal_api_key),
    service: WithdrawalService = Depends(get_withdrawal_service),
):
    """
    Cancela um saque pendente.

    **Endpoint interno** - chamado pelo Laravel.
    Só pode cancelar saques com status 'pending' (antes de enviar DePix).

    Args:
        withdrawal_id: ID do saque
        user_id: ID do usuário (no body)

    Returns:
        Mensagem de confirmação
    """
    success = await service.cancel_withdrawal(
        withdrawal_id=withdrawal_id,
        user_id=request.user_id,
    )

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Não foi possível cancelar o saque. Verifique se o saque existe e está pendente.",
        )

    return {"message": "Saque cancelado com sucesso"}


@router.post("/estimate-fee", response_model=EstimateFeeResponse)
async def estimate_fee(
    request: EstimateFeeRequest,
    service: WithdrawalService = Depends(get_withdrawal_service),
):
    """
    Estima as taxas para um saque.

    **Endpoint público** - não requer autenticação.
    Útil para exibir preview ao usuário antes de criar o saque.

    Args:
        amount_reais: Valor a receber em reais

    Returns:
        EstimateFeeResponse com breakdown das taxas
    """
    amount_cents = int(request.amount_reais * 100)
    fees = service.calculate_fees(amount_cents)

    breakdown = FeeBreakdown(
        requested_amount=fees["requested_amount_cents"] / 100,
        partner_fee=fees["partner_fee_cents"] / 100,
        eulen_fee=fees["eulen_fee_cents"] / 100,
        total_fee=fees["total_fee_cents"] / 100,
        total_depix=fees["total_depix_cents"] / 100,
    )

    return EstimateFeeResponse(breakdown=breakdown)


# ===== Response Model para Limite =====

class DailyLimitResponse(BaseModel):
    """Resposta com informações de limite diário."""

    tax_number: str = Field(..., description="CPF/CNPJ (mascarado)")
    daily_limit_cents: int = Field(..., description="Limite diário em centavos")
    daily_volume_cents: int = Field(..., description="Volume já utilizado hoje em centavos")
    remaining_cents: int = Field(..., description="Limite restante em centavos")
    daily_limit_reais: float = Field(..., description="Limite diário em reais")
    daily_volume_reais: float = Field(..., description="Volume já utilizado hoje em reais")
    remaining_reais: float = Field(..., description="Limite restante em reais")
    has_euid: bool = Field(..., description="Se tem EUID da Eulen cadastrado")


@router.get("/limit/{tax_number}", response_model=DailyLimitResponse)
async def get_daily_limit(
    tax_number: str,
    _: bool = Depends(verify_internal_api_key),
    service: WithdrawalService = Depends(get_withdrawal_service),
):
    """
    Consulta o limite diário disponível para um CPF/CNPJ.

    **Endpoint interno** - chamado pelo Laravel/Frontend.
    Útil para exibir limite disponível antes de criar o saque.

    Args:
        tax_number: CPF ou CNPJ (com ou sem formatação)

    Returns:
        DailyLimitResponse com limite e volume utilizado
    """
    # Limpar formatação
    clean_tax = tax_number.replace(".", "").replace("-", "").replace("/", "")

    if len(clean_tax) not in [11, 14]:
        raise HTTPException(
            status_code=400,
            detail="CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos",
        )

    limit_record = await service.get_or_create_daily_limit(clean_tax)

    daily_limit = limit_record.max_daily_cents
    daily_volume = limit_record.daily_volume_cents
    remaining = max(0, daily_limit - daily_volume)

    # Mascarar CPF/CNPJ para exibição
    if len(clean_tax) == 11:
        masked = f"{clean_tax[:3]}.***.***-{clean_tax[-2:]}"
    else:
        masked = f"{clean_tax[:2]}.***.***/{clean_tax[8:12]}-{clean_tax[-2:]}"

    return DailyLimitResponse(
        tax_number=masked,
        daily_limit_cents=daily_limit,
        daily_volume_cents=daily_volume,
        remaining_cents=remaining,
        daily_limit_reais=daily_limit / 100,
        daily_volume_reais=daily_volume / 100,
        remaining_reais=remaining / 100,
        has_euid=limit_record.euid is not None,
    )


# ===== Endpoints Admin (para Laravel admin) =====

@router.get("/admin/pending", response_model=WithdrawalListResponse)
async def list_pending_withdrawals(
    limit: int = Query(50, ge=1, le=100),
    _: bool = Depends(verify_internal_api_key),
    service: WithdrawalService = Depends(get_withdrawal_service),
):
    """
    Lista todos os saques pendentes (admin).

    **Endpoint interno** - chamado pelo Laravel admin.
    """
    withdrawals = await service.get_pending_withdrawals()

    return WithdrawalListResponse(
        items=[WithdrawalResponse.from_withdrawal(w) for w in withdrawals[:limit]],
        total=len(withdrawals),
        limit=limit,
        offset=0,
    )


@router.get("/admin/by-address/{address}", response_model=WithdrawalResponse)
async def get_withdrawal_by_address(
    address: str,
    _: bool = Depends(verify_internal_api_key),
    service: WithdrawalService = Depends(get_withdrawal_service),
):
    """
    Busca saque pelo endereço Liquid (admin).

    **Endpoint interno** - usado para verificar depósitos.
    """
    withdrawal = await service.get_withdrawal_by_address(address)

    if not withdrawal:
        raise HTTPException(status_code=404, detail="Saque não encontrado")

    return WithdrawalResponse.from_withdrawal(withdrawal)
