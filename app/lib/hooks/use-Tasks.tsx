import { useCallback, useEffect, useMemo, useState } from 'react';
import { generateId } from '../core';
import type {
  Task,
  TaskWithStats,
  TaskFormData,
  TaskUpdates,
  TaskFilters,
  TaskStats,
  UseTasksReturn,
  TaskPriority
} from '../types';

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const refreshTasks = useCallback(async (): Promise<void> => {
    if (!window.electronAPI?.tasks) return;

    setIsLoading(true);
    try {
      const data = await window.electronAPI.tasks.getAllTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  // ============================================================================
  // CREATE TASK
  // ============================================================================

  const handleCreateTask = useCallback(
    async (title: string, goalId?: string | null, dueDate?: string): Promise<Task | undefined> => {
      if (!title?.trim()) return;

      const taskData: TaskFormData = {
        id: generateId('task'),
        title: title.trim(),
        description: '',
        done: false,
        goalId: goalId ?? null,
        dueDate: dueDate ?? undefined,
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        const newTask = await window.electronAPI.tasks.createTask(taskData);
        setTasks((prev) => [newTask, ...prev]);
        return newTask;
      } catch (error) {
        console.error('Failed to create task:', error);
      }
    },
    []
  );

  // ============================================================================
  // UPDATE TASK
  // ============================================================================

  const handleEditTask = useCallback(
    async (taskId: string, updates: TaskUpdates): Promise<void> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const updatedTask: Task = {
        ...task,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      try {
        await window.electronAPI.tasks.updateTask(updatedTask);
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      } catch (error) {
        console.error('Failed to edit task:', error);
      }
    },
    [tasks]
  );

  const handleToggleTask = useCallback(
    async (taskId: string): Promise<void> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const updatedTask: Task = {
        ...task,
        done: !task.done,
        updatedAt: new Date().toISOString()
      };

      try {
        await window.electronAPI.tasks.updateTask(updatedTask);
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      } catch (error) {
        console.error('Failed to toggle task:', error);
      }
    },
    [tasks]
  );

  const handleDeleteTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      await window.electronAPI.tasks.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }, []);

  const handleUpdateTaskPriority = useCallback(
    async (taskId: string, priority: TaskPriority): Promise<void> => {
      await handleEditTask(taskId, { priority });
    },
    [handleEditTask]
  );

  const handleLinkTaskToGoal = useCallback(
    async (taskId: string, goalId: string | null): Promise<void> => {
      await handleEditTask(taskId, { goalId });
    },
    [handleEditTask]
  );

  // ============================================================================
  // COMPUTED TASKS WITH STATS
  // ============================================================================

  const tasksWithStats = useMemo((): TaskWithStats[] => {
    return tasks.map((task) => {
      const now = new Date();
      const createdDate = new Date(task.createdAt);
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;

      const isOverdue = !!(dueDate && dueDate < now && !task.done);
      const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

      return { ...task, isOverdue, daysUntilDue, daysSinceCreated };
    });
  }, [tasks]);

  // ============================================================================
  // STATISTICS
  // ============================================================================

  const stats = useMemo((): TaskStats => {
    const completed = tasksWithStats.filter((t) => t.done).length;
    const overdue = tasksWithStats.filter((t) => t.isOverdue).length;

    const dueToday = tasksWithStats.filter((t) => {
      if (!t.dueDate) return false;
      const today = new Date().toDateString();
      return new Date(t.dueDate).toDateString() === today && !t.done;
    }).length;

    const priorityCounts = tasksWithStats.reduce(
      (acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      { low: 0, medium: 0, high: 0 } as Record<TaskPriority, number>
    );

    const tasksWithGoals = tasksWithStats.filter((t) => t.goalId !== null).length;
    const tasksWithoutGoals = tasksWithStats.length - tasksWithGoals;

    return {
      totalTasks: tasks.length,
      completedTasks: completed,
      pendingTasks: tasks.length - completed,
      overdueTasks: overdue,
      tasksWithGoals,
      tasksWithoutGoals,
      tasksByPriority: priorityCounts,
      completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    };
  }, [tasksWithStats, tasks.length]);

  // ============================================================================
  // FILTERING
  // ============================================================================

  const getFilteredTasks = useCallback(
    (filters: TaskFilters = {}): TaskWithStats[] => {
      return tasksWithStats.filter((task) => {
        if (filters.goalId !== undefined && task.goalId !== filters.goalId) return false;
        if (filters.done !== undefined && task.done !== filters.done) return false;
        if (filters.priority && task.priority !== filters.priority) return false;
        if (filters.overdue && !task.isOverdue) return false;
        if (filters.hasGoal !== undefined && (task.goalId !== null) !== filters.hasGoal) return false;
        if (filters.hasDueDate !== undefined && (task.dueDate !== undefined) !== filters.hasDueDate) return false;
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          return task.title.toLowerCase().includes(searchTerm) || task.description.toLowerCase().includes(searchTerm);
        }
        if (filters.today) {
          const today = new Date().toDateString();
          const taskDue = task.dueDate ? new Date(task.dueDate).toDateString() : null;
          if (taskDue !== today) return false;
        }
        return true;
      });
    },
    [tasksWithStats]
  );

  const getTasksByGoal = useCallback(
    (goalId: string): TaskWithStats[] => {
      return tasksWithStats.filter((t) => t.goalId === goalId).sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
    },
    [tasksWithStats]
  );

  const getTaskById = useCallback(
    (taskId: string): TaskWithStats | null => {
      return tasksWithStats.find((t) => t.id === taskId) || null;
    },
    [tasksWithStats]
  );

  const getUpcomingTasks = useCallback(
    (days: number = 7): TaskWithStats[] => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const upcoming = tasksWithStats.filter((task) => {
        if (!task.dueDate || task.done) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= futureDate;
      });

      return upcoming.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    },
    [tasksWithStats]
  );

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    tasks: tasksWithStats,
    stats,
    isLoading,
    refreshTasks,
    handleCreateTask,
    handleEditTask,
    handleToggleTask,
    handleDeleteTask,
    handleUpdateTaskPriority,
    handleLinkTaskToGoal,
    getFilteredTasks,
    getTasksByGoal,
    getTaskById,
    getUpcomingTasks
  };
}
