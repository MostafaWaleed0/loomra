import { useCallback, useEffect, useMemo, useState } from 'react';
import { generateId } from '../core';
import { TaskUtils } from '../tasks/task-utils';
import { commands } from '../tauri-api';
import type {
  Task,
  TaskFilter,
  TaskFilters,
  TaskFormData,
  TaskPriority,
  TaskStats,
  TaskTimeFilter,
  TaskUpdates,
  TaskWithStats,
  UseTasksReturn
} from '../types';

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTasks = useCallback(async (): Promise<void> => {
    try {
      const data = await commands.tasks.getAllTasks();
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

  const tasksWithStats = useMemo((): TaskWithStats[] => {
    const taskMap = new Map<string, TaskWithStats>();
    const now = new Date();

    tasks.forEach((task) => {
      const createdDate = new Date(task.createdAt);
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const isOverdue = Boolean(dueDate && dueDate < now && !task.done);
      const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

      taskMap.set(task.id, {
        ...task,
        isOverdue,
        daysUntilDue,
        daysSinceCreated,
        subtasks: [],
        subtaskCount: 0,
        completedSubtaskCount: 0
      });
    });

    const rootTasks: TaskWithStats[] = [];
    taskMap.forEach((task) => {
      if (task.parentTaskId) {
        const parent = taskMap.get(task.parentTaskId);
        if (parent) parent.subtasks!.push(task);
      } else {
        rootTasks.push(task);
      }
    });

    function calculateNestedCounts(task: TaskWithStats): void {
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(calculateNestedCounts);

        task.subtaskCount = task.subtasks.reduce((sum, sub) => {
          return sum + (sub.subtaskCount || 1);
        }, 0);

        task.completedSubtaskCount = task.subtasks.reduce((sum, sub) => {
          return sum + (sub.completedSubtaskCount || (sub.done ? 1 : 0));
        }, 0);

        task.done = task.completedSubtaskCount === task.subtaskCount && task.subtaskCount > 0;
      }
    }

    rootTasks.forEach(calculateNestedCounts);
    return rootTasks;
  }, [tasks]);

  const handleCreateTask = useCallback(
    async (
      title: string,
      goalId?: string | null,
      dueDate?: string,
      priority?: TaskPriority,
      parentTaskId?: string | null
    ): Promise<Task | undefined> => {
      if (!title?.trim()) return;

      const taskData: TaskFormData = {
        id: generateId('task'),
        title: title.trim(),
        done: false,
        goalId: goalId ?? null,
        parentTaskId: parentTaskId ?? null,
        dueDate: dueDate ?? undefined,
        priority: priority ?? 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        const newTask = await commands.tasks.createTask(taskData as Task);
        setTasks((prev) => [newTask, ...prev]);
        return newTask;
      } catch (error) {
        console.error('Failed to create task:', error);
      }
    },
    []
  );

  const handleCreateSubtask = useCallback(
    async (
      title: string,
      parentTaskId: string,
      goalId?: string | null,
      dueDate?: string,
      priority?: TaskPriority
    ): Promise<Task | undefined> => {
      const parentTask = tasks.find((t) => t.id === parentTaskId);
      if (!parentTask) return;

      const inheritedGoalId = goalId !== undefined ? goalId : parentTask.goalId;
      const inheritedDueDate = dueDate !== undefined ? dueDate : parentTask.dueDate;
      const inheritedPriority = priority !== undefined ? priority : parentTask.priority;

      return handleCreateTask(title, inheritedGoalId, inheritedDueDate, inheritedPriority, parentTaskId);
    },
    [handleCreateTask, tasks]
  );

  const handleEditTask = useCallback(
    async (taskId: string, updates: TaskUpdates): Promise<void> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const updatedTask: Task = {
        ...task,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

      try {
        await commands.tasks.updateTask(updatedTask);
      } catch (error) {
        console.error('Failed to edit task:', error);
        setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
      }
    },
    [tasks]
  );

  const handleToggleTask = useCallback(
    async (taskId: string): Promise<void> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const hasSubtasks = tasks.some((t) => t.parentTaskId === taskId);
      if (hasSubtasks) return;

      const updatedTask: Task = {
        ...task,
        done: !task.done,
        updatedAt: new Date().toISOString()
      };

      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

      try {
        await commands.tasks.updateTask(updatedTask);

        if (task.parentTaskId) {
          const siblings = tasks.filter((t) => t.parentTaskId === task.parentTaskId);
          const allSiblingsDone = siblings.every((t) => (t.id === taskId ? !task.done : t.done));
          const parent = tasks.find((t) => t.id === task.parentTaskId);

          if (parent && parent.done !== allSiblingsDone) {
            const updatedParent = { ...parent, done: allSiblingsDone, updatedAt: new Date().toISOString() };
            setTasks((prev) => prev.map((t) => (t.id === parent.id ? updatedParent : t)));
            await commands.tasks.updateTask(updatedParent);
          }
        }
      } catch (error) {
        console.error('Failed to toggle task:', error);
        setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
      }
    },
    [tasks]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string): Promise<void> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      try {
        await commands.tasks.deleteTask(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
        setTasks((prev) => [...prev, task]);
      }
    },
    [tasks]
  );

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

  const getSubtasks = useCallback(
    (parentTaskId: string): TaskWithStats[] => {
      const parent = tasksWithStats.find((t) => t.id === parentTaskId);
      return parent?.subtasks || [];
    },
    [tasksWithStats]
  );

  const getAllSubtasksFlat = useCallback(
    (parentTaskId: string): TaskWithStats[] => {
      const result: TaskWithStats[] = [];

      function collectSubtasks(task: TaskWithStats) {
        if (task.subtasks) {
          task.subtasks.forEach((sub) => {
            result.push(sub);
            collectSubtasks(sub);
          });
        }
      }

      const parent = tasksWithStats.find((t) => t.id === parentTaskId);
      if (parent) collectSubtasks(parent);

      return result;
    },
    [tasksWithStats]
  );

  const getFilteredTasks = useCallback(
    (filters: TaskFilters = {}): TaskWithStats[] => {
      const searchQuery = filters.search ?? '';

      const statusFilter: TaskFilter = filters.done === undefined ? 'all' : filters.done ? 'completed' : 'active';

      let timeFilter: TaskTimeFilter = 'all';
      if (filters.today) timeFilter = 'today';
      if (filters.overdue) timeFilter = 'overdue';

      return TaskUtils.filterTasksHierarchical(tasksWithStats, searchQuery, statusFilter, timeFilter);
    },
    [tasksWithStats]
  );

  const getTasksByGoal = useCallback(
    (goalId: string): TaskWithStats[] => {
      const results: TaskWithStats[] = [];

      function collectActionable(taskList: TaskWithStats[]) {
        taskList.forEach((task) => {
          if (task.goalId === goalId) {
            if (task.subtasks && task.subtasks.length > 0) {
              collectActionable(task.subtasks);
            } else {
              results.push(task);
            }
          }
        });
      }

      collectActionable(tasksWithStats);
      return results.sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
    },
    [tasksWithStats]
  );

  const getTaskById = useCallback(
    (taskId: string): TaskWithStats | null => {
      function findTask(tasks: TaskWithStats[]): TaskWithStats | null {
        for (const task of tasks) {
          if (task.id === taskId) return task;
          if (task.subtasks && task.subtasks.length > 0) {
            const found = findTask(task.subtasks);
            if (found) return found;
          }
        }
        return null;
      }
      return findTask(tasksWithStats);
    },
    [tasksWithStats]
  );

  const getUpcomingTasks = useCallback(
    (days = 7): TaskWithStats[] => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const upcoming: TaskWithStats[] = [];

      function collectUpcoming(taskList: TaskWithStats[]) {
        taskList.forEach((task) => {
          if (task.subtasks && task.subtasks.length > 0) {
            collectUpcoming(task.subtasks);
          } else if (task.dueDate && !task.done) {
            const dueDate = new Date(task.dueDate);
            if (dueDate >= now && dueDate <= futureDate) {
              upcoming.push(task);
            }
          }
        });
      }

      collectUpcoming(tasksWithStats);
      return upcoming.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    },
    [tasksWithStats]
  );

  const stats = useMemo((): TaskStats => {
    const actionableTasks = TaskUtils.getActionableTasks(tasksWithStats);
    const completed = actionableTasks.filter((t) => t.done).length;
    const overdue = actionableTasks.filter((t) => t.isOverdue).length;
    const dueToday = actionableTasks.filter((t) => {
      if (!t.dueDate) return false;
      const today = new Date().toDateString();
      return new Date(t.dueDate).toDateString() === today && !t.done;
    }).length;

    const priorityCounts = actionableTasks.reduce(
      (acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      { low: 0, medium: 0, high: 0 } as Record<TaskPriority, number>
    );

    const tasksWithGoals = actionableTasks.filter((t) => t.goalId !== null).length;

    return {
      totalTasks: actionableTasks.length,
      completedTasks: completed,
      pendingTasks: actionableTasks.length - completed,
      overdueTasks: overdue,
      tasksWithGoals,
      tasksWithoutGoals: actionableTasks.length - tasksWithGoals,
      tasksByPriority: priorityCounts,
      completionRate: actionableTasks.length > 0 ? Math.round((completed / actionableTasks.length) * 100) : 0
    };
  }, [tasksWithStats]);

  return {
    tasks: tasksWithStats,
    stats,
    isLoading,
    refreshTasks,
    handleCreateTask,
    handleCreateSubtask,
    handleEditTask,
    handleToggleTask,
    handleDeleteTask,
    handleUpdateTaskPriority,
    handleLinkTaskToGoal,
    getFilteredTasks,
    getTasksByGoal,
    getTaskById,
    getUpcomingTasks,
    getSubtasks,
    getAllSubtasksFlat
  };
}
