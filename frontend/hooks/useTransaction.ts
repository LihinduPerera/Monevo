import { useEffect, useState } from "react";
import { 
    addTransaction, 
    deleteTransaction, 
    getTransactions, 
    Transaction, 
    addTransactionWithSync, 
    syncPendingTransactions 
} from "../services/database";
import { Alert } from "react-native";

export const useTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [backendAvailable, setBackendAvailable] = useState(false);

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
            await addTransactionWithSync(transaction, () => {
                // This callback runs when backend sync is successful
                Alert.alert(
                    "Success", 
                    "Transaction saved locally and synchronized with cloud!",
                    [{ text: "OK" }]
                );
            });
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

    const syncAllPending = async () => {
        try {
            const syncedCount = await syncPendingTransactions();
            if (syncedCount > 0) {
                Alert.alert(
                    "Sync Complete", 
                    `Successfully synced ${syncedCount} transactions with cloud!`,
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert(
                    "Sync Complete", 
                    "All transactions are already synced with cloud!",
                    [{ text: "OK" }]
                );
            }
            await loadTransactions();
            return syncedCount;
        } catch (error) {
            console.error('Error syncing transactions:', error);
            Alert.alert("Sync Failed", "Failed to sync transactions with cloud");
            return 0;
        }
    };

    const checkBackendStatus = async () => {
        try {
            // We'll assume backend is available for now
            // You can implement actual health check later
            setBackendAvailable(true);
        } catch (error) {
            setBackendAvailable(false);
        }
    };

    useEffect(() => {
        loadTransactions();
        checkBackendStatus();
    }, []);

    return {
        transactions,
        loading,
        addTransaction: addNewTransaction,
        deleteTransaction: removeTransaction,
        refreshTransactions: loadTransactions,
        syncPendingTransactions: syncAllPending,
        backendAvailable,
    };
};