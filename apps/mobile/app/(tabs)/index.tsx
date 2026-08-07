import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useAuthStore } from '../../stores/auth';
import { getBalance, listTransactions } from '../../lib/api/wallet';
import { formatCurrency } from '../../lib/utils/format';

export default function DashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const {
    data: balance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['balance'],
    queryFn: getBalance,
  });

  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', { limit: 5 }],
    queryFn: () => listTransactions({ limit: 5 }),
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['balance'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const transactions = transactionsData?.data ?? [];

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={isLoadingBalance}
          onRefresh={onRefresh}
        />
      }
    >
      <View className="p-4 space-y-4">
        {/* Greeting */}
        <View>
          <Text className="text-xl font-bold text-gray-900">
            Olá, {user?.name?.split(' ')[0]}!
          </Text>
          <Text className="text-gray-600">Bem-vindo ao Flyerx</Text>
        </View>

        {/* Balance Card */}
        <View className="bg-primary rounded-2xl p-6">
          <Text className="text-white/80 text-sm mb-1">Saldo total</Text>
          <Text className="text-white text-3xl font-bold">
            {isLoadingBalance
              ? '...'
              : formatCurrency(
                  (balance?.available ?? 0) +
                    (balance?.reserved ?? 0) +
                    (balance?.blocked ?? 0)
                )}
          </Text>

          <View className="flex-row mt-4 space-x-4">
            <View className="flex-1">
              <Text className="text-white/60 text-xs">Disponível</Text>
              <Text className="text-white font-medium">
                {isLoadingBalance ? '...' : formatCurrency(balance?.available ?? 0)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white/60 text-xs">Reservado</Text>
              <Text className="text-white font-medium">
                {isLoadingBalance ? '...' : formatCurrency(balance?.reserved ?? 0)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white/60 text-xs">Bloqueado</Text>
              <Text className="text-white font-medium">
                {isLoadingBalance ? '...' : formatCurrency(balance?.blocked ?? 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row space-x-4">
          <Link href="/(tabs)/deposit" asChild>
            <TouchableOpacity className="flex-1 bg-white rounded-xl p-4 items-center border border-gray-100">
              <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-2">
                <Text className="text-2xl">⬇️</Text>
              </View>
              <Text className="font-medium text-gray-900">Depositar</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(tabs)/withdraw" asChild>
            <TouchableOpacity className="flex-1 bg-white rounded-xl p-4 items-center border border-gray-100">
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
                <Text className="text-2xl">⬆️</Text>
              </View>
              <Text className="font-medium text-gray-900">Sacar</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Recent Transactions */}
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-semibold text-gray-900">Transações recentes</Text>
            <Link href="/(tabs)/history" asChild>
              <TouchableOpacity>
                <Text className="text-primary text-sm">Ver todas</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {isLoadingTransactions ? (
            <View className="py-4">
              <Text className="text-center text-gray-500">Carregando...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View className="py-8">
              <Text className="text-center text-gray-500">
                Nenhuma transação ainda
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {transactions.map((tx) => {
                const isDeposit = tx.type === 'DEPOSIT';
                return (
                  <View
                    key={tx.id}
                    className="flex-row items-center py-2"
                  >
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        isDeposit ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      <Text>{isDeposit ? '⬇️' : '⬆️'}</Text>
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="font-medium text-gray-900">
                        {isDeposit ? 'Depósito' : 'Saque'}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    <Text
                      className={`font-medium ${
                        isDeposit ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isDeposit ? '+' : '-'} {formatCurrency(tx.amount)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
