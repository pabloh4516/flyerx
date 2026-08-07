import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { register } from '../../lib/api/auth';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [documentType, setDocumentType] = useState<'CPF' | 'CNPJ'>('CPF');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleDocumentChange = (text: string) => {
    const formatted = documentType === 'CPF' ? formatCPF(text) : formatCNPJ(text);
    setDocument(formatted);
  };

  const handleRegister = async () => {
    if (!name || !email || !document || !password || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name,
        email,
        password,
        document: document.replace(/\D/g, ''),
        documentType,
      });

      Alert.alert(
        'Conta criada!',
        'Verifique seu email para ativar sua conta.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar conta';
      Alert.alert('Erro', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-8">
          <View className="mb-8">
            <Text className="text-2xl font-bold text-center text-gray-900">
              Criar conta
            </Text>
            <Text className="mt-2 text-center text-gray-600">
              Preencha os dados para se cadastrar
            </Text>
          </View>

          <View className="space-y-4">
            {/* Nome */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Nome completo
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Seu nome completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Document Type */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Tipo de documento
              </Text>
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg border ${
                    documentType === 'CPF'
                      ? 'bg-primary border-primary'
                      : 'border-gray-300'
                  }`}
                  onPress={() => {
                    setDocumentType('CPF');
                    setDocument('');
                  }}
                >
                  <Text
                    className={`text-center font-medium ${
                      documentType === 'CPF' ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    CPF
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg border ${
                    documentType === 'CNPJ'
                      ? 'bg-primary border-primary'
                      : 'border-gray-300'
                  }`}
                  onPress={() => {
                    setDocumentType('CNPJ');
                    setDocument('');
                  }}
                >
                  <Text
                    className={`text-center font-medium ${
                      documentType === 'CNPJ' ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    CNPJ
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Document */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                {documentType}
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder={
                  documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'
                }
                value={document}
                onChangeText={handleDocumentChange}
                keyboardType="number-pad"
              />
            </View>

            {/* Password */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Senha</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Confirm Password */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Confirmar senha
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              className="bg-primary rounded-lg py-4 mt-4"
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Criar conta
                </Text>
              )}
            </TouchableOpacity>

            {/* Login link */}
            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-600">Já tem uma conta? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-primary font-medium">Entre aqui</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
