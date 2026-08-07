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
import { useAuthStore } from '../../stores/auth';
import { login, verifyTwoFactor } from '../../lib/api/auth';

export default function LoginScreen() {
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2FA
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }

    setIsLoading(true);
    try {
      const response = await login({ email, password });

      if (response.requiresTwoFactor && response.twoFactorToken) {
        setRequires2FA(true);
        setTwoFactorToken(response.twoFactorToken);
      } else if (response.user) {
        setUser(response.user);
        router.replace('/(tabs)');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      Alert.alert('Erro', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length !== 6) {
      Alert.alert('Erro', 'Digite um código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyTwoFactor({
        twoFactorToken,
        code: twoFactorCode,
      });

      if (response.user) {
        setUser(response.user);
        router.replace('/(tabs)');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Código inválido';
      Alert.alert('Erro', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (requires2FA) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6">
            <View className="mb-8">
              <Text className="text-2xl font-bold text-center text-gray-900">
                Autenticação em duas etapas
              </Text>
              <Text className="mt-2 text-center text-gray-600">
                Digite o código do seu aplicativo autenticador
              </Text>
            </View>

            <View className="space-y-4">
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl tracking-widest"
                placeholder="000000"
                value={twoFactorCode}
                onChangeText={(text) => setTwoFactorCode(text.replace(/\D/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <TouchableOpacity
                className="bg-primary rounded-lg py-4"
                onPress={handleVerify2FA}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-center font-semibold text-lg">
                    Verificar
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="py-4"
                onPress={() => {
                  setRequires2FA(false);
                  setTwoFactorCode('');
                  setTwoFactorToken('');
                }}
              >
                <Text className="text-gray-600 text-center">Voltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6">
          {/* Logo */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-primary rounded-2xl items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">F</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">Flyerx</Text>
          </View>

          <View className="mb-8">
            <Text className="text-2xl font-bold text-center text-gray-900">
              Bem-vindo de volta
            </Text>
            <Text className="mt-2 text-center text-gray-600">
              Entre com sua conta para continuar
            </Text>
          </View>

          <View className="space-y-4">
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

            {/* Password */}
            <View>
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-sm font-medium text-gray-700">Senha</Text>
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text className="text-sm text-primary">Esqueceu?</Text>
                  </TouchableOpacity>
                </Link>
              </View>
              <View className="flex-row items-center border border-gray-300 rounded-lg">
                <TextInput
                  className="flex-1 px-4 py-3"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  className="px-4"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text className="text-gray-500">
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              className="bg-primary rounded-lg py-4 mt-4"
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Entrar
                </Text>
              )}
            </TouchableOpacity>

            {/* Register link */}
            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-600">Não tem uma conta? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-primary font-medium">Cadastre-se</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
