"""Initial migration - Create withdrawals and transaction_logs tables

Revision ID: 001_initial
Revises:
Create Date: 2024-06-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Criar enum de status de saque
    withdrawal_status = postgresql.ENUM(
        "pending",
        "depix_received",
        "processing",
        "sent_to_eulen",
        "eulen_processing",
        "completed",
        "failed",
        "refunded",
        "expired",
        "canceled",
        name="withdrawalstatus",
    )
    withdrawal_status.create(op.get_bind(), checkfirst=True)

    # Criar enum de tipo de transação
    transaction_type = postgresql.ENUM(
        "received",
        "sent",
        "fee",
        name="transactiontype",
    )
    transaction_type.create(op.get_bind(), checkfirst=True)

    # Criar tabela withdrawals
    op.create_table(
        "withdrawals",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("pix_key", sa.String(100), nullable=False),
        sa.Column("pix_key_type", sa.String(20), nullable=False),
        sa.Column("beneficiary_tax_number", sa.String(14), nullable=False),
        sa.Column(
            "requested_amount_cents",
            sa.BigInteger(),
            nullable=False,
            comment="Valor que o usuário quer receber em PIX",
        ),
        sa.Column(
            "partner_fee_cents",
            sa.BigInteger(),
            nullable=False,
            default=0,
            comment="Taxa do parceiro Flyerx",
        ),
        sa.Column(
            "eulen_fee_cents",
            sa.BigInteger(),
            nullable=False,
            default=0,
            comment="Taxa da Eulen",
        ),
        sa.Column(
            "total_depix_cents",
            sa.BigInteger(),
            nullable=False,
            comment="Total de DePix que o usuário deve enviar",
        ),
        sa.Column(
            "flyerx_address",
            sa.String(150),
            nullable=False,
            unique=True,
            comment="Endereço LWK gerado para este saque",
        ),
        sa.Column(
            "flyerx_address_index",
            sa.Integer(),
            nullable=False,
            comment="Índice HD do endereço",
        ),
        sa.Column(
            "eulen_deposit_address",
            sa.String(150),
            nullable=True,
            comment="Endereço da Eulen para enviar DePix",
        ),
        sa.Column(
            "eulen_withdrawal_id",
            sa.String(100),
            nullable=True,
            comment="ID do saque na Eulen",
        ),
        sa.Column(
            "user_tx_id",
            sa.String(100),
            nullable=True,
            comment="TX ID do usuário → Flyerx",
        ),
        sa.Column(
            "flyerx_to_eulen_tx_id",
            sa.String(100),
            nullable=True,
            comment="TX ID do Flyerx → Eulen",
        ),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "depix_received",
                "processing",
                "sent_to_eulen",
                "eulen_processing",
                "completed",
                "failed",
                "refunded",
                "expired",
                "canceled",
                name="withdrawalstatus",
                create_type=False,
            ),
            nullable=False,
            default="pending",
        ),
        sa.Column(
            "status_history",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            default=[],
            comment="Histórico de mudanças de status",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Data de expiração",
        ),
        sa.Column(
            "user_deposit_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Quando o usuário enviou DePix",
        ),
        sa.Column(
            "sent_to_eulen_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Quando enviamos para Eulen",
        ),
        sa.Column(
            "completed_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Quando o PIX foi enviado",
        ),
        sa.Column(
            "error_message",
            sa.Text(),
            nullable=True,
            comment="Mensagem de erro se falhou",
        ),
        sa.Column(
            "retry_count",
            sa.Integer(),
            nullable=False,
            default=0,
            comment="Número de tentativas",
        ),
        sa.Column(
            "receipt_url",
            sa.String(500),
            nullable=True,
            comment="URL do comprovante PIX",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Criar índices
    op.create_index("idx_withdrawals_user_id", "withdrawals", ["user_id"])
    op.create_index("idx_withdrawals_status", "withdrawals", ["status"])
    op.create_index("idx_withdrawals_flyerx_address", "withdrawals", ["flyerx_address"])
    op.create_index("idx_withdrawals_eulen_withdrawal_id", "withdrawals", ["eulen_withdrawal_id"])
    op.create_index(
        "idx_withdrawals_status_created",
        "withdrawals",
        ["status", "created_at"],
    )
    op.create_index(
        "idx_withdrawals_user_status",
        "withdrawals",
        ["user_id", "status"],
    )

    # Criar tabela transaction_logs
    op.create_table(
        "transaction_logs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column(
            "withdrawal_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("withdrawals.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "type",
            sa.Enum(
                "received",
                "sent",
                "fee",
                name="transactiontype",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("tx_id", sa.String(100), nullable=True),
        sa.Column("from_address", sa.String(150), nullable=True),
        sa.Column("to_address", sa.String(150), nullable=True),
        sa.Column("amount_cents", sa.BigInteger(), nullable=False),
        sa.Column("confirmed", sa.Boolean(), nullable=False, default=False),
        sa.Column("block_height", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Criar índices
    op.create_index("idx_transaction_logs_withdrawal_id", "transaction_logs", ["withdrawal_id"])
    op.create_index("idx_transaction_logs_tx_id", "transaction_logs", ["tx_id"])


def downgrade() -> None:
    # Remover tabelas
    op.drop_table("transaction_logs")
    op.drop_table("withdrawals")

    # Remover enums
    op.execute("DROP TYPE IF EXISTS transactiontype")
    op.execute("DROP TYPE IF EXISTS withdrawalstatus")
