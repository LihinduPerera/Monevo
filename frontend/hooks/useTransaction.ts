import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { 
    addTransaction, 
    deleteTransaction, 
    getTransactions, 
    Transaction, 
    addTransactionWithSync, 
    syncPendingTransactions,
    clearUserTransactions,
    performFullSync,
    syncTransactionsFromBackend
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
            await loadTransactions();
            return syncedCount;
        } catch (error) {
            console.error('Error syncing transactions:', error);
            Alert.alert("Sync Failed", "Failed to sync transactions with cloud");
            return 0;
        }
    };

    // NEW: Sync from backend to local
    const syncFromBackend = async () => {
        try {
            const newTransactionsCount = await syncTransactionsFromBackend();
            if (newTransactionsCount > 0) {
                Alert.alert(
                    "Sync Complete", 
                    `Downloaded ${newTransactionsCount} new transactions from cloud!`,
                    [{ text: "OK" }]
                );
            }
            await loadTransactions();
            return newTransactionsCount;
        } catch (error) {
            console.error('Error syncing from backend:', error);
            Alert.alert("Sync Failed", "Failed to download transactions from cloud");
            return 0;
        }
    };

    // NEW: Perform full sync (both directions)
    const performFullDataSync = async () => {
        try {
            const syncResult = await performFullSync();
            let message = "Sync Complete!\n";
            
            if (syncResult.transactionsSynced > 0) {
                message += `Uploaded ${syncResult.transactionsSynced} transactions\n`;
            }
            if (syncResult.goalsSynced > 0) {
                message += `Uploaded ${syncResult.goalsSynced} goals\n`;
            }
            if (syncResult.newTransactions > 0) {
                message += `Downloaded ${syncResult.newTransactions} transactions\n`;
            }
            if (syncResult.newGoals > 0) {
                message += `Downloaded ${syncResult.newGoals} goals\n`;
            }
            
            if (syncResult.transactionsSynced === 0 && syncResult.goalsSynced === 0 && 
                syncResult.newTransactions === 0 && syncResult.newGoals === 0) {
                message = "All data is already synchronized!";
            }
            
            Alert.alert("Sync Complete", message, [{ text: "OK" }]);
            
            await loadTransactions();
            return syncResult;
        } catch (error) {
            console.error('Error performing full sync:', error);
            Alert.alert("Sync Failed", "Failed to synchronize data with cloud");
            return { transactionsSynced: 0, goalsSynced: 0, newTransactions: 0, newGoals: 0 };
        }
    };

    const checkBackendStatus = async () => {
        try {
            const isAvailable = await backendService.healthCheck();
            setBackendAvailable(isAvailable && isAuthenticated);
            
            // If backend is available and user is authenticated, sync from backend
            if (isAvailable && isAuthenticated) {
                await syncFromBackend();
            }
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
        syncFromBackend, // NEW
        performFullDataSync, // NEW
        backendAvailable,
        clearTransactions, // For development only
    };
};