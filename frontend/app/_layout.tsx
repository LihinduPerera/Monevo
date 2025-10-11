import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { initDatabase } from "@/services/database";
import './global.css';
import { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize database with error handling
        await initDatabase();
      } catch (e: any) {
        console.error('Database initialization error:', e);
        setInitError(e.message);
        Alert.alert('Database Error', 'Failed to initialize local database. Some features may not work.');
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg text-gray-600">Loading...</Text>
        {initError && (
          <Text className="text-red-500 text-sm mt-2">Error: {initError}</Text>
        )}
      </View>
    );
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}