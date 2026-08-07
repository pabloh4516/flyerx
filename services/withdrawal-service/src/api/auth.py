"""
Autenticação interna por API Key.
Usado para comunicação Laravel -> Python (microserviço).
"""

import logging
from typing import Optional

from fastapi import Header, HTTPException, status

from src.config.settings import settings

logger = logging.getLogger(__name__)


async def verify_internal_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> bool:
    """
    Verifica a API Key interna.

    O Laravel deve enviar o header: X-API-Key: <chave>

    Raises:
        HTTPException: Se a chave for inválida ou ausente
    """
    if not x_api_key:
        logger.warning("Requisição sem API Key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key não fornecida",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    if x_api_key != settings.internal_api_key:
        logger.warning(f"API Key inválida: {x_api_key[:10]}...")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API Key inválida",
        )

    return True


async def verify_api_key_optional(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> bool:
    """
    Verifica API Key de forma opcional (para endpoints de health check).
    Retorna True se válida, False se ausente.

    Raises:
        HTTPException: Se a chave for fornecida mas inválida
    """
    if not x_api_key:
        return False

    if x_api_key != settings.internal_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API Key inválida",
        )

    return True
