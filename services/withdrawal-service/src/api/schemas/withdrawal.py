"""
Schemas Pydantic para validação e serialização de saques.
"""

import re
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FeeBreakdown(BaseModel):
    """Detalhamento das taxas."""

    requested_amount: float = Field(..., description="Valor solicitado em reais")
    partner_fee: float = Field(..., description="Taxa do parceiro Flyerx em reais")
    eulen_fee: float = Field(..., description="Taxa da Eulen em reais")
    total_fee: float = Field(..., description="Total de taxas em reais")
    total_depix: float = Field(..., description="Total de DePix a enviar")


class CreateWithdrawalRequest(BaseModel):
    """Request para criar um novo saque."""

    pix_key: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Chave PIX do destinatário",
    )
    pix_key_type: str = Field(
        ...,
        pattern="^(CPF|CNPJ|EMAIL|PHONE|RANDOM)$",
        description="Tipo da chave PIX",
    )
    beneficiary_tax_number: str = Field(
        ...,
        min_length=11,
        max_length=14,
        description="CPF ou CNPJ do titular da chave PIX",
    )
    amount_reais: float = Field(
        ...,
        gt=0,
        le=6000,
        description="Valor a receber em reais (PIX)",
    )

    @field_validator("beneficiary_tax_number")
    @classmethod
    def validate_tax_number(cls, v: str) -> str:
        """Valida e limpa CPF/CNPJ."""
        # Remove caracteres não numéricos
        clean = re.sub(r"\D", "", v)

        if len(clean) == 11:
            # CPF
            if not cls._validate_cpf(clean):
                raise ValueError("CPF inválido")
        elif len(clean) == 14:
            # CNPJ
            if not cls._validate_cnpj(clean):
                raise ValueError("CNPJ inválido")
        else:
            raise ValueError("CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos")

        return clean

    @staticmethod
    def _validate_cpf(cpf: str) -> bool:
        """Valida CPF."""
        if len(cpf) != 11 or cpf == cpf[0] * 11:
            return False

        # Primeiro dígito verificador
        soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
        resto = (soma * 10) % 11
        if resto == 10:
            resto = 0
        if resto != int(cpf[9]):
            return False

        # Segundo dígito verificador
        soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
        resto = (soma * 10) % 11
        if resto == 10:
            resto = 0
        return resto == int(cpf[10])

    @staticmethod
    def _validate_cnpj(cnpj: str) -> bool:
        """Valida CNPJ."""
        if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
            return False

        # Primeiro dígito verificador
        pesos = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        soma = sum(int(cnpj[i]) * pesos[i] for i in range(12))
        resto = soma % 11
        digito1 = 0 if resto < 2 else 11 - resto
        if digito1 != int(cnpj[12]):
            return False

        # Segundo dígito verificador
        pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        soma = sum(int(cnpj[i]) * pesos[i] for i in range(13))
        resto = soma % 11
        digito2 = 0 if resto < 2 else 11 - resto
        return digito2 == int(cnpj[13])

    @field_validator("amount_reais")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        """Valida valor mínimo."""
        if v < 10:
            raise ValueError("Valor mínimo é R$ 10,00")
        return round(v, 2)


class WithdrawalResponse(BaseModel):
    """Response com dados do saque."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    flyerx_address: str = Field(..., description="Endereço Liquid para enviar DePix")
    breakdown: FeeBreakdown

    pix_key: str
    pix_key_type: str
    beneficiary_tax_number: str

    user_tx_id: Optional[str] = None
    eulen_withdrawal_id: Optional[str] = None
    receipt_url: Optional[str] = None

    created_at: datetime
    expires_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    @classmethod
    def from_withdrawal(cls, withdrawal: "Withdrawal") -> "WithdrawalResponse":
        """Cria response a partir do modelo de banco."""
        from src.models.withdrawal import Withdrawal

        breakdown = FeeBreakdown(
            requested_amount=withdrawal.requested_amount_cents / 100,
            partner_fee=withdrawal.partner_fee_cents / 100,
            eulen_fee=withdrawal.eulen_fee_cents / 100,
            total_fee=(withdrawal.partner_fee_cents + withdrawal.eulen_fee_cents) / 100,
            total_depix=withdrawal.total_depix_cents / 100,
        )

        return cls(
            id=withdrawal.id,
            status=withdrawal.status.value,
            flyerx_address=withdrawal.flyerx_address,
            breakdown=breakdown,
            pix_key=withdrawal.pix_key,
            pix_key_type=withdrawal.pix_key_type,
            beneficiary_tax_number=withdrawal.beneficiary_tax_number,
            user_tx_id=withdrawal.user_tx_id,
            eulen_withdrawal_id=withdrawal.eulen_withdrawal_id,
            receipt_url=withdrawal.receipt_url,
            created_at=withdrawal.created_at,
            expires_at=withdrawal.expires_at,
            completed_at=withdrawal.completed_at,
        )


class WithdrawalListResponse(BaseModel):
    """Response com lista de saques."""

    items: List[WithdrawalResponse]
    total: int
    limit: int
    offset: int


class WithdrawalStatusResponse(BaseModel):
    """Response simplificado de status."""

    id: str
    status: str
    breakdown: FeeBreakdown
    user_tx_id: Optional[str] = None
    receipt_url: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class EstimateFeeRequest(BaseModel):
    """Request para estimar taxas."""

    amount_reais: float = Field(..., gt=0, le=6000)


class EstimateFeeResponse(BaseModel):
    """Response com estimativa de taxas."""

    breakdown: FeeBreakdown
