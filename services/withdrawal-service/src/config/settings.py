"""
Configurações da aplicação Flyerx Backend.
Carrega variáveis de ambiente e define valores padrão.
"""

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações gerais da aplicação."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ===== Aplicação =====
    app_env: str = Field(default="development")
    app_debug: bool = Field(default=False)
    app_secret_key: str = Field(default="change-me-in-production")
    app_host: str = Field(default="0.0.0.0")
    app_port: int = Field(default=8000)

    # ===== Banco de Dados =====
    database_url: str = Field(
        default="postgresql+asyncpg://flyerx:flyerx@localhost:5432/flyerx"
    )

    # ===== Redis =====
    redis_url: str = Field(default="redis://localhost:6379/0")

    # ===== LWK - Liquid Wallet Kit =====
    lwk_network: str = Field(default="liquid-testnet")
    lwk_electrum_url: str = Field(default="blockstream.info:465")
    lwk_mnemonic: str = Field(default="")

    # ===== API Eulen =====
    eulen_api_url: str = Field(default="https://depix.eulen.app/api")
    eulen_api_token: str = Field(default="")
    eulen_mock_mode: bool = Field(default=False, description="Ativar modo mock para testes")

    # ===== Taxas do Parceiro =====
    partner_withdraw_fee_percent: float = Field(default=0.015)  # 1.5%
    partner_withdraw_fee_fixed_cents: int = Field(default=0)
    partner_withdraw_fee_min_cents: int = Field(default=50)  # R$ 0,50

    # ===== Worker =====
    withdrawal_poll_interval_seconds: int = Field(default=10)
    withdrawal_expiration_hours: int = Field(default=1)

    # ===== CORS =====
    cors_origins: str = Field(default="http://localhost:3000,http://localhost:3001")

    # ===== Autenticação Interna (API Key) =====
    internal_api_key: str = Field(
        default="flyerx-internal-dev-key-2024",
        description="API Key para comunicação Laravel -> Python"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Retorna lista de origens CORS permitidas."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_development(self) -> bool:
        """Verifica se está em ambiente de desenvolvimento."""
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        """Verifica se está em ambiente de produção."""
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """
    Retorna instância cacheada das configurações.
    Usar esta função para obter configurações em vez de instanciar Settings diretamente.
    """
    return Settings()


# Instância global para imports diretos
settings = get_settings()
