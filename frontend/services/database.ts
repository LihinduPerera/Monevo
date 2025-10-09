import * as SQLite from 'expo-sqlite';
import { backendService, BackendTransaction } from './backend';

export interface Transaction {
    id?: number;
    amount: number;
    desc: string;
    type: "income" | "expense";
    category: string;
    date: string;
    synced?: boolean;
    backend_id?: number;
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
      backend_id INTEGER
    );
  `);
};

// Add transaction to both SQLite and backend
export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<number> => {
    const {amount, desc, type, category, date} = transaction;
    
    try {
        // First, save to SQLite
        const result = db.runSync(
            'INSERT INTO transactions (amount, desc, type, category, date, synced) VALUES (?, ?, ?, ?, ?, ?)',
            [amount, desc, type, category, date, 0]
        );
        
        const localId = result.lastInsertRowId;
        
        // Try to sync with backend
        try {
            const backendResult = await backendService.addTransaction(transaction);
            
            // Update local record with backend sync status
            db.runSync(
                'UPDATE transactions SET synced = 1, backend_id = ? WHERE id = ?',
                [backendResult.data.id, localId]
            );
            
            return localId;
        } catch (backendError) {
            console.log('Backend sync failed, transaction saved locally only');
            // Transaction is still saved locally, just not synced
            return localId;
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        throw error;
    }
}

// Add transaction with backend sync success callback
export const addTransactionWithSync = async (
    transaction: Omit<Transaction, 'id'>, 
    onBackendSuccess?: () => void
): Promise<number> => {
    const {amount, desc, type, category, date} = transaction;
    
    try {
        // First, save to SQLite
        const result = db.runSync(
            'INSERT INTO transactions (amount, desc, type, category, date, synced) VALUES (?, ?, ?, ?, ?, ?)',
            [amount, desc, type, category, date, 0]
        );
        
        const localId = result.lastInsertRowId;
        
        // Try to sync with backend
        try {
            const backendResult = await backendService.addTransaction(transaction);
            
            // Update local record with backend sync status
            db.runSync(
                'UPDATE transactions SET synced = 1, backend_id = ? WHERE id = ?',
                [backendResult.data.id, localId]
            );
            
            // Call success callback if provided
            if (onBackendSuccess) {
                onBackendSuccess();
            }
            
            return localId;
        } catch (backendError) {
            console.log('Backend sync failed, transaction saved locally only');
            // Transaction is still saved locally, just not synced
            return localId;
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        throw error;
    }
}

export const getTransactions = (): Promise<Transaction[]> => {
    const result = db.getAllSync('SELECT * FROM transactions ORDER BY date DESC');
    return Promise.resolve(result as Transaction[]);
}

export const deleteTransaction = async (id: number): Promise<void> => {
    try {
        // First get the transaction to check if it was synced
        const transactions = db.getAllSync('SELECT * FROM transactions WHERE id = ?', [id]) as Transaction[];
        const transaction = transactions[0];
        
        if (transaction && transaction.synced && transaction.backend_id) {
            // Try to delete from backend as well
            try {
                await backendService.deleteTransaction(transaction.backend_id);
            } catch (backendError) {
                console.log('Backend delete failed, but local delete will proceed');
            }
        }
        
        // Delete from local database
        db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
        return Promise.resolve();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        throw error;
    }
}

// Sync unsynced transactions with backend
export const syncPendingTransactions = async (): Promise<number> => {
    try {
        const unsyncedTransactions = db.getAllSync('SELECT * FROM transactions WHERE synced = 0') as Transaction[];
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
                
                // Update local record
                db.runSync(
                    'UPDATE transactions SET synced = 1, backend_id = ? WHERE id = ?',
                    [backendResult.data.id, transaction.id]
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