import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { View, Text } from 'react-native';
import { useAuthStore } from '../../stores/auth';

// Simple icon components
const HomeIcon = ({ focused }: { focused: boolean }) => (
  <View className={`w-6 h-6 items-center justify-center ${focused ? 'opacity-100' : 'opacity-50'}`}>
    <Text className="text-lg">🏠</Text>
  </View>
);

const DepositIcon = ({ focused }: { focused: boolean }) => (
  <View className={`w-6 h-6 items-center justify-center ${focused ? 'opacity-100' : 'opacity-50'}`}>
    <Text className="text-lg">⬇️</Text>
  </View>
);

const WithdrawIcon = ({ focused }: { focused: boolean }) => (
  <View className={`w-6 h-6 items-center justify-center ${focused ? 'opacity-100' : 'opacity-50'}`}>
    <Text className="text-lg">⬆️</Text>
  </View>
);

const HistoryIcon = ({ focused }: { focused: boolean }) => (
  <View className={`w-6 h-6 items-center justify-center ${focused ? 'opacity-100' : 'opacity-50'}`}>
    <Text className="text-lg">📋</Text>
  </View>
);

const SettingsIcon = ({ focused }: { focused: boolean }) => (
  <View className={`w-6 h-6 items-center justify-center ${focused ? 'opacity-100' : 'opacity-50'}`}>
    <Text className="text-lg">⚙️</Text>
  </View>
);

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="deposit"
        options={{
          title: 'Depositar',
          tabBarIcon: ({ focused }) => <DepositIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="withdraw"
        options={{
          title: 'Sacar',
          tabBarIcon: ({ focused }) => <WithdrawIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ focused }) => <HistoryIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ focused }) => <SettingsIcon focused={focused} />,
        }}
      />
    </Tabs>
  );
}
