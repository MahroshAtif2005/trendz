import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useApp } from '@/context/AppContext';

export default function Index() {
  const { session, isLoading } = useApp();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)/explore" />;
  }

  // Automatically start at welcome
  return <Redirect href="/(auth)/welcome" />;
}
