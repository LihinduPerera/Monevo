import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.8.101:3000/api';

export interface BackendTransaction {
  id?: number;
  amount: number;
  desc: string;
  type: "income" | "expense";
  category: string;
  date: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  date_of_birth: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    expiresIn: string;
  };
}

class BackendService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_data');
          throw new Error('Invalid token');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Request failed');
      }

      return result;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return {
      user: result.data.user,
      token: result.data.token,
    };
  }

  async register(name: string, email: string, password: string, date_of_birth: string): Promise<any> {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, date_of_birth }),
    });

    return result;
  }

  async getProfile(): Promise<User> {
    const result = await this.request('/auth/profile');
    return result.data;
  }

  // Transaction methods
  async addTransaction(transaction: Omit<BackendTransaction, 'id'>) {
    const result = await this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });

    return result;
  }

  async getTransactions(): Promise<BackendTransaction[]> {
    const result = await this.request('/transactions');
    return result.data;
  }

  async deleteTransaction(id: number) {
    const result = await this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });

    return result;
  }

  async updateTransaction(id: number, transaction: Omit<BackendTransaction, 'id'>) {
    const result = await this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });

    return result;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new BackendService();
export const backendService = authService;