import { useEffect, useState } from "react";
import { addTransaction, deleteTransaction, getTransactions, Transaction } from "../service/database"

export const useTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTransactions = async () => {
        try {
            const data = await getTransactions();
            setTransactions(data);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const addNewTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        try {
            await addTransaction(transaction);
            await loadTransactions();
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    };

    const removeTransaction = async (id: number) => {
        try {
            await deleteTransaction(id);
            await loadTransactions();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    return {
        transactions,
        loading,
        addTransaction: addNewTransaction,
        deleteTransaction: removeTransaction,
        refreshTransactions: loadTransactions,
    };
}