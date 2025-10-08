import * as SQLite from 'expo-sqlite';

export interface Transaction {
    id?: number;
    amount: number;
    desc: string;
    type: "income" | "expense";
    category: string;
    date: string;
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
      date TEXT NOT NULL
    );
  `);
};

export const addTransaction = (transaction: Omit<Transaction, 'id'>): Promise<number> => {
    const {amount, desc, type, category, date} = transaction;
    const result = db.runSync(
    'INSERT INTO transactions (amount, desc, type, category, date) VALUES (?, ?, ?, ?, ?)',
    [amount, desc, type, category, date]
  );
  return Promise.resolve(result.lastInsertRowId);
}

export const getTransactions = (): Promise<Transaction[]> => {
    const result = db.getAllSync('SELECT * FROM transactions ORDER BY date DESC');
    return Promise.resolve(result as Transaction[]);
}

export const deleteTransaction = (id: number): Promise<void> => {
    db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
    return Promise.resolve();
}