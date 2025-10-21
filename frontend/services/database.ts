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

export interface Goal {
    id?: number;
    target_amount: number;
    target_month: number;
    target_year: number;
    created_at?: string;
    synced?: boolean;
    backend_id?: number;
    user_id?: number;
}

const db = SQLite.openDatabaseSync('finance.db');

export const initDatabase = () => {
    try {
        // Check if transactions table exists
        const tableInfo = db.getAllSync(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='transactions'
        `);
        
        if (tableInfo.length === 0) {
            // Create transactions table
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
            // Check if user_id column exists
            try {
                db.getAllSync('SELECT user_id FROM transactions LIMIT 1');
                console.log('user_id column already exists in transactions');
            } catch (error) {
                console.log('Adding user_id column to transactions table');
                db.execSync('ALTER TABLE transactions ADD COLUMN user_id INTEGER');
            }
        }

        // Check if goals table exists
        const goalsTableInfo = db.getAllSync(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='goals'
        `);
        
        if (goalsTableInfo.length === 0) {
            // Create goals table
            db.execSync(`
                CREATE TABLE goals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    target_amount REAL NOT NULL,
                    target_month INTEGER NOT NULL,
                    target_year INTEGER NOT NULL,
                    synced BOOLEAN DEFAULT 0,
                    backend_id INTEGER,
                    user_id INTEGER,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Created goals table');
        } else {
            // Check if user_id column exists in goals
            try {
                db.getAllSync('SELECT user_id FROM goals LIMIT 1');
                console.log('user_id column already exists in goals');
            } catch (error) {
                console.log('Adding user_id column to goals table');
                db.execSync('ALTER TABLE goals ADD COLUMN user_id INTEGER');
            }
        }
    } catch (error) {
        console.error('Error initializing database:', error);
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

// Transaction functions
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

export const getTransactions = async (): Promise<Transaction[]> => {
    const userId = await getCurrentUserId();
    
    try {
        if (userId) {
            const result = db.getAllSync(
                'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', 
                [userId]
            );
            return result as Transaction[];
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error getting transactions:', error);
        return [];
    }
}

export const getTransactionsByMonth = async (month: number, year: number): Promise<Transaction[]> => {
    const userId = await getCurrentUserId();
    
    try {
        if (userId) {
            const result = db.getAllSync(
                `SELECT * FROM transactions 
                 WHERE user_id = ? 
                 AND strftime('%m', date) = ? 
                 AND strftime('%Y', date) = ?
                 ORDER BY date DESC`,
                [userId, month.toString().padStart(2, '0'), year.toString()]
            );
            return result as Transaction[];
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error getting transactions by month:', error);
        return [];
    }
}

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

// NEW: Fetch transactions from backend and sync to local
export const syncTransactionsFromBackend = async (): Promise<number> => {
    const userId = await getCurrentUserId();
    if (!userId) return 0;

    try {
        const backendTransactions = await backendService.getTransactions();
        let newTransactionsCount = 0;

        for (const backendTransaction of backendTransactions) {
            // Check if transaction already exists in local db by backend_id
            const existingTransactions = db.getAllSync(
                'SELECT * FROM transactions WHERE backend_id = ? AND user_id = ?',
                [backendTransaction.id!, userId]
            ) as Transaction[];

            if (existingTransactions.length === 0) {
                // Insert the transaction from backend
                db.runSync(
                    `INSERT INTO transactions (amount, desc, type, category, date, synced, backend_id, user_id) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        backendTransaction.amount,
                        backendTransaction.desc,
                        backendTransaction.type,
                        backendTransaction.category,
                        backendTransaction.date,
                        1, // Already synced since it's from backend
                        backendTransaction.id!,
                        userId
                    ]
                );
                newTransactionsCount++;
            }
        }

        return newTransactionsCount;
    } catch (error) {
        console.error('Error syncing transactions from backend:', error);
        return 0;
    }
}

// Goal functions
export const addGoal = async (goal: Omit<Goal, 'id'>): Promise<number> => {
    const { target_amount, target_month, target_year } = goal;
    const userId = await getCurrentUserId();
    
    try {
        const result = db.runSync(
            'INSERT INTO goals (target_amount, target_month, target_year, synced, user_id) VALUES (?, ?, ?, ?, ?)',
            [target_amount, target_month, target_year, 0, userId]
        );
        
        const localId = result.lastInsertRowId;
        return localId;
    } catch (error) {
        console.error('Error adding goal to local database:', error);
        throw error;
    }
}

export const addGoalWithSync = async (
    goal: Omit<Goal, 'id'>, 
    onBackendSuccess?: () => void
): Promise<number> => {
    const { target_amount, target_month, target_year } = goal;
    const userId = await getCurrentUserId();
    
    try {
        const result = db.runSync(
            'INSERT INTO goals (target_amount, target_month, target_year, synced, user_id) VALUES (?, ?, ?, ?, ?)',
            [target_amount, target_month, target_year, 0, userId]
        );
        
        const localId = result.lastInsertRowId;
        
        try {
            const backendResult = await backendService.addGoal(goal);
            
            db.runSync(
                'UPDATE goals SET synced = 1, backend_id = ? WHERE id = ?',
                [backendResult.data.id, localId]
            );
            
            if (onBackendSuccess) {
                onBackendSuccess();
            }
            
            return localId;
        } catch (backendError) {
            console.log('Backend sync failed, goal saved locally only');
            return localId;
        }
    } catch (error) {
        console.error('Error adding goal:', error);
        throw error;
    }
}

