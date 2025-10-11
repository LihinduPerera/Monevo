import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/backend';
import { useRouter } from 'expo-router';

interface User {
  id: number;
  name: string;
  email: string;
  date_of_birth: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, date_of_birth: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  appReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        authService.setToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
      // Add a small delay to ensure navigation is ready
      setTimeout(() => setAppReady(true), 100);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      
      await AsyncStorage.setItem('auth_token', response.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      
      setToken(response.token);
      setUser(response.user);
      authService.setToken(response.token);
    } catch (error) {
      await logout();
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, date_of_birth: string) => {
    try {
      await authService.register(name, email, password, date_of_birth);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      setToken(null);
      setUser(null);
      authService.setToken(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const userData = await authService.getProfile();
      setUser(userData);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Error refreshing user:', error);
      if (error === 'Invalid token' || error === 'Token expired') {
        await logout();
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    appReady,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};