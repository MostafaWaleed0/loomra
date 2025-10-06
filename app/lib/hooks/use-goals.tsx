import { GoalFactory } from '@/lib/goal/goal-factory';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Goal,
  GoalWithStats,
  GoalFilters,
  GoalStats,
  DeleteStrategy,
  GoalSortBy,
  UseGoalsReturn,
  TaskWithStats
} from '../types';

export function useGoals(
  tasks: TaskWithStats[] = [],
  refreshTasks?: (() => Promise<void>) | null,
  refreshHabits?: (() => Promise<void>) | null
): UseGoalsReturn {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ==========================================================================
  // DATA LOADING & REFRESH
  // ==========================================================================
  const refreshGoals = useCallback(async () => {
    if (!window.electronAPI?.goals) return;
    setIsLoading(true);
    try {
      const goalsData: Goal[] = await window.electronAPI.goals.getAllGoals();
      setGoals(goalsData || []);
      setIsInitialized(true);
      setValidationErrors({});
    } catch (error) {
      console.error('Failed to load goals:', error);
      setValidationErrors({ general: 'Failed to load data from database' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshGoals();
  }, [refreshGoals]);

  useEffect(() => {
    if (isInitialized && tasks.length > 0) {
      void refreshGoals();
    }
  }, [tasks.length, isInitialized, refreshGoals]);

  // ==========================================================================
  // PROGRESS CALCULATION
  // ==========================================================================
  const calculateGoalProgress = useCallback(
    (goalId: string) => {
      const goalTasks = tasks.filter((t) => t.goalId === goalId);
      if (goalTasks.length === 0) return 0;
      return GoalFactory.calculateProgress(goalTasks.filter((t) => t.done).length, goalTasks.length);
    },
    [tasks]
  );

  // ==========================================================================
  // VALIDATION HANDLING
  // ==========================================================================
  const handleValidation = useCallback((validation: any) => {
    if (!validation?.isValid) {
      setValidationErrors(validation?.errorsByField || {});
      return false;
    }
    if (validation?.hasWarnings) {
      const warnings = (validation.errors || [])
        .filter((e: any) => e.error.includes('Using default') || e.error.includes('truncated'))
        .reduce((acc: Record<string, string>, { field, error }: any) => {
          acc[field] = error;
          return acc;
        }, {});
      setValidationErrors(warnings);
    }
    return true;
  }, []);

  // ==========================================================================
  // CORE ACTIONS
  // ==========================================================================
  const handleCreateGoal = useCallback(
    async (payload: Partial<Goal> = { title: 'New Goal' }) => {
      if (!window.electronAPI?.goals) {
        setValidationErrors({ general: 'Electron API not available' });
        return null;
      }
      setIsLoading(true);
      setValidationErrors({});
      try {
        const newGoal = GoalFactory.create({
          ...payload,
          title: payload.title || 'New Goal'
        });
        if (!newGoal) throw new Error('Failed to create goal');
        const savedGoal: Goal = await window.electronAPI.goals.createGoal(newGoal);
        await refreshGoals();
        setSelectedGoal(savedGoal);
        return savedGoal;
      } catch (error) {
        console.error('Error creating goal:', error);
        setValidationErrors({ general: 'Failed to create goal' });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshGoals]
  );

  const handleUpdateGoal = useCallback(
    async (goalId: string, updates: Partial<Goal>) => {
      if (!window.electronAPI?.goals || !goalId) {
        setValidationErrors({ general: 'Invalid request' });
        return false;
      }
      setIsLoading(true);
      setValidationErrors({});
      try {
        const existingGoal = goals.find((g) => g.id === goalId);
        if (!existingGoal) throw new Error('Goal not found');
        const updatedGoal = GoalFactory.update(existingGoal, updates);
        if (!updatedGoal) throw new Error('Failed to update goal');
        await window.electronAPI.goals.updateGoal(updatedGoal);
        await refreshGoals();
        if (selectedGoal?.id === goalId) {
          const updated = (await window.electronAPI.goals.getGoalById?.(goalId)) || goals.find((g) => g.id === goalId) || null;
          setSelectedGoal(updated);
        }
        return true;
      } catch (error) {
        console.error('Error updating goal:', error);
        setValidationErrors({ general: 'Failed to update goal' });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [goals, selectedGoal, refreshGoals]
  );

  const handleDeleteGoal = useCallback(
    async (goalId: string, deleteStrategy: DeleteStrategy = 'unlink') => {
      if (!window.electronAPI?.goals || !goalId) return false;
      try {
        const success: boolean = await window.electronAPI.goals.deleteGoal(goalId, deleteStrategy);
        if (success) {
          await refreshGoals();
          if (refreshTasks) await refreshTasks();
          if (refreshHabits) await refreshHabits();
          if (selectedGoal?.id === goalId) setSelectedGoal(null);
          setValidationErrors({});
        }
        return success;
      } catch (error) {
        console.error('Error deleting goal:', error);
        setValidationErrors({ general: 'Failed to delete goal' });
        return false;
      }
    },
    [selectedGoal, refreshGoals, refreshTasks, refreshHabits]
  );

  // ==========================================================================
  // QUICK STATUS ACTIONS
  // ==========================================================================
  const markAsCompleted = useCallback(
    (goalId: string) => handleUpdateGoal(goalId, { status: 'completed' as any }),
    [handleUpdateGoal]
  );
  const markAsActive = useCallback((goalId: string) => handleUpdateGoal(goalId, { status: 'active' as any }), [handleUpdateGoal]);
  const pauseGoal = useCallback((goalId: string) => handleUpdateGoal(goalId, { status: 'paused' as any }), [handleUpdateGoal]);

  // ==========================================================================
  // COMPUTED GOALS WITH STATS
  // ==========================================================================
  const goalsWithStats: GoalWithStats[] = useMemo(() => {
    try {
      return goals.map((goal) => {
        const goalTasks = tasks.filter((t) => t.goalId === goal.id);
        const completedTasks = goalTasks.filter((t) => t.done).length;
        const progress = GoalFactory.calculateProgress(completedTasks, goalTasks.length);
        const isOverdue = GoalFactory.isOverdue(goal);
        const daysUntilDeadline = GoalFactory.getDaysUntilDeadline(goal);
        return {
          ...goal,
          progress: progress !== (goal as any).progress ? progress : (goal as any).progress,
          taskCount: goalTasks.length,
          completedTaskCount: completedTasks,
          isCompleted: progress >= 100,
          isOverdue,
          daysUntilDeadline
        } as GoalWithStats;
      });
    } catch (error) {
      console.error('Error computing goal stats:', error);
      return [];
    }
  }, [goals, tasks]);

  // ==========================================================================
  // STATISTICS
  // ==========================================================================
  const stats: GoalStats = useMemo(() => {
    try {
      const totalGoals = goals.length;
      const completedGoals = goalsWithStats.filter((g) => g.isCompleted).length;
      const activeGoals = goalsWithStats.filter((g) => g.status === 'active' && !g.isCompleted).length;
      const pausedGoals = goalsWithStats.filter((g) => g.status === 'paused').length;
      const overdueGoals = goalsWithStats.filter((g) => g.isOverdue).length;
      const avgProgress = totalGoals > 0 ? Math.round(goalsWithStats.reduce((sum, g) => sum + g.progress, 0) / totalGoals) : 0;
      const totalTasks = goalsWithStats.reduce((sum, g) => sum + g.taskCount, 0);
      const completedTasks = goalsWithStats.reduce((sum, g) => sum + g.completedTaskCount, 0);
      const goalsWithDeadlines = goalsWithStats.filter((g) => g.deadline).length;
      const upcomingDeadlines = goalsWithStats
        .filter((g) => g.deadline && g.daysUntilDeadline !== null && g.daysUntilDeadline >= 0 && g.daysUntilDeadline <= 7)
        .sort((a, b) => (a.daysUntilDeadline || 0) - (b.daysUntilDeadline || 0));

      return {
        totalGoals,
        completedGoals,
        activeGoals,
        pausedGoals,
        overdueGoals,
        avgProgress,
        totalTasks,
        completedTasks,
        goalsWithDeadlines,
        upcomingDeadlines
      } as GoalStats;
    } catch (error) {
      console.error('Error computing goal statistics:', error);
      return {
        totalGoals: 0,
        completedGoals: 0,
        activeGoals: 0,
        pausedGoals: 0,
        overdueGoals: 0,
        avgProgress: 0,
        totalTasks: 0,
        completedTasks: 0,
        goalsWithDeadlines: 0,
        upcomingDeadlines: []
      } as GoalStats;
    }
  }, [goals, goalsWithStats]);

  // ==========================================================================
  // FILTERING & SORTING
  // ==========================================================================
  const getFilteredGoals = useCallback(
    (filters: GoalFilters = {}) => {
      return goalsWithStats.filter((goal) => {
        if (filters.status && goal.status !== filters.status) return false;
        if (filters.priority && goal.priority !== filters.priority) return false;
        if (filters.category && goal.category !== filters.category) return false;
        if (filters.completed !== undefined && goal.isCompleted !== filters.completed) return false;
        if (filters.overdue !== undefined && goal.isOverdue !== filters.overdue) return false;
        if (filters.hasDeadline !== undefined && !!goal.deadline !== filters.hasDeadline) return false;
        if (filters.search) {
          const term = filters.search.toLowerCase();
          return (
            (goal.title || '').toLowerCase().includes(term) ||
            (goal.description || '').toLowerCase().includes(term) ||
            (goal.category || '').toString().toLowerCase().includes(term) ||
            ((goal as any).notes || '').toLowerCase().includes(term)
          );
        }
        return true;
      });
    },
    [goalsWithStats]
  );

  const getSortedGoals = useCallback(
    (sortBy?: GoalSortBy, ascending: boolean = false) => {
      return GoalFactory.sortGoals(goalsWithStats, sortBy, ascending);
    },
    [goalsWithStats]
  );

  // ==========================================================================
  // GROUPING QUERIES
  // ==========================================================================
  const getGoalsByCategory = useCallback(() => GoalFactory.getGoalsByCategory(goalsWithStats), [goalsWithStats]);
  const getGoalsByStatus = useCallback(() => GoalFactory.getGoalsByStatus(goalsWithStats), [goalsWithStats]);
  const getGoalById = useCallback((goalId: string) => goalsWithStats.find((g) => g.id === goalId) || null, [goalsWithStats]);

  // ==========================================================================
  // RETURN API
  // ==========================================================================
  return {
    goals: goalsWithStats,
    selectedGoal,
    setSelectedGoal,
    validationErrors,
    stats,
    isLoading,
    handleCreateGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    markAsCompleted,
    markAsActive,
    pauseGoal,
    getFilteredGoals,
    getSortedGoals,
    getGoalsByCategory,
    getGoalsByStatus,
    getGoalById,
    calculateGoalProgress
  };
}