export const getGoals = async (): Promise<Goal[]> => {
    const userId = await getCurrentUserId();
    
    try {
        if (userId) {
            const result = db.getAllSync(
                'SELECT * FROM goals WHERE user_id = ? ORDER BY target_year DESC, target_month DESC', 
                [userId]
            );
            return result as Goal[];
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error getting goals:', error);
        return [];
    }
}

export const getGoalByMonth = async (month: number, year: number): Promise<Goal | null> => {
    const userId = await getCurrentUserId();
    
    try {
        if (userId) {
            const result = db.getAllSync(
                'SELECT * FROM goals WHERE user_id = ? AND target_month = ? AND target_year = ?', 
                [userId, month, year]
            ) as Goal[];
            
            return result.length > 0 ? result[0] : null;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting goal by month:', error);
        return null;
    }
}

export const deleteGoal = async (id: number): Promise<void> => {
    const userId = await getCurrentUserId();
    
    try {
        const goals = db.getAllSync(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?', 
            [id, userId]
        ) as Goal[];
        const goal = goals[0];
        
        if (goal && goal.synced && goal.backend_id) {
            try {
                await backendService.deleteGoal(goal.backend_id);
            } catch (backendError) {
                console.log('Backend delete failed, but local delete will proceed');
            }
        }
        
        db.runSync('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
    } catch (error) {
        console.error('Error deleting goal:', error);
        throw error;
    }
}

export const syncPendingGoals = async (): Promise<number> => {
    const userId = await getCurrentUserId();
    if (!userId) return 0;

    try {
        const unsyncedGoals = db.getAllSync(
            'SELECT * FROM goals WHERE synced = 0 AND user_id = ?', 
            [userId]
        ) as Goal[];
        
        let syncedCount = 0;
        
        for (const goal of unsyncedGoals) {
            try {
                const { target_amount, target_month, target_year } = goal;
                const backendResult = await backendService.addGoal({
                    target_amount,
                    target_month,
                    target_year
                });
                
                db.runSync(
                    'UPDATE goals SET synced = 1, backend_id = ? WHERE id = ? AND user_id = ?',
                    [backendResult.data.id, goal.id, userId]
                );
                
                syncedCount++;
            } catch (error) {
                console.log(`Failed to sync goal ${goal.id}`);
            }
        }
        
        return syncedCount;
    } catch (error) {
        console.error('Error syncing pending goals:', error);
        return 0;
    }
}

// NEW: Fetch goals from backend and sync to local
export const syncGoalsFromBackend = async (): Promise<number> => {
    const userId = await getCurrentUserId();
    if (!userId) return 0;

    try {
        const backendGoals = await backendService.getGoals();
        let newGoalsCount = 0;

        for (const backendGoal of backendGoals) {
            // Check if goal already exists in local db by backend_id
            const existingGoals = db.getAllSync(
                'SELECT * FROM goals WHERE backend_id = ? AND user_id = ?',
                [backendGoal.id!, userId]
            ) as Goal[];

            if (existingGoals.length === 0) {
                // Insert the goal from backend
                db.runSync(
                    `INSERT INTO goals (target_amount, target_month, target_year, synced, backend_id, user_id, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        backendGoal.target_amount,
                        backendGoal.target_month,
                        backendGoal.target_year,
                        1, // Already synced since it's from backend
                        backendGoal.id!,
                        userId,
                        backendGoal.created_at || new Date().toISOString()
                    ]
                );
                newGoalsCount++;
            }
        }

        return newGoalsCount;
    } catch (error) {
        console.error('Error syncing goals from backend:', error);
        return 0;
    }
}

// NEW: Full sync function that does both directions
export const performFullSync = async (): Promise<{ transactionsSynced: number, goalsSynced: number, newTransactions: number, newGoals: number }> => {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { transactionsSynced: 0, goalsSynced: 0, newTransactions: 0, newGoals: 0 };
    }

    try {
        // Sync pending local data to backend
        const transactionsSynced = await syncPendingTransactions();
        const goalsSynced = await syncPendingGoals();

        // Sync from backend to local
        const newTransactions = await syncTransactionsFromBackend();
        const newGoals = await syncGoalsFromBackend();

        return {
            transactionsSynced,
            goalsSynced,
            newTransactions,
            newGoals
        };
    } catch (error) {
        console.error('Error performing full sync:', error);
        return { transactionsSynced: 0, goalsSynced: 0, newTransactions: 0, newGoals: 0 };
    }
}

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

export const clearUserGoals = async (): Promise<void> => {
    const userId = await getCurrentUserId();
    if (userId) {
        try {
            db.runSync('DELETE FROM goals WHERE user_id = ?', [userId]);
            console.log('Cleared goals for user:', userId);
        } catch (error) {
            console.error('Error clearing goals:', error);
        }
    }
}