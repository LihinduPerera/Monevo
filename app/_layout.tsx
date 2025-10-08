import { initDatabase } from "@/services/database";
import { Stack } from "expo-router";
import './globals.css';

export default function RootLayout() {
  initDatabase();
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
