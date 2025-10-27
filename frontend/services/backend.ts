import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.8.155:3000/api";

export interface BackendTransaction {
  id?: number;
  amount: number;
  desc: string;
  type: "income" | "expense";
  category: string;
  date: string;
}

export interface Goal {
  id?: number;
  target_amount: number;
  target_month: number;
  target_year: number;
  created_at?: string;
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

export interface ReportData {
  period: {
    month: number;
    year: number;
    monthName: string;
  };
  summary: {
    income: number;
    expenses: number;
    net: number;
    goalStatus?: any;
    transactionCount: number;
  };
  analytics: any;
  chartData: any;
  transactions: BackendTransaction[];
  generatedAt: string;
}

export interface YearlyReportData {
  period: {
    year: number;
    type: string;
  };
  summary: any;
  monthlyBreakdown: any;
  goalsProgress: Goal[];
  generatedAt: string;
}

class BackendService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Create a Headers object from any incoming headers
    const headersObj = new Headers(options.headers as HeadersInit);

    // Ensure content-type is set (only set if not already present)
    if (!headersObj.has("Content-Type")) {
      headersObj.set("Content-Type", "application/json");
    }

    // Add Authorization if token exists
    if (this.token) {
      headersObj.set("Authorization", `Bearer ${this.token}`);
    }

    const config: RequestInit = {
      ...options,
      headers: headersObj,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem("auth_token");
          await AsyncStorage.removeItem("user_data");
          throw new Error("Invalid token");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Some endpoints might return no JSON (avoid crashing)
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};

      if (result && result.success === false) {
        throw new Error(result.message || "Request failed");
      }

      return result;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  // Auth methods
  async login(
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const result = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    return {
      user: result.data.user,
      token: result.data.token,
    };
  }

  async register(
    name: string,
    email: string,
    password: string,
    date_of_birth: string
  ): Promise<any> {
    const result = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, date_of_birth }),
    });

    return result;
  }

  async getProfile(): Promise<User> {
    const result = await this.request("/auth/profile");
    return result.data;
  }

  // Transaction methods
  async addTransaction(transaction: Omit<BackendTransaction, "id">) {
    const result = await this.request("/transactions", {
      method: "POST",
      body: JSON.stringify(transaction),
    });

    return result;
  }

  async getTransactions(): Promise<BackendTransaction[]> {
    const result = await this.request("/transactions");
    return result.data;
  }

  async getTransactionsByMonth(
    month: number,
    year: number
  ): Promise<BackendTransaction[]> {
    const result = await this.request(`/transactions/month/${month}/${year}`);
    return result.data;
  }

  async deleteTransaction(id: number) {
    const result = await this.request(`/transactions/${id}`, {
      method: "DELETE",
    });

    return result;
  }

  async updateTransaction(
    id: number,
    transaction: Omit<BackendTransaction, "id">
  ) {
    const result = await this.request(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(transaction),
    });

    return result;
  }

  // Goal methods
  async addGoal(goal: Omit<Goal, "id">) {
    const result = await this.request("/goals", {
      method: "POST",
      body: JSON.stringify(goal),
    });

    return result;
  }

  async getGoals(): Promise<Goal[]> {
    const result = await this.request("/goals");
    return result.data;
  }

  async getGoalByMonth(month: number, year: number): Promise<Goal | null> {
    const result = await this.request(`/goals/${month}/${year}`);
    return result.data;
  }

  async deleteGoal(id: number) {
    const result = await this.request(`/goals/${id}`, {
      method: "DELETE",
    });

    return result;
  }

  async updateGoal(id: number, goal: Omit<Goal, "id">) {
    const result = await this.request(`/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(goal),
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

  async generateReport(month?: number, year?: number): Promise<ReportData> {
    const params = new URLSearchParams();
    if (month) params.append("month", month.toString());
    if (year) params.append("year", year.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/report?${queryString}` : "/report";

    const result = await this.request(endpoint);
    return result.data;
  }

  async generateYearlyReport(year?: number): Promise<YearlyReportData> {
    const params = new URLSearchParams();
    if (year) params.append("year", year.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `/report/yearly?${queryString}`
      : "/report/yearly";

    const result = await this.request(endpoint);
    return result.data;
  }
}

export const authService = new BackendService();
export const backendService = authService;
