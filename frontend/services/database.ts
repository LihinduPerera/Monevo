import * as SQLite from 'expo-sqlite';
import { backendService, BackendTransaction } from './backend';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
    id?: number;
    amount: number;
    desc: string;
    type: "income" | "expense";
    category: string;
    date: string;
    synced?: boolean;
    backend_id?: number;
    user_id?: number;
}

const db = SQLite.openDatabaseSync('finance.db');

export const initDatabase = () => {
    db.execSync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      desc TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      synced BOOLEAN DEFAULT 0,
      backend_id INTEGER,
      user_id INTEGER
    );
  `);
};

// Get current user ID from AsyncStorage
const getCurrentUserId = async (): Promise<number | null> => {
  try {
    const userData = await AsyncStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id;
    }
    return null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

// Add transaction to SQLite (offline first)
export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<number> => {
    const {amount, desc, type, category, date} = transaction;
    const userId = await getCurrentUserId();
    
    try {
        const result = db.runSync(
            'INSERT INTO transactions (amount, desc, type, category, date, synced, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [amount, desc, type, category, date, 0, userId]
        );
        
        const localId = result.lastInsertRowId;
        return localId;
    } catch (error) {
        console.error('Error adding transaction to local database:', error);
        throw error;
    }
}

// Add transaction with backend sync
export const addTransactionWithSync = async (
    transaction: Omit<Transaction, 'id'>, 
    onBackendSuccess?: () => void
): Promise<number> => {
    const {amount, desc, type, category, date} = transaction;
    const userId = await getCurrentUserId();
    
    try {
        const result = db.runSync(
            'INSERT INTO transactions (amount, desc, type, category, date, synced, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [amount, desc, type, category, date, 0, userId]
        );
        
        const localId = result.lastInsertRowId;
        
        try {
            const backendResult = await backendService.addTransaction(transaction);
            
            db.runSync(
                'UPDATE transactions SET synced = 1, backend_id = ? WHERE id = ?',
                [backendResult.data.id, localId]
            );
            
            if (onBackendSuccess) {
                onBackendSuccess();
            }
            
            return localId;
        } catch (backendError) {
            console.log('Backend sync failed, transaction saved locally only');
            return localId;
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        throw error;
    }
}

// Get transactions from local database for current user
export const getTransactions = async (): Promise<Transaction[]> => {
    const userId = await getCurrentUserId();
    
    if (userId) {
        const result = db.getAllSync(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', 
            [userId]
        );
        return Promise.resolve(result as Transaction[]);
    } else {
        return Promise.resolve([]);
    }
}

// Delete transaction from local database
export const deleteTransaction = async (id: number): Promise<void> => {
    const userId = await getCurrentUserId();
    
    try {
        const transactions = db.getAllSync(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?', 
            [id, userId]
        ) as Transaction[];
        const transaction = transactions[0];
        
        if (transaction && transaction.synced && transaction.backend_id) {
            try {
                await backendService.deleteTransaction(transaction.backend_id);
            } catch (backendError) {
                console.log('Backend delete failed, but local delete will proceed');
            }
        }
        
        db.runSync('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);
        return Promise.resolve();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        throw error;
    }
}

// Sync unsynced transactions with backend
export const syncPendingTransactions = async (): Promise<number> => {
    const userId = await getCurrentUserId();
    if (!userId) return 0;

    try {
        const unsyncedTransactions = db.getAllSync(
            'SELECT * FROM transactions WHERE synced = 0 AND user_id = ?', 
            [userId]
        ) as Transaction[];
        
        let syncedCount = 0;
        
        for (const transaction of unsyncedTransactions) {
            try {
                const { amount, desc, type, category, date } = transaction;
                const backendResult = await backendService.addTransaction({
                    amount,
                    desc,
                    type,
                    category,
                    date
                });
                
                db.runSync(
                    'UPDATE transactions SET synced = 1, backend_id = ? WHERE id = ? AND user_id = ?',
                    [backendResult.data.id, transaction.id, userId]
                );
                
                syncedCount++;
            } catch (error) {
                console.log(`Failed to sync transaction ${transaction.id}`);
            }
        }
        
        return syncedCount;
    } catch (error) {
        console.error('Error syncing pending transactions:', error);
        return 0;
    }
}