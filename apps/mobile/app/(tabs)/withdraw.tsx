import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth';
import { getBalance, estimateWithdrawalFee, createWithdrawal } from '../../lib/api/wallet';
import { formatCurrency } from '../../lib/utils/format';
import type { PixKeyType } from '../../types';

const PIX_KEY_TYPES: { value: PixKeyType; label: string }[] = [
  { value: 'CPF', label: 'CPF' },
  { value: 'CNPJ', label: 'CNPJ' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'PHONE', label: 'Telefone' },
  { value: 'RANDOM', label: 'Chave aleatória' },
];

export default function WithdrawScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [amount, setAmount] = useState('');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('CPF');
  const [pixKey, setPixKey] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: balance } = useQuery({
    queryKey: ['balance'],
    queryFn: getBalance,
  });

  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;

  const { data: feeEstimate } = useQuery({
    queryKey: ['withdrawalFee', parsedAmount],
    queryFn: () => estimateWithdrawalFee(parsedAmount),
    enabled: parsedAmount > 0,
  });

  const withdrawMutation = useMutation({
    mutationFn: () =>
      createWithdrawal(
        parsedAmount,
        pixKeyType,
        pixKey,
        user?.twoFactorEnabled ? twoFactorCode : undefined
      ),
    onSuccess: () => {
      setSuccess(true);
      setShowConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erro ao solicitar saque';
      Alert.alert('Erro', message);
    },
  });

  const handleContinue = () => {
    if (parsedAmount < 10 || parsedAmount > 50000) {
      Alert.alert('Erro', 'Valor deve ser entre R$ 10 e R$ 50.000');
      return;
    }

    if (parsedAmount > (balance?.available ?? 0)) {
      Alert.alert('Erro', 'Saldo insuficiente');
      return;
    }

    if (!pixKey) {
      Alert.alert('Erro', 'Digite a chave PIX');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (user?.twoFactorEnabled && twoFactorCode.length !== 6) {
      Alert.alert('Erro', 'Digite o código de autenticação');
      return;
    }

    withdrawMutation.mutate();
  };

  const handleNewWithdrawal = () => {
    setSuccess(false);
    setAmount('');
    setPixKey('');
    setTwoFactorCode('');
  };

  if (success) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center p-4">
        <View className="bg-white rounded-xl p-8 items-center w-full">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl">✓</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">Saque solicitado!</Text>
          <Text className="text-gray-600 text-center mt-2">
            Sua solicitação está sendo processada
          </Text>

          <View className="w-full mt-6 p-4 bg-gray-50 rounded-lg">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Valor</Text>
              <Text className="font-medium">{formatCurrency(parsedAmount)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Taxa</Text>
              <Text className="font-medium">{formatCurrency(feeEstimate?.fee ?? 0)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Você receberá</Text>
              <Text className="font-bold text-green-600">
                {formatCurrency(feeEstimate?.netAmount ?? 0)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="w-full mt-6 bg-primary rounded-lg py-4"
            onPress={handleNewWithdrawal}
          >
            <Text className="text-white text-center font-semibold">Novo saque</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4 space-y-4">
          {/* Saldo disponível */}
          <View className="bg-white rounded-xl p-4">
            <Text className="text-sm text-gray-600">Saldo disponível</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {formatCurrency(balance?.available ?? 0)}
            </Text>
          </View>

          {/* Formulário */}
          <View className="bg-white rounded-xl p-6 space-y-4">
            {/* Valor */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Valor do saque
              </Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg px-4">
                <Text className="text-gray-500 text-lg">R$</Text>
                <TextInput
                  className="flex-1 py-3 px-2 text-xl"
                  placeholder="0,00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-xs text-gray-500">Mínimo: R$ 10</Text>
                <TouchableOpacity
                  onPress={() => setAmount((balance?.available ?? 0).toString())}
                >
                  <Text className="text-xs text-primary">Usar saldo total</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tipo de chave PIX */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Tipo de chave PIX
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2">
                  {PIX_KEY_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      className={`px-4 py-2 rounded-lg border ${
                        pixKeyType === type.value
                          ? 'bg-primary border-primary'
                          : 'border-gray-300'
                      }`}
                      onPress={() => {
                        setPixKeyType(type.value);
                        setPixKey('');
                      }}
                    >
                      <Text
                        className={
                          pixKeyType === type.value ? 'text-white' : 'text-gray-700'
                        }
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Chave PIX */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Chave PIX</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder={
                  pixKeyType === 'CPF'
                    ? '000.000.000-00'
                    : pixKeyType === 'CNPJ'
                      ? '00.000.000/0000-00'
                      : pixKeyType === 'EMAIL'
                        ? 'email@exemplo.com'
                        : pixKeyType === 'PHONE'
                          ? '+5511999999999'
                          : 'Chave aleatória'
                }
                value={pixKey}
                onChangeText={setPixKey}
                keyboardType={
                  pixKeyType === 'CPF' || pixKeyType === 'CNPJ' || pixKeyType === 'PHONE'
                    ? 'number-pad'
                    : pixKeyType === 'EMAIL'
                      ? 'email-address'
                      : 'default'
                }
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Resumo */}
          <View className="bg-white rounded-xl p-6">
            <Text className="text-sm text-gray-600 mb-2">Resumo</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Valor do saque</Text>
                <Text className="font-medium">{formatCurrency(parsedAmount)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Taxa estimada</Text>
                <Text className="font-medium">{formatCurrency(feeEstimate?.fee ?? 0)}</Text>
              </View>
              <View className="border-t border-gray-100 pt-2 mt-2">
                <View className="flex-row justify-between">
                  <Text className="font-semibold text-gray-900">Você receberá</Text>
                  <Text className="font-bold text-green-600">
                    {formatCurrency(feeEstimate?.netAmount ?? 0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            className="bg-primary rounded-lg py-4"
            onPress={handleContinue}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Continuar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de confirmação */}
      <Modal visible={showConfirm} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 text-center mb-4">
              Confirmar saque
            </Text>

            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Valor</Text>
                <Text className="font-medium">{formatCurrency(parsedAmount)}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Chave PIX</Text>
                <Text className="font-medium text-xs">{pixKey}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Taxa</Text>
                <Text className="font-medium">{formatCurrency(feeEstimate?.fee ?? 0)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Você receberá</Text>
                <Text className="font-bold text-green-600">
                  {formatCurrency(feeEstimate?.netAmount ?? 0)}
                </Text>
              </View>
            </View>

            {user?.twoFactorEnabled && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Código de autenticação
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  value={twoFactorCode}
                  onChangeText={(text) => setTwoFactorCode(text.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            )}

            <View className="flex-row space-x-4">
              <TouchableOpacity
                className="flex-1 border border-gray-300 rounded-lg py-4"
                onPress={() => {
                  setShowConfirm(false);
                  setTwoFactorCode('');
                }}
              >
                <Text className="text-gray-700 text-center font-medium">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary rounded-lg py-4"
                onPress={handleConfirm}
                disabled={withdrawMutation.isPending}
              >
                {withdrawMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-center font-semibold">
                    Confirmar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
