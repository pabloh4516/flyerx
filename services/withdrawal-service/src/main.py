"""
Flyerx Backend - Aplicação FastAPI principal.
API para processamento de saques DePix → PIX.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import health, withdrawals
from src.config.database import close_db, init_db
from src.config.settings import settings
from src.services.eulen_service import get_eulen_service
from src.services.lwk_service import get_lwk_service

# Configurar logging
logging.basicConfig(
    level=logging.DEBUG if settings.app_debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerencia o ciclo de vida da aplicação.
    Executa setup na inicialização e cleanup no shutdown.
    """
    # ===== Startup =====
    logger.info("=" * 50)
    logger.info("Flyerx Backend iniciando...")
    logger.info(f"Ambiente: {settings.app_env}")
    logger.info("=" * 50)

    # Inicializar banco de dados
    if settings.is_development:
        logger.info("Inicializando banco de dados (desenvolvimento)...")
        await init_db()

    # Inicializar LWK
    logger.info("Inicializando LWK...")
    try:
        lwk = get_lwk_service()
        balance = lwk.get_total_balance()
        logger.info(f"LWK inicializado. Balanço: {balance.total} sats")
    except Exception as e:
        logger.warning(f"LWK não inicializado: {e}")

    logger.info("Flyerx Backend pronto!")
    logger.info("=" * 50)

    yield  # Aplicação rodando

    # ===== Shutdown =====
    logger.info("Encerrando Flyerx Backend...")

    # Fechar conexões
    eulen = get_eulen_service()
    await eulen.close()

    await close_db()

    logger.info("Flyerx Backend encerrado.")


# ===== Criar aplicação =====

app = FastAPI(
    title="Flyerx LWK Microservice",
    description="""
    **Microserviço interno** para operações com Liquid Wallet Kit (LWK).

    ⚠️ Este serviço é chamado apenas pelo Laravel, não pelo frontend.

    ## Funcionalidades

    * **Criar saque**: Gera endereço Liquid para receber DePix
    * **Consultar status**: Acompanha o progresso do saque
    * **Estimar taxas**: Preview de taxas antes de criar saque

    ## Fluxo de Saque

    1. Laravel chama `POST /internal/withdrawals` com dados do PIX
    2. Python retorna endereço Liquid (flyerx_address)
    3. Usuário envia DePix para o endereço
    4. Worker detecta, separa taxa e envia para Eulen
    5. Eulen processa e envia PIX

    ## Autenticação

    Todas as rotas (exceto /health e /estimate-fee) requerem header:
    ```
    X-API-Key: <chave_configurada>
    ```
    """,
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ===== CORS =====

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Rotas =====

app.include_router(health.router)
app.include_router(withdrawals.router, prefix="/internal")


# ===== Exception Handler Global =====

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Captura todas as exceções e loga com traceback."""
    logger.error(f"Exceção não tratada em {request.method} {request.url}")
    logger.error(f"Tipo: {type(exc).__name__}")
    logger.error(f"Mensagem: {str(exc)}")
    logger.error(f"Traceback:\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor"},
    )


# ===== Middleware de logging (desenvolvimento) =====

if settings.is_development:

    @app.middleware("http")
    async def log_requests(request, call_next):
        """Log todas as requisições em desenvolvimento."""
        logger.debug(f"Request: {request.method} {request.url}")
        response = await call_next(request)
        logger.debug(f"Response: {response.status_code}")
        return response


# ===== Entry Point =====

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.is_development,
    )
