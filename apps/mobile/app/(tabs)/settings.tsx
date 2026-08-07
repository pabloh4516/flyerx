import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth';
import { formatCPF, formatCNPJ, formatPhone } from '../../lib/utils/format';

const kycLevelLabels: Record<string, { label: string; color: string }> = {
  NONE: { label: 'Não verificado', color: 'bg-gray-100 text-gray-700' },
  BASIC: { label: 'Básico', color: 'bg-yellow-100 text-yellow-700' },
  VERIFIED: { label: 'Verificado', color: 'bg-blue-100 text-blue-700' },
  FULL: { label: 'Completo', color: 'bg-green-100 text-green-700' },
};

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

function MenuItem({ icon, title, subtitle, onPress, showArrow = true, danger }: MenuItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-4 border-b border-gray-100"
      onPress={onPress}
    >
      <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
        <Text className="text-xl">{icon}</Text>
      </View>
      <View className="flex-1 ml-3">
        <Text className={`font-medium ${danger ? 'text-red-600' : 'text-gray-900'}`}>
          {title}
        </Text>
        {subtitle && <Text className="text-sm text-gray-500">{subtitle}</Text>}
      </View>
      {showArrow && <Text className="text-gray-400">›</Text>}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const kycLevel = kycLevelLabels[user?.kycLevel || 'NONE'];

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const formatDocument = () => {
    if (!user?.document) return '';
    return user.documentType === 'CPF'
      ? formatCPF(user.document)
      : formatCNPJ(user.document);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="bg-white p-6 items-center border-b border-gray-100">
        <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-3">
          <Text className="text-white text-3xl font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text className="text-xl font-bold text-gray-900">{user?.name}</Text>
        <Text className="text-gray-500">{user?.email}</Text>
        <View className={`mt-2 px-3 py-1 rounded-full ${kycLevel.color}`}>
          <Text className="text-sm">{kycLevel.label}</Text>
        </View>
      </View>

      {/* Profile Info */}
      <View className="bg-white mt-4 px-4">
        <Text className="text-sm font-medium text-gray-500 py-3">
          INFORMAÇÕES PESSOAIS
        </Text>

        <View className="flex-row justify-between py-3 border-b border-gray-100">
          <Text className="text-gray-600">Nome</Text>
          <Text className="font-medium text-gray-900">{user?.name}</Text>
        </View>

        <View className="flex-row justify-between py-3 border-b border-gray-100">
          <Text className="text-gray-600">Email</Text>
          <Text className="font-medium text-gray-900">{user?.email}</Text>
        </View>

        <View className="flex-row justify-between py-3 border-b border-gray-100">
          <Text className="text-gray-600">{user?.documentType || 'CPF'}</Text>
          <Text className="font-medium text-gray-900">{formatDocument()}</Text>
        </View>

        <View className="flex-row justify-between py-3">
          <Text className="text-gray-600">Telefone</Text>
          <Text className="font-medium text-gray-900">
            {user?.phone ? formatPhone(user.phone) : 'Não informado'}
          </Text>
        </View>
      </View>

      {/* Security */}
      <View className="bg-white mt-4 px-4">
        <Text className="text-sm font-medium text-gray-500 py-3">SEGURANÇA</Text>

        <MenuItem
          icon="🔐"
          title="Autenticação em duas etapas"
          subtitle={user?.twoFactorEnabled ? 'Ativado' : 'Desativado'}
          onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está em desenvolvimento')}
        />

        <MenuItem
          icon="🔑"
          title="Alterar senha"
          onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está em desenvolvimento')}
        />

        <MenuItem
          icon="📱"
          title="Dispositivos conectados"
          onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está em desenvolvimento')}
        />

        <MenuItem
          icon="👆"
          title="Biometria"
          subtitle="Face ID / Touch ID"
          onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está em desenvolvimento')}
        />
      </View>

      {/* Preferences */}
      <View className="bg-white mt-4 px-4">
        <Text className="text-sm font-medium text-gray-500 py-3">PREFERÊNCIAS</Text>

        <MenuItem
          icon="🔔"
          title="Notificações"
          onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está em desenvolvimento')}
        />

        <MenuItem
          icon="❓"
          title="Ajuda e suporte"
          onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está em desenvolvimento')}
        />

        <MenuItem
          icon="📄"
          title="Termos de uso"
          onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está em desenvolvimento')}
        />

        <MenuItem
          icon="🔒"
          title="Política de privacidade"
          onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está em desenvolvimento')}
        />
      </View>

      {/* Logout */}
      <View className="bg-white mt-4 px-4 mb-8">
        <MenuItem
          icon="🚪"
          title="Sair da conta"
          onPress={handleLogout}
          showArrow={false}
          danger
        />
      </View>

      {/* Version */}
      <View className="items-center pb-8">
        <Text className="text-gray-400 text-sm">Versão 1.0.0</Text>
      </View>
    </ScrollView>
  );
}
