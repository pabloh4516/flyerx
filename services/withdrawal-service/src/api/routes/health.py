"""
Rotas de health check e status.
"""

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.database import get_db
from src.config.settings import settings

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    """Response do health check."""

    status: str
    timestamp: str
    environment: str
    version: str
    database: str
    lwk: str


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check completo da aplicação.

    Verifica:
    - Conexão com banco de dados
    - Status do LWK
    """
    # Verificar banco de dados
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    # Verificar LWK
    lwk_status = "ok"
    try:
        from src.services.lwk_service import get_lwk_service

        lwk = get_lwk_service()
        if not lwk._initialized:
            lwk_status = "not_initialized"
    except Exception:
        lwk_status = "error"

    return HealthResponse(
        status="healthy" if db_status == "ok" else "degraded",
        timestamp=datetime.utcnow().isoformat(),
        environment=settings.app_env,
        version="0.1.0",
        database=db_status,
        lwk=lwk_status,
    )


@router.get("/")
async def root():
    """Rota raiz - informações básicas da API."""
    return {
        "name": "Flyerx Backend API",
        "version": "0.1.0",
        "description": "API para processamento de saques DePix → PIX",
        "docs": "/docs",
    }
