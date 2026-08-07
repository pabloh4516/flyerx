import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listTransactions } from '../../lib/api/wallet';
import { formatCurrency, formatDate } from '../../lib/utils/format';
import type { Transaction, TransactionType, TransactionStatus } from '../../types';

const statusConfig: Record<TransactionStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  PROCESSING: { label: 'Processando', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Concluído', color: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Falhou', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-700' },
  EXPIRED: { label: 'Expirado', color: 'bg-gray-100 text-gray-700' },
};

const FILTERS: { value: TransactionType | undefined; label: string }[] = [
  { value: undefined, label: 'Todos' },
  { value: 'DEPOSIT', label: 'Depósitos' },
  { value: 'WITHDRAWAL', label: 'Saques' },
];

export default function HistoryScreen() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<TransactionType | undefined>(undefined);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['transactions', { type: filter, limit: 50 }],
    queryFn: () => listTransactions({ limit: 50 }),
  });

  const transactions = data?.data ?? [];

  // Filtrar no client já que a API não suporta filtro de tipo
  const filteredTransactions = filter
    ? transactions.filter((tx) => tx.type === filter)
    : transactions;

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isDeposit = item.type === 'DEPOSIT';
    const status = statusConfig[item.status];

    return (
      <TouchableOpacity
        className="bg-white p-4 border-b border-gray-100"
        onPress={() => setSelectedTransaction(item)}
      >
        <View className="flex-row items-center">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDeposit ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <Text>{isDeposit ? '⬇️' : '⬆️'}</Text>
          </View>

          <View className="flex-1 ml-3">
            <View className="flex-row items-center">
              <Text className="font-medium text-gray-900">
                {isDeposit ? 'Depósito' : 'Saque'}
              </Text>
              <View className={`ml-2 px-2 py-0.5 rounded ${status.color}`}>
                <Text className="text-xs">{status.label}</Text>
              </View>
            </View>
            <Text className="text-xs text-gray-500 mt-1">
              {formatDate(item.createdAt)}
            </Text>
          </View>

          <Text
            className={`font-semibold ${
              isDeposit ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isDeposit ? '+' : '-'} {formatCurrency(item.amount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View className="flex-1 bg-gray-50">
        {/* Filtros */}
        <View className="bg-white p-4 border-b border-gray-100">
          <View className="flex-row space-x-2">
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.label}
                className={`px-4 py-2 rounded-full ${
                  filter === f.value
                    ? 'bg-primary'
                    : 'bg-gray-100'
                }`}
                onPress={() => setFilter(f.value)}
              >
                <Text
                  className={filter === f.value ? 'text-white' : 'text-gray-700'}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lista */}
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />
          }
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Text className="text-gray-500">Nenhuma transação encontrada</Text>
            </View>
          }
        />
      </View>

      {/* Modal de detalhes */}
      <Modal
        visible={!!selectedTransaction}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <TouchableOpacity
          className="flex-1 justify-end bg-black/50"
          activeOpacity={1}
          onPress={() => setSelectedTransaction(null)}
        >
          <View className="bg-white rounded-t-3xl p-6">
            {selectedTransaction && (
              <>
                <Text className="text-xl font-bold text-gray-900 text-center mb-4">
                  Detalhes da transação
                </Text>

                <View className="space-y-4">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Tipo</Text>
                    <Text className="font-medium">
                      {selectedTransaction.type === 'DEPOSIT' ? 'Depósito' : 'Saque'}
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Status</Text>
                    <View
                      className={`px-2 py-0.5 rounded ${
                        statusConfig[selectedTransaction.status].color
                      }`}
                    >
                      <Text className="text-sm">
                        {statusConfig[selectedTransaction.status].label}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Valor</Text>
                    <Text className="font-medium">
                      {formatCurrency(selectedTransaction.amount)}
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Taxa</Text>
                    <Text className="font-medium">
                      {formatCurrency(selectedTransaction.fee)}
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Valor líquido</Text>
                    <Text className="font-bold text-lg">
                      {formatCurrency(selectedTransaction.netAmount)}
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Data</Text>
                    <Text className="font-medium">
                      {formatDate(selectedTransaction.createdAt)}
                    </Text>
                  </View>

                  {selectedTransaction.completedAt && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Concluído em</Text>
                      <Text className="font-medium">
                        {formatDate(selectedTransaction.completedAt)}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  className="mt-6 bg-primary rounded-lg py-4"
                  onPress={() => setSelectedTransaction(null)}
                >
                  <Text className="text-white text-center font-semibold">
                    Fechar
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
