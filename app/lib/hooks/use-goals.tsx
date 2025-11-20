import { GoalFactory } from '@/lib/goal/goal-factory';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TaskUtils } from '../tasks/task-utils';
import { AppSettings, commands } from '../tauri-api';
import type {
  DeleteStrategy,
  Goal,
  GoalFilters,
  GoalSortBy,
  GoalStats,
  GoalWithStats,
  TaskWithStats,
  UseGoalsReturn
} from '../types';

export function useGoals(
  tasks: TaskWithStats[] = [],
  refreshTasks?: (() => Promise<void>) | null,
  refreshHabits?: (() => Promise<void>) | null,
  settings?: AppSettings['goals']
): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refreshGoals = useCallback(async () => {
    try {
      const goalsData = await commands.goals.getAllGoals();
      setGoals(goalsData || []);
      setValidationErrors({});

      if (selectedGoalId && !goalsData.find((g: Goal) => g.id === selectedGoalId)) {
        setSelectedGoalId(null);
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
      setValidationErrors({ general: 'Failed to load data from database' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedGoalId]);

  useEffect(() => {
    refreshGoals();
  }, [refreshGoals]);

  const calculateGoalProgress = useCallback(
    (goalId: string) => {
      const actionableTasks = TaskUtils.getActionableTasks(tasks).filter((t) => t.goalId === goalId);
      if (actionableTasks.length === 0) return 0;

      const completed = actionableTasks.filter((t) => t.done).length;
      return GoalFactory.calculateProgress(completed, actionableTasks.length);
    },
    [tasks]
  );

  const goalsWithStats: GoalWithStats[] = useMemo(() => {
    return goals.map((goal) => {
      const actionableTasks = TaskUtils.getActionableTasks(tasks).filter((t) => t.goalId === goal.id);
      const completedTasks = actionableTasks.filter((t) => t.done).length;
      const progress = GoalFactory.calculateProgress(completedTasks, actionableTasks.length);

      return {
        ...goal,
        progress,
        taskCount: actionableTasks.length,
        completedTaskCount: completedTasks,
        isCompleted: progress >= 100,
        isOverdue: GoalFactory.isOverdue(goal),
        daysUntilDeadline: GoalFactory.getDaysUntilDeadline(goal)
      } as GoalWithStats;
    });
  }, [goals, tasks]);

  const selectedGoal = useMemo(() => {
    if (!selectedGoalId) return null;
    return goalsWithStats.find((g) => g.id === selectedGoalId) || null;
  }, [selectedGoalId, goalsWithStats]);

  const setSelectedGoal = useCallback((goal: Goal | GoalWithStats | null) => {
    setSelectedGoalId(goal?.id || null);
  }, []);

  const handleCreateGoal = useCallback(
    async (payload: Partial<Goal> = { title: 'New Goal' }) => {
      if (!commands?.goals) {
        setValidationErrors({ general: 'API not available' });
        return null;
      }

      setValidationErrors({});

      try {
        const newGoal = GoalFactory.create({ ...payload, title: payload.title || 'New Goal' }, null, settings);

        if (!newGoal) throw new Error('Failed to create goal');

        const savedGoal = await commands.goals.createGoal(newGoal);
        setGoals((prev) => [savedGoal, ...prev]);
        setSelectedGoalId(savedGoal.id);

        return savedGoal;
      } catch (error) {
        console.error('Error creating goal:', error);
        setValidationErrors({ general: 'Failed to create goal' });
        return null;
      }
    },
    [settings]
  );

  const handleUpdateGoal = useCallback(
    async (goalId: string, updates: Partial<Goal>) => {
      if (!commands?.goals || !goalId) {
        setValidationErrors({ general: 'Invalid request' });
        return false;
      }

      const existingGoal = goals.find((g) => g.id === goalId);
      if (!existingGoal) return false;

      setValidationErrors({});

      try {
        const updatedGoal = GoalFactory.update(existingGoal, updates, settings);
        if (!updatedGoal) throw new Error('Failed to update goal');

        setGoals((prev) => prev.map((g) => (g.id === goalId ? updatedGoal : g)));
        await commands.goals.updateGoal(updatedGoal);

        return true;
      } catch (error) {
        console.error('Error updating goal:', error);
        setValidationErrors({ general: 'Failed to update goal' });
        await refreshGoals();
        return false;
      }
    },
    [goals, refreshGoals, settings]
  );

  const handleDeleteGoal = useCallback(
    async (goalId: string, deleteStrategy: DeleteStrategy = 'unlink') => {
      if (!goalId) return false;

      try {
        const success = await commands.goals.deleteGoal(goalId, deleteStrategy);

        if (success) {
          setGoals((prev) => prev.filter((g) => g.id !== goalId));
          if (selectedGoalId === goalId) setSelectedGoalId(null);
          setValidationErrors({});

          if (deleteStrategy !== 'unlink') {
            if (refreshTasks) await refreshTasks();
            if (refreshHabits) await refreshHabits();
          }
        }

        return success;
      } catch (error) {
        console.error('Error deleting goal:', error);
        setValidationErrors({ general: 'Failed to delete goal' });
        return false;
      }
    },
    [selectedGoalId, refreshTasks, refreshHabits]
  );

  const markAsCompleted = useCallback((goalId: string) => handleUpdateGoal(goalId, { status: 'completed' }), [handleUpdateGoal]);

  const markAsActive = useCallback((goalId: string) => handleUpdateGoal(goalId, { status: 'active' }), [handleUpdateGoal]);

  const pauseGoal = useCallback((goalId: string) => handleUpdateGoal(goalId, { status: 'paused' }), [handleUpdateGoal]);

  const stats: GoalStats = useMemo(() => {
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
      .filter((g) => g.daysUntilDeadline !== null && g.daysUntilDeadline >= 0 && g.daysUntilDeadline <= 7)
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
    };
  }, [goals.length, goalsWithStats]);

  const getFilteredGoals = useCallback(
    (filters: GoalFilters = {}) => {
      return goalsWithStats.filter((goal) => {
        if (filters.status && goal.status !== filters.status) return false;
        if (filters.priority && goal.priority !== filters.priority) return false;
        if (filters.category && goal.category !== filters.category) return false;
        if (filters.completed !== undefined && goal.isCompleted !== filters.completed) return false;
        if (filters.overdue !== undefined && goal.isOverdue !== filters.overdue) return false;
        if (filters.hasDeadline !== undefined && Boolean(goal.deadline) !== filters.hasDeadline) return false;
        if (filters.search) {
          const term = filters.search.toLowerCase();
          return (
            goal.title?.toLowerCase().includes(term) ||
            goal.description?.toLowerCase().includes(term) ||
            goal.category?.toLowerCase().includes(term)
          );
        }
        return true;
      });
    },
    [goalsWithStats]
  );

  const getSortedGoals = useCallback(
    (sortBy?: GoalSortBy, ascending = false) => {
      return GoalFactory.sortGoals(goalsWithStats, sortBy, ascending);
    },
    [goalsWithStats]
  );

  const getGoalByTaskId = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !task.goalId) return null;
      return goalsWithStats.find((g) => g.id === task.goalId) || null;
    },
    [tasks, goalsWithStats]
  );

  const getGoalsByCategory = useCallback(() => GoalFactory.getGoalsByCategory(goalsWithStats), [goalsWithStats]);

  const getGoalsByStatus = useCallback(() => GoalFactory.getGoalsByStatus(goalsWithStats), [goalsWithStats]);

  const getGoalById = useCallback((goalId: string) => goalsWithStats.find((g) => g.id === goalId) || null, [goalsWithStats]);

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
    getGoalByTaskId,
    calculateGoalProgress
  };
}
