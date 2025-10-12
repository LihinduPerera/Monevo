import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          height: 90,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderTopColor: 'rgba(139, 92, 246, 0.3)',
              borderTopWidth: 1,
            }}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: false, // Hide default headers, we'll use custom ones
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View 
              style={{
                borderRadius: 20,
                padding: 8,
                backgroundColor: focused ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
              }}
            >
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size, focused }) => (
            <View 
              style={{
                borderRadius: 20,
                padding: 8,
                backgroundColor: focused ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
              }}
            >
              <Ionicons 
                name={focused ? "card" : "card-outline"} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View 
              style={{
                borderRadius: 20,
                padding: 8,
                backgroundColor: focused ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
              }}
            >
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}