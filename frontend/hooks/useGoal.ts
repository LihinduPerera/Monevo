import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { 
    addGoal, 
    deleteGoal, 
    getGoals, 
    Goal, 
    addGoalWithSync, 
    syncPendingGoals,
    clearUserGoals,
    syncGoalsFromBackend
} from "../services/database";
import { backendService } from "../services/backend";
import { useAuth } from "@/contexts/AuthContext";

export const useGoals = () => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [backendAvailable, setBackendAvailable] = useState(false);
    const { isAuthenticated } = useAuth();

    const loadGoals = async () => {
        try {
            const localData = await getGoals();
            setGoals(localData);
        } catch (error) {
            console.error('Error loading goals:', error);
            setGoals([]);
        } finally {
            setLoading(false);
        }
    };

    const addNewGoal = async (goal: Omit<Goal, 'id'>) => {
        try {
            if (isAuthenticated && backendAvailable) {
                await addGoalWithSync(goal, () => {
                    Alert.alert(
                        "Success", 
                        "Goal saved locally and synchronized with cloud!",
                        [{ text: "OK" }]
                    );
                });
            } else {
                await addGoal(goal);
                Alert.alert(
                    "Success", 
                    "Goal saved locally. Sync when online.",
                    [{ text: "OK" }]
                );
            }
            await loadGoals();
        } catch (error) {
            console.error('Error adding goal:', error);
            Alert.alert('Error', 'Failed to add goal');
            throw error;
        }
    };

    const removeGoal = async (id: number) => {
        try {
            await deleteGoal(id);
            await loadGoals();
            Alert.alert('Success', 'Goal deleted successfully!');
        } catch (error) {
            console.error('Error deleting goal:', error);
            Alert.alert('Error', 'Failed to delete goal');
            throw error;
        }
    };

    const syncAllPending = async () => {
        try {
            const syncedCount = await syncPendingGoals();
            if (syncedCount > 0) {
                Alert.alert(
                    "Sync Complete", 
                    `Successfully synced ${syncedCount} goals with cloud!`,
                    [{ text: "OK" }]
                );
            }
            await loadGoals();
            return syncedCount;
        } catch (error) {
            console.error('Error syncing goals:', error);
            Alert.alert("Sync Failed", "Failed to sync goals with cloud");
            return 0;
        }
    };

    // NEW: Sync from backend to local
    const syncFromBackend = async () => {
        try {
            const newGoalsCount = await syncGoalsFromBackend();
            if (newGoalsCount > 0) {
                Alert.alert(
                    "Sync Complete", 
                    `Downloaded ${newGoalsCount} new goals from cloud!`,
                    [{ text: "OK" }]
                );
            }
            await loadGoals();
            return newGoalsCount;
        } catch (error) {
            console.error('Error syncing from backend:', error);
            Alert.alert("Sync Failed", "Failed to download goals from cloud");
            return 0;
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

    // For development: clear goals
    const clearGoals = async () => {
        try {
            await clearUserGoals();
            await loadGoals();
            Alert.alert('Success', 'All goals cleared');
        } catch (error) {
            console.error('Error clearing goals:', error);
        }
    };

    useEffect(() => {
        loadGoals();
        checkBackendStatus();
    }, [isAuthenticated]);

    return {
        goals,
        loading,
        addGoal: addNewGoal,
        deleteGoal: removeGoal,
        refreshGoals: loadGoals,
        syncPendingGoals: syncAllPending,
        syncFromBackend, // NEW
        backendAvailable,
        clearGoals, // For development only
    };
};