import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, Text, Alert, View, Platform } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            setTimeout(() => {
              router.replace('/landing');
            }, 200);
          },
        },
      ]
    );
  };

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
          // Size and spacing
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
        headerStyle: {
          backgroundColor: 'transparent',
          borderBottomWidth: 0,
          elevation: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderBottomColor: 'rgba(139, 92, 246, 0.3)',
              borderBottomWidth: 1,
            }}
          />
        ),
        headerRight: () => (
          <BlurView
            intensity={40}
            tint="dark"
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              marginRight: 16,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <TouchableOpacity 
              onPress={handleLogout} 
              style={{
                padding: 8,
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </BlurView>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <BlurView
              intensity={focused ? 40 : 0}
              tint="dark"
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
            </BlurView>
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size, focused }) => (
            <BlurView
              intensity={focused ? 40 : 0}
              tint="dark"
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
            </BlurView>
          ),
          headerTitle: 'Transactions',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <BlurView
              intensity={focused ? 40 : 0}
              tint="dark"
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
            </BlurView>
          ),
          headerTitle: 'Profile',
        }}
      />
    </Tabs>
  );
}