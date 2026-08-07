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
import { router } from 'expo-router';
import { forgotPassword } from '../../lib/api/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Erro', 'Digite seu email');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email);
      setEmailSent(true);
    } catch {
      // Não mostrar se o email existe por segurança
      setEmailSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl">✉️</Text>
          </View>
          <Text className="text-2xl font-bold text-center text-gray-900">
            Verifique seu email
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            Enviamos um link de recuperação para {email}
          </Text>
        </View>

        <View className="space-y-4">
          <TouchableOpacity
            className="border border-gray-300 rounded-lg py-4"
            onPress={() => setEmailSent(false)}
          >
            <Text className="text-gray-700 text-center font-medium">
              Tentar outro email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-4"
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text className="text-primary text-center font-medium">
              ← Voltar para o login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
          <View className="mb-8">
            <Text className="text-2xl font-bold text-center text-gray-900">
              Esqueceu sua senha?
            </Text>
            <Text className="mt-2 text-center text-gray-600">
              Digite seu email e enviaremos um link para redefinir sua senha
            </Text>
          </View>

          <View className="space-y-4">
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

            <TouchableOpacity
              className="bg-primary rounded-lg py-4"
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Enviar link de recuperação
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4"
              onPress={() => router.back()}
            >
              <Text className="text-primary text-center font-medium">
                ← Voltar para o login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
