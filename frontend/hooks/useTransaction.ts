import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { 
    addTransaction, 
    deleteTransaction, 
    getTransactions, 
    Transaction, 
    addTransactionWithSync, 
    syncPendingTransactions,
    clearUserTransactions 
} from "../services/database";
import { backendService } from "../services/backend";
import { useAuth } from "@/contexts/AuthContext";

export const useTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [backendAvailable, setBackendAvailable] = useState(false);
    const { isAuthenticated } = useAuth();

    const loadTransactions = async () => {
        try {
            const localData = await getTransactions();
            setTransactions(localData);
        } catch (error) {
            console.error('Error loading transactions:', error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const addNewTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        try {
            if (isAuthenticated && backendAvailable) {
                await addTransactionWithSync(transaction, () => {
                    Alert.alert(
                        "Success", 
                        "Transaction saved locally and synchronized with cloud!",
                        [{ text: "OK" }]
                    );
                });
            } else {
                await addTransaction(transaction);
                Alert.alert(
                    "Success", 
                    "Transaction saved locally. Sync when online.",
                    [{ text: "OK" }]
                );
            }
            await loadTransactions();
        } catch (error) {
            console.error('Error adding transaction:', error);
            Alert.alert('Error', 'Failed to add transaction');
            throw error;
        }
    };

    const removeTransaction = async (id: number) => {
        try {
            await deleteTransaction(id);
            await loadTransactions();
            Alert.alert('Success', 'Transaction deleted successfully!');
        } catch (error) {
            console.error('Error deleting transaction:', error);
            Alert.alert('Error', 'Failed to delete transaction');
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
            } 
            // else {
            //     Alert.alert(
            //         "Sync Complete", 
            //         "All transactions are already synced with cloud!",
            //         [{ text: "OK" }]
            //     );
            // }
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
            const isAvailable = await backendService.healthCheck();
            setBackendAvailable(isAvailable && isAuthenticated);
        } catch (error) {
            setBackendAvailable(false);
        }
    };

    // For development: clear transactions
    const clearTransactions = async () => {
        try {
            await clearUserTransactions();
            await loadTransactions();
            Alert.alert('Success', 'All transactions cleared');
        } catch (error) {
            console.error('Error clearing transactions:', error);
        }
    };

    useEffect(() => {
        loadTransactions();
        checkBackendStatus();
    }, [isAuthenticated]);

    return {
        transactions,
        loading,
        addTransaction: addNewTransaction,
        deleteTransaction: removeTransaction,
        refreshTransactions: loadTransactions,
        syncPendingTransactions: syncAllPending,
        backendAvailable,
        clearTransactions, // For development only
    };
};