import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createDeposit, getDeposit } from '../../lib/api/wallet';
import { formatCurrency } from '../../lib/utils/format';
import type { Deposit } from '../../types';

const QUICK_AMOUNTS = [50, 100, 200, 500];

export default function DepositScreen() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Polling do status do depósito
  const { data: depositStatus } = useQuery({
    queryKey: ['deposit', deposit?.id],
    queryFn: () => getDeposit(deposit!.id),
    enabled: !!deposit && (deposit.status === 'PENDING' || deposit.status === 'PROCESSING'),
    refetchInterval: 5000,
  });

  const createDepositMutation = useMutation({
    mutationFn: createDeposit,
    onSuccess: (data) => {
      setDeposit(data);
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erro ao criar depósito';
      Alert.alert('Erro', message);
    },
  });

  // Atualizar depósito quando o polling retornar novo status
  useEffect(() => {
    if (depositStatus) {
      setDeposit(depositStatus);
      if (depositStatus.status === 'COMPLETED') {
        Alert.alert('Sucesso', 'Depósito confirmado!');
        queryClient.invalidateQueries({ queryKey: ['balance'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      }
    }
  }, [depositStatus, queryClient]);

  // Timer de expiração
  useEffect(() => {
    if (!deposit?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(deposit.expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft(0);
        return;
      }

      setTimeLeft(Math.floor(diff / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deposit?.expiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = async () => {
    if (!deposit?.pixCopyPaste) return;

    await Clipboard.setStringAsync(deposit.pixCopyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCreateDeposit = () => {
    const value = parseFloat(amount.replace(',', '.'));
    if (!value || value < 10 || value > 50000) {
      Alert.alert('Erro', 'Valor deve ser entre R$ 10 e R$ 50.000');
      return;
    }
    createDepositMutation.mutate(value);
  };

  const handleNewDeposit = () => {
    setDeposit(null);
    setAmount('');
  };

  // Se tiver um depósito ativo, mostrar QR Code
  if (deposit) {
    const isActive = deposit.status === 'PENDING' || deposit.status === 'PROCESSING';

    return (
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4 space-y-4">
          <View className="bg-white rounded-xl p-6 items-center">
            {/* Valor */}
            <Text className="text-3xl font-bold text-gray-900">
              {formatCurrency(deposit.amount)}
            </Text>

            {/* Status */}
            <View
              className={`mt-2 px-3 py-1 rounded-full ${
                deposit.status === 'COMPLETED'
                  ? 'bg-green-100'
                  : deposit.status === 'PENDING'
                    ? 'bg-yellow-100'
                    : 'bg-gray-100'
              }`}
            >
              <Text
                className={
                  deposit.status === 'COMPLETED'
                    ? 'text-green-700'
                    : deposit.status === 'PENDING'
                      ? 'text-yellow-700'
                      : 'text-gray-700'
                }
              >
                {deposit.status === 'COMPLETED'
                  ? 'Confirmado'
                  : deposit.status === 'PENDING'
                    ? 'Aguardando pagamento'
                    : deposit.status}
              </Text>
            </View>

            {/* Timer */}
            {isActive && timeLeft !== null && (
              <Text className="mt-2 text-gray-500">
                Expira em {formatTime(timeLeft)}
              </Text>
            )}

            {/* QR Code */}
            {isActive && deposit.qrCodeBase64 && (
              <View className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
                <Image
                  source={{ uri: `data:image/png;base64,${deposit.qrCodeBase64}` }}
                  className="w-48 h-48"
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Copia e cola */}
            {isActive && deposit.pixCopyPaste && (
              <View className="w-full mt-6">
                <Text className="text-sm text-gray-600 mb-2">
                  Código PIX (Copia e Cola)
                </Text>
                <TouchableOpacity
                  className="flex-row items-center border border-gray-300 rounded-lg p-3"
                  onPress={handleCopy}
                >
                  <Text
                    className="flex-1 text-xs text-gray-600"
                    numberOfLines={1}
                  >
                    {deposit.pixCopyPaste}
                  </Text>
                  <Text className="text-primary ml-2">
                    {copied ? '✓ Copiado' : 'Copiar'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Sucesso */}
            {deposit.status === 'COMPLETED' && (
              <View className="mt-6 items-center">
                <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center">
                  <Text className="text-3xl">✓</Text>
                </View>
                <Text className="mt-4 text-gray-600 text-center">
                  O valor foi creditado em sua conta
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            className="bg-primary rounded-lg py-4"
            onPress={handleNewDeposit}
          >
            <Text className="text-white text-center font-semibold">
              Novo depósito
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Formulário de novo depósito
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 space-y-4">
        <View className="bg-white rounded-xl p-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Valor do depósito
          </Text>

          <View className="flex-row items-center border border-gray-300 rounded-lg px-4">
            <Text className="text-gray-500 text-lg">R$</Text>
            <TextInput
              className="flex-1 py-3 px-2 text-2xl"
              placeholder="0,00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          <Text className="text-xs text-gray-500 mt-2">
            Mínimo: R$ 10 | Máximo: R$ 50.000
          </Text>

          {/* Quick amounts */}
          <View className="flex-row flex-wrap gap-2 mt-4">
            {QUICK_AMOUNTS.map((value) => (
              <TouchableOpacity
                key={value}
                className={`px-4 py-2 rounded-lg border ${
                  amount === value.toString()
                    ? 'bg-primary border-primary'
                    : 'border-gray-300'
                }`}
                onPress={() => setAmount(value.toString())}
              >
                <Text
                  className={
                    amount === value.toString() ? 'text-white' : 'text-gray-700'
                  }
                >
                  {formatCurrency(value)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resumo */}
        <View className="bg-white rounded-xl p-6">
          <Text className="text-sm text-gray-600 mb-2">Resumo</Text>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Valor do depósito</Text>
              <Text className="font-medium">
                {amount ? formatCurrency(parseFloat(amount.replace(',', '.')) || 0) : '-'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Taxa</Text>
              <Text className="text-green-600 font-medium">Grátis</Text>
            </View>
            <View className="border-t border-gray-100 pt-2 mt-2">
              <View className="flex-row justify-between">
                <Text className="font-semibold text-gray-900">Total</Text>
                <Text className="font-bold text-gray-900">
                  {amount ? formatCurrency(parseFloat(amount.replace(',', '.')) || 0) : '-'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className="bg-primary rounded-lg py-4"
          onPress={handleCreateDeposit}
          disabled={createDepositMutation.isPending}
        >
          {createDepositMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Gerar QR Code PIX
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
