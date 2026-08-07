"""
Modelos de banco de dados para saques (withdrawals).
"""

import enum
from datetime import datetime
from typing import Any, Optional
from uuid import uuid4

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.config.database import Base


class WithdrawalStatus(str, enum.Enum):
    """Status possíveis de um saque."""

    PENDING = "pending"  # Aguardando usuário enviar DePix
    DEPIX_RECEIVED = "depix_received"  # DePix recebido no endereço Flyerx
    PROCESSING = "processing"  # Processando envio para Eulen
    SENT_TO_EULEN = "sent_to_eulen"  # DePix enviado para Eulen
    EULEN_PROCESSING = "eulen_processing"  # Eulen processando PIX
    COMPLETED = "completed"  # PIX enviado com sucesso
    FAILED = "failed"  # Erro no processo
    REFUNDED = "refunded"  # Reembolsado ao usuário
    EXPIRED = "expired"  # Expirado (usuário não enviou DePix)
    CANCELED = "canceled"  # Cancelado pelo usuário


class TransactionType(str, enum.Enum):
    """Tipo de transação no log."""

    RECEIVED = "received"  # DePix recebido do usuário
    SENT = "sent"  # DePix enviado para Eulen
    FEE = "fee"  # Taxa separada


class Withdrawal(Base):
    """
    Modelo de saque (DePix → PIX).

    Representa uma solicitação de saque do usuário,
    incluindo todos os dados necessários para processar
    a transação via LWK e API Eulen.
    """

    __tablename__ = "withdrawals"

    # ===== Identificadores =====
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    # ===== Dados do Usuário =====
    user_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
    )
    pix_key: Mapped[str] = mapped_column(String(100), nullable=False)
    pix_key_type: Mapped[str] = mapped_column(String(20), nullable=False)
    beneficiary_tax_number: Mapped[str] = mapped_column(String(14), nullable=False)

    # ===== Valores em Centavos =====
    requested_amount_cents: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        comment="Valor que o usuário quer receber em PIX",
    )
    partner_fee_cents: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        default=0,
        comment="Taxa do parceiro Flyerx",
    )
    eulen_fee_cents: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        default=0,
        comment="Taxa da Eulen",
    )
    total_depix_cents: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        comment="Total de DePix que o usuário deve enviar",
    )

    # ===== Endereços Liquid =====
    flyerx_address: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
        index=True,
        comment="Endereço LWK gerado para este saque",
    )
    flyerx_address_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Índice HD do endereço",
    )
    eulen_deposit_address: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
        comment="Endereço da Eulen para enviar DePix",
    )

    # ===== IDs Externos =====
    eulen_withdrawal_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
        comment="ID do saque na Eulen",
    )

    # ===== Transações Blockchain =====
    user_tx_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="TX ID do usuário → Flyerx",
    )
    flyerx_to_eulen_tx_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="TX ID do Flyerx → Eulen",
    )

    # ===== Status =====
    status: Mapped[WithdrawalStatus] = mapped_column(
        Enum(WithdrawalStatus),
        nullable=False,
        default=WithdrawalStatus.PENDING,
        index=True,
    )
    status_history: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="Histórico de mudanças de status",
    )

    # ===== Timestamps =====
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Data de expiração (se usuário não enviar DePix)",
    )
    user_deposit_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Quando o usuário enviou DePix",
    )
    sent_to_eulen_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Quando enviamos para Eulen",
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Quando o PIX foi enviado",
    )

    # ===== Metadados =====
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Mensagem de erro se falhou",
    )
    retry_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Número de tentativas de processamento",
    )
    receipt_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="URL do comprovante PIX",
    )

    # ===== Relacionamentos =====
    transaction_logs: Mapped[list["TransactionLog"]] = relationship(
        "TransactionLog",
        back_populates="withdrawal",
        cascade="all, delete-orphan",
    )

    # ===== Índices =====
    __table_args__ = (
        Index("idx_withdrawals_status_created", "status", "created_at"),
        Index("idx_withdrawals_user_status", "user_id", "status"),
    )

    def add_status_history(self, new_status: WithdrawalStatus, message: str = "") -> None:
        """Adiciona entrada no histórico de status."""
        entry = {
            "status": new_status.value,
            "timestamp": datetime.utcnow().isoformat(),
            "message": message,
        }
        if self.status_history is None:
            self.status_history = []
        self.status_history.append(entry)

    def __repr__(self) -> str:
        return f"<Withdrawal(id={self.id}, status={self.status}, amount={self.requested_amount_cents})>"


class DailyWithdrawLimit(Base):
    """
    Rastreia o volume diário de saques por CPF/CNPJ.
    Usado para validar limites antes de criar saques.
    """

    __tablename__ = "daily_withdraw_limits"

    # CPF/CNPJ (sem formatação, apenas números)
    tax_number: Mapped[str] = mapped_column(
        String(14),
        primary_key=True,
    )

    # EUID da Eulen (capturado de depósitos, se disponível)
    euid: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        comment="Eulen User ID (capturado de depósitos)",
    )

    # Volume diário em centavos
    daily_volume_cents: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        default=0,
        comment="Volume de saques do dia atual",
    )

    # Limite máximo diário (padrão R$ 5.000)
    max_daily_cents: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        default=500000,  # R$ 5.000,00
        comment="Limite diário em centavos",
    )

    # Data do último reset (para saber quando zerar o volume)
    last_reset_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Data do último reset do volume diário",
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return f"<DailyWithdrawLimit(tax_number={self.tax_number}, volume={self.daily_volume_cents}, max={self.max_daily_cents})>"


class TransactionLog(Base):
    """
    Log de transações blockchain relacionadas a um saque.
    Registra todas as movimentações de DePix.
    """

    __tablename__ = "transaction_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    withdrawal_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("withdrawals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType),
        nullable=False,
    )

    tx_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    from_address: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
    )

    to_address: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
    )

    amount_cents: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    confirmed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    block_height: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # ===== Relacionamentos =====
    withdrawal: Mapped["Withdrawal"] = relationship(
        "Withdrawal",
        back_populates="transaction_logs",
    )

    def __repr__(self) -> str:
        return f"<TransactionLog(id={self.id}, type={self.type}, amount={self.amount_cents})>"
