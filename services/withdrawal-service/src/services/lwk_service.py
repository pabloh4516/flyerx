"""
Serviço de integração com LWK (Liquid Wallet Kit).
Gerencia carteira Liquid para receber e enviar DePix.
"""

import logging
from dataclasses import dataclass
from typing import Optional, Tuple

from src.config.settings import settings

logger = logging.getLogger(__name__)


@dataclass
class LWKBalance:
    """Balanço da carteira LWK."""

    confirmed: int  # Satoshis confirmados
    unconfirmed: int  # Satoshis não confirmados

    @property
    def total(self) -> int:
        return self.confirmed + self.unconfirmed


@dataclass
class LWKTransaction:
    """Informações de uma transação."""

    txid: str
    confirmations: int
    amount: int  # Satoshis


class LWKService:
    """
    Serviço para interagir com carteira Liquid via LWK.

    Responsabilidades:
    - Gerar novos endereços para receber DePix
    - Verificar balanços de endereços
    - Enviar DePix para endereços externos (Eulen)
    - Monitorar transações
    """

    # Arquivo para persistir o último índice usado
    INDEX_FILE = "lwk_address_index.txt"

    def __init__(self) -> None:
        """Inicializa o serviço LWK."""
        self._initialized = False
        self._wollet = None
        self._signer = None
        self._client = None
        self._network = None
        self._address_index = self._load_index()

    def _load_index(self) -> int:
        """Carrega o último índice usado do arquivo."""
        try:
            with open(self.INDEX_FILE, "r") as f:
                index = int(f.read().strip())
                logger.debug(f"Índice carregado do arquivo: {index}")
                return index
        except (FileNotFoundError, ValueError):
            logger.debug("Arquivo de índice não encontrado, começando do 0")
            return 0

    def _save_index(self) -> None:
        """Salva o índice atual no arquivo."""
        try:
            with open(self.INDEX_FILE, "w") as f:
                f.write(str(self._address_index))
            logger.debug(f"Índice salvo: {self._address_index}")
        except Exception as e:
            logger.error(f"Erro ao salvar índice: {e}")

    def initialize(self) -> None:
        """
        Inicializa a carteira LWK.
        Deve ser chamado antes de usar outros métodos.
        """
        if self._initialized:
            return

        if not settings.lwk_mnemonic:
            logger.warning("LWK mnemonic não configurado. Usando modo mock.")
            self._initialized = True
            return

        try:
            import lwk

            # Configurar rede
            if settings.lwk_network == "liquid":
                self._network = lwk.Network.mainnet()
            else:
                self._network = lwk.Network.testnet()

            # Criar signer a partir do mnemonic
            mnemonic = lwk.Mnemonic(settings.lwk_mnemonic)
            self._signer = lwk.Signer(mnemonic, self._network)

            # Criar descriptor para watch-only wallet
            descriptor = self._signer.wpkh_slip77_descriptor()
            self._wollet = lwk.Wollet(self._network, descriptor, None)

            # Cliente Electrum (tls=True para conexão segura, validate_domain=True para validar certificado)
            self._client = lwk.ElectrumClient(settings.lwk_electrum_url, tls=True, validate_domain=True)

            self._initialized = True
            logger.info(f"LWK inicializado na rede {settings.lwk_network}")

        except ImportError:
            logger.warning("Pacote lwk não instalado. Usando modo mock.")
            self._initialized = True
        except Exception as e:
            logger.error(f"Erro ao inicializar LWK: {e}")
            raise

    def sync(self) -> None:
        """Sincroniza a carteira com a blockchain."""
        if not self._wollet or not self._client:
            logger.debug("LWK em modo mock, sync ignorado")
            return

        try:
            # Usar full_scan_to_index para garantir que escaneamos até o último índice usado
            # Adiciona margem de 5 para segurança
            scan_index = max(self._address_index + 5, 25)
            update = self._client.full_scan_to_index(self._wollet, scan_index)
            if update:
                self._wollet.apply_update(update)
            logger.debug(f"LWK sincronizado até índice {scan_index}")
        except Exception as e:
            logger.error(f"Erro ao sincronizar LWK: {e}")
            raise

    def get_new_address(self) -> Tuple[str, int]:
        """
        Gera um novo endereço Liquid.

        Returns:
            Tuple[str, int]: (endereço, índice HD)
        """
        if not self._wollet:
            # Modo mock - gerar endereço único com UUID
            import uuid
            self._address_index += 1
            self._save_index()  # Persistir índice
            unique_id = uuid.uuid4().hex[:16]
            mock_address = f"lq1qqflyerx_mock_{unique_id}"
            logger.debug(f"Modo mock: gerado endereço {mock_address}")
            return mock_address, self._address_index

        try:
            # Incrementar índice e gerar novo endereço
            self._address_index += 1
            self._save_index()  # Persistir índice
            address = self._wollet.address(self._address_index)
            addr_str = str(address.address())
            index = address.index()
            logger.info(f"Novo endereço LWK gerado: {addr_str[:20]}... (index: {index})")
            return addr_str, index
        except Exception as e:
            logger.error(f"Erro ao gerar endereço LWK: {e}")
            raise

    def get_address_balance(self, address: str) -> int:
        """
        Retorna o balanço de um endereço específico em centavos.
        Para DePix: considera o asset DePix, não L-BTC.

        Args:
            address: Endereço Liquid

        Returns:
            int: Balanço em centavos (valor DePix / 100_000_000 * 100)
        """
        if not self._wollet:
            # Modo mock - retornar 0
            logger.debug(f"Modo mock: balanço de {address} = 0")
            return 0

        try:
            self.sync()

            # Verificar UTXOs do endereço
            balance = 0
            for utxo in self._wollet.utxos():
                # Verificar se a UTXO pertence ao endereço
                utxo_address = str(utxo.address())
                if utxo_address == address:
                    # Obter valor desbloqueado (unblinded)
                    unblinded = utxo.unblinded()
                    value = unblinded.value()
                    asset = unblinded.asset()

                    # DePix usa 8 casas decimais como Bitcoin
                    # 1150000000 = R$ 11,50 = 1150 centavos
                    # Convertemos para centavos: value / 100_000_000 * 100 = value / 1_000_000
                    balance_cents = value // 1_000_000

                    logger.debug(
                        f"UTXO encontrada: asset={asset[:16]}... "
                        f"value={value} balance_cents={balance_cents}"
                    )
                    balance += balance_cents

            logger.debug(f"Balanço de {address[:20]}...: {balance} centavos")
            return balance

        except Exception as e:
            logger.error(f"Erro ao obter balanço: {e}")
            raise

    def get_total_balance(self) -> LWKBalance:
        """
        Retorna o balanço total da carteira.

        Returns:
            LWKBalance: Balanço confirmado e não confirmado
        """
        if not self._wollet:
            return LWKBalance(confirmed=0, unconfirmed=0)

        try:
            self.sync()
            balance = self._wollet.balance()
            # LWK pode retornar dict ou objeto dependendo da versão
            if isinstance(balance, dict):
                confirmed = balance.get("confirmed", 0)
                unconfirmed = balance.get("unconfirmed", 0)
            else:
                confirmed = getattr(balance, "confirmed", 0)
                unconfirmed = getattr(balance, "unconfirmed", 0)
            return LWKBalance(
                confirmed=confirmed,
                unconfirmed=unconfirmed,
            )
        except Exception as e:
            logger.error(f"Erro ao obter balanço total: {e}")
            raise

    def send(
        self,
        to_address: str,
        amount_sats: int,
        asset_id: Optional[str] = None,
    ) -> str:
        """
        Envia DePix para um endereço.

        Args:
            to_address: Endereço de destino
            amount_sats: Valor em satoshis (= centavos para DePix)
            asset_id: ID do asset (None = L-BTC/DePix padrão)

        Returns:
            str: Transaction ID
        """
        if not self._wollet or not self._signer or not self._client:
            # Modo mock
            import uuid

            mock_txid = f"mock_tx_{uuid.uuid4().hex[:16]}"
            logger.info(f"Modo mock: enviando {amount_sats} sats para {to_address[:20]}...")
            logger.info(f"Modo mock: txid = {mock_txid}")
            return mock_txid

        try:
            self.sync()

            # Asset ID padrão (L-BTC para mainnet)
            if asset_id is None:
                asset_id = self._network.policy_asset()

            # Importar lwk aqui para ter acesso às classes
            import lwk

            # Criar transação
            builder = lwk.TxBuilder(self._network)
            builder.add_recipient(
                lwk.Address(to_address),
                amount_sats,
                asset_id,
            )

            # Construir PSET
            pset = builder.finish(self._wollet)

            # Assinar
            signed_pset = self._signer.sign(pset)

            # Finalizar (retorna Pset finalizado)
            finalized_pset = self._wollet.finalize(signed_pset)

            # Extrair transação do PSET
            tx = finalized_pset.extract_tx()

            # Broadcast
            txid = self._client.broadcast(tx)

            logger.info(f"Transação enviada: {txid}")
            return txid

        except Exception as e:
            logger.error(f"Erro ao enviar transação: {e}")
            raise

    def check_transaction(self, txid: str) -> Optional[LWKTransaction]:
        """
        Verifica status de uma transação.

        Args:
            txid: Transaction ID

        Returns:
            LWKTransaction ou None se não encontrada
        """
        if not self._wollet:
            # Modo mock
            return LWKTransaction(txid=txid, confirmations=6, amount=0)

        try:
            self.sync()

            for tx in self._wollet.transactions():
                if tx.txid() == txid:
                    return LWKTransaction(
                        txid=txid,
                        confirmations=tx.confirmations(),
                        amount=tx.balance().get(self._network.policy_asset(), 0),
                    )

            return None

        except Exception as e:
            logger.error(f"Erro ao verificar transação: {e}")
            raise

    def is_transaction_confirmed(
        self,
        txid: str,
        min_confirmations: int = 1,
    ) -> bool:
        """
        Verifica se uma transação foi confirmada.

        Args:
            txid: Transaction ID
            min_confirmations: Número mínimo de confirmações

        Returns:
            bool: True se confirmada
        """
        tx = self.check_transaction(txid)
        if tx is None:
            return False
        return tx.confirmations >= min_confirmations

    def validate_address(self, address: str) -> bool:
        """
        Valida se um endereço Liquid é válido.

        Args:
            address: Endereço para validar

        Returns:
            bool: True se válido
        """
        if not address:
            return False

        # Prefixos válidos para Liquid
        valid_prefixes = ["lq1", "ex1", "VJL", "VTp", "ert1", "el1"]

        if not any(address.startswith(p) for p in valid_prefixes):
            return False

        # Tamanho mínimo
        if len(address) < 40:
            return False

        return True


# Instância singleton
_lwk_service: Optional[LWKService] = None


def get_lwk_service() -> LWKService:
    """Retorna instância singleton do LWKService."""
    global _lwk_service
    if _lwk_service is None:
        _lwk_service = LWKService()
        _lwk_service.initialize()
    return _lwk_service
