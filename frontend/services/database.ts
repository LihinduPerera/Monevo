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
    try {
        // First, check if the transactions table exists and has the user_id column
        const tableInfo = db.getAllSync(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='transactions'
        `);
        
        if (tableInfo.length === 0) {
            // Table doesn't exist, create it with all columns
            db.execSync(`
                CREATE TABLE transactions (
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
            console.log('Created transactions table with user_id column');
        } else {
            // Table exists, check if user_id column exists
            try {
                // This will throw an error if user_id column doesn't exist
                db.getAllSync('SELECT user_id FROM transactions LIMIT 1');
                console.log('user_id column already exists');
            } catch (error) {
                // user_id column doesn't exist, add it
                console.log('Adding user_id column to transactions table');
                db.execSync('ALTER TABLE transactions ADD COLUMN user_id INTEGER');
            }
        }
    } catch (error) {
        console.error('Error initializing database:', error);
        // If anything fails, try to recreate the table
        try {
            db.execSync('DROP TABLE IF EXISTS transactions');
            db.execSync(`
                CREATE TABLE transactions (
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
            console.log('Recreated transactions table with user_id column');
        } catch (recreateError) {
            console.error('Failed to recreate table:', recreateError);
        }
    }
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
    
    try {
        if (userId) {
            // Get transactions for current user only
            const result = db.getAllSync(
                'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', 
                [userId]
            );
            return result as Transaction[];
        } else {
            // If no user is logged in, return empty array
            return [];
        }
    } catch (error) {
        console.error('Error getting transactions:', error);
        // If there's an error (like missing user_id column), return empty array
        return [];
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

// Clear all transactions for current user (useful for testing)
export const clearUserTransactions = async (): Promise<void> => {
    const userId = await getCurrentUserId();
    if (userId) {
        try {
            db.runSync('DELETE FROM transactions WHERE user_id = ?', [userId]);
            console.log('Cleared transactions for user:', userId);
        } catch (error) {
            console.error('Error clearing transactions:', error);
        }
    }
}