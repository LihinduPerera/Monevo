const API_BASE_URL = 'http://192.168.8.101:3000/api';

export interface BackendTransaction {
  id?: number;
  amount: number;
  desc: string;
  type: "income" | "expense";
  category: string;
  date: string;
}

export const backendService = {

  addTransaction: async (transaction: Omit<BackendTransaction, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error adding transaction to backend:', error);
      throw error;
    }
  },

  getTransactions: async (): Promise<BackendTransaction[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`);
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching transactions from backend:', error);
      throw error;
    }
  },

  deleteTransaction: async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting transaction from backend:', error);
      throw error;
    }
  },

  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};