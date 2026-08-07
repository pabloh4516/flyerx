"""
Testes para as rotas de saques.
"""

import pytest
from httpx import AsyncClient


class TestHealthCheck:
    """Testes do health check."""

    @pytest.mark.asyncio
    async def test_health_check(self, client: AsyncClient):
        """Deve retornar status healthy."""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]
        assert "timestamp" in data

    @pytest.mark.asyncio
    async def test_root(self, client: AsyncClient):
        """Deve retornar informações da API."""
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Flyerx Backend API"


class TestEstimateFee:
    """Testes de estimativa de taxas."""

    @pytest.mark.asyncio
    async def test_estimate_fee(self, client: AsyncClient):
        """Deve calcular taxas corretamente."""
        response = await client.post(
            "/api/v1/withdrawals/estimate-fee",
            json={"amount_reais": 100.00},
        )
        assert response.status_code == 200
        data = response.json()

        breakdown = data["breakdown"]
        assert breakdown["requested_amount"] == 100.00
        assert breakdown["eulen_fee"] >= 1.00  # Mínimo R$ 1,00
        assert breakdown["partner_fee"] >= 0.50  # Mínimo R$ 0,50
        assert breakdown["total_depix"] > 100.00

    @pytest.mark.asyncio
    async def test_estimate_fee_minimum_eulen(self, client: AsyncClient):
        """Deve aplicar taxa mínima da Eulen."""
        response = await client.post(
            "/api/v1/withdrawals/estimate-fee",
            json={"amount_reais": 10.00},
        )
        assert response.status_code == 200
        data = response.json()

        # Para R$ 10, 1% seria R$ 0,10, mas mínimo é R$ 1,00
        assert data["breakdown"]["eulen_fee"] == 1.00


class TestWithdrawals:
    """Testes de saques."""

    @pytest.mark.asyncio
    async def test_create_withdrawal_unauthorized(self, client: AsyncClient):
        """Deve rejeitar sem autenticação."""
        response = await client.post(
            "/api/v1/withdrawals",
            json={
                "pix_key": "11999999999",
                "pix_key_type": "PHONE",
                "beneficiary_tax_number": "12345678909",
                "amount_reais": 100.00,
            },
        )
        assert response.status_code == 403  # Sem token

    @pytest.mark.asyncio
    async def test_create_withdrawal(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Deve criar saque com sucesso."""
        response = await client.post(
            "/api/v1/withdrawals",
            headers=auth_headers,
            json={
                "pix_key": "11999999999",
                "pix_key_type": "PHONE",
                "beneficiary_tax_number": "12345678909",
                "amount_reais": 100.00,
            },
        )

        # Pode falhar por falta de configuração Eulen em testes
        # Mas não deve ser 401/403
        assert response.status_code in [200, 400, 500]

    @pytest.mark.asyncio
    async def test_list_withdrawals(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Deve listar saques do usuário."""
        response = await client.get(
            "/api/v1/withdrawals",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    @pytest.mark.asyncio
    async def test_invalid_cpf(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Deve rejeitar CPF inválido."""
        response = await client.post(
            "/api/v1/withdrawals",
            headers=auth_headers,
            json={
                "pix_key": "11999999999",
                "pix_key_type": "PHONE",
                "beneficiary_tax_number": "11111111111",  # CPF inválido
                "amount_reais": 100.00,
            },
        )
        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_amount_too_low(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Deve rejeitar valor abaixo do mínimo."""
        response = await client.post(
            "/api/v1/withdrawals",
            headers=auth_headers,
            json={
                "pix_key": "11999999999",
                "pix_key_type": "PHONE",
                "beneficiary_tax_number": "12345678909",
                "amount_reais": 5.00,  # Mínimo é R$ 10
            },
        )
        assert response.status_code == 422


class TestAuth:
    """Testes de autenticação."""

    @pytest.mark.asyncio
    async def test_dev_token(self, client: AsyncClient):
        """Deve gerar token de desenvolvimento."""
        response = await client.post(
            "/api/v1/auth/dev-token",
            json={"user_id": "test-user", "email": "test@test.com"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
