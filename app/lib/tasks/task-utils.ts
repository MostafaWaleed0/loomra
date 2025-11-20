import { DateUtils } from '../core/date-utils';
import type { TaskWithStats, TaskTimeFilter, TaskFilter } from '../types';

export class TaskUtils {
  private static dateCache = new Map<string, string>();

  private static getCachedCurrentDate(): string {
    const key = 'today';
    if (!this.dateCache.has(key)) {
      this.dateCache.set(key, DateUtils.getCurrentDateString());
      setTimeout(() => this.dateCache.delete(key), 60000);
    }
    return this.dateCache.get(key)!;
  }

  static getActionableTasks(tasks: TaskWithStats[]): TaskWithStats[] {
    const actionable: TaskWithStats[] = [];
    const stack: TaskWithStats[] = [...tasks];

    while (stack.length > 0) {
      const task = stack.pop()!;

      if (task.subtasks && task.subtasks.length > 0) {
        for (let i = task.subtasks.length - 1; i >= 0; i--) {
          stack.push(task.subtasks[i]);
        }
      } else {
        actionable.push(task);
      }
    }

    return actionable;
  }

  static findTaskById(tasks: TaskWithStats[], taskId: string): TaskWithStats | null {
    const stack: TaskWithStats[] = [...tasks];

    while (stack.length > 0) {
      const task = stack.pop()!;

      if (task.id === taskId) return task;

      if (task.subtasks && task.subtasks.length > 0) {
        for (let i = task.subtasks.length - 1; i >= 0; i--) {
          stack.push(task.subtasks[i]);
        }
      }
    }

    return null;
  }

  static isTaskInTimeFilter(task: TaskWithStats, filter: TaskTimeFilter): boolean {
    if (filter === 'all') return true;
    if (filter === 'no-date') return !task.dueDate;

    const todayStr = this.getCachedCurrentDate();
    const taskDateStr = task.dueDate ? DateUtils.formatDate(new Date(task.dueDate)) : null;

    if (!taskDateStr) return false;

    switch (filter) {
      case 'today':
        return taskDateStr === todayStr;
      case 'week': {
        const weekEnd = DateUtils.addDays(todayStr, 7);
        return !DateUtils.isDateBefore(taskDateStr, todayStr) && DateUtils.isDateBefore(taskDateStr, weekEnd);
      }
      case 'overdue':
        return !task.done && DateUtils.isDateBefore(taskDateStr, todayStr);
      default:
        return true;
    }
  }

  static calculateTaskStats(tasks: TaskWithStats[]) {
    const actionableTasks = this.getActionableTasks(tasks);

    let activeTasks = 0;
    let completedTasks = 0;
    let todayTasks = 0;
    let weekTasks = 0;
    let overdueTasks = 0;
    let noDateTasks = 0;

    const todayStr = this.getCachedCurrentDate();

    for (const task of actionableTasks) {
      if (task.done) completedTasks++;
      else activeTasks++;

      if (!task.dueDate) {
        noDateTasks++;
        continue;
      }

      const taskDateStr = DateUtils.formatDate(new Date(task.dueDate));

      if (taskDateStr === todayStr) todayTasks++;

      const weekEnd = DateUtils.addDays(todayStr, 7);
      if (!DateUtils.isDateBefore(taskDateStr, todayStr) && DateUtils.isDateBefore(taskDateStr, weekEnd)) {
        weekTasks++;
      }

      if (!task.done && DateUtils.isDateBefore(taskDateStr, todayStr)) overdueTasks++;
    }

    const totalTasks = actionableTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      actionableTasks,
      totalTasks,
      activeTasks,
      completedTasks,
      completionRate,
      todayTasks,
      weekTasks,
      overdueTasks,
      noDateTasks
    };
  }

  static filterTasksHierarchical(
    tasks: TaskWithStats[],
    searchQuery: string,
    taskFilter: TaskFilter,
    timeFilter: TaskTimeFilter
  ): TaskWithStats[] {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const hasSearch = normalizedSearch.length > 0;

    const matchesFilters = (task: TaskWithStats): boolean => {
      if (taskFilter === 'active' && task.done) return false;
      if (taskFilter === 'completed' && !task.done) return false;

      if (hasSearch && !task.title.toLowerCase().includes(normalizedSearch)) return false;

      if (!this.isTaskInTimeFilter(task, timeFilter)) return false;

      return true;
    };

    const filterRecursive = (task: TaskWithStats): TaskWithStats | null => {
      const filteredSubtasks = task.subtasks?.map((s) => filterRecursive(s)).filter(Boolean) as TaskWithStats[];

      const selfMatches = matchesFilters(task);
      const hasMatchingSubtasks = filteredSubtasks.length > 0;

      if (!selfMatches && !hasMatchingSubtasks) {
        return null;
      }

      return {
        ...task,
        subtasks: filteredSubtasks
      };
    };

    return tasks.map((t) => filterRecursive(t)).filter(Boolean) as TaskWithStats[];
  }

  static sortTasks(tasks: TaskWithStats[]): TaskWithStats[] {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

    return [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;

      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      if (aPriority !== bPriority) return aPriority - bPriority;

      const aHasDate = !!a.dueDate;
      const bHasDate = !!b.dueDate;

      if (aHasDate && bHasDate) return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
      if (aHasDate) return -1;
      if (bHasDate) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  static getAllSubtasksFlat(tasks: TaskWithStats[], parentTaskId: string): TaskWithStats[] {
    const parent = this.findTaskById(tasks, parentTaskId);
    if (!parent) return [];

    const result: TaskWithStats[] = [];
    const stack: TaskWithStats[] = parent.subtasks ? [...parent.subtasks] : [];

    while (stack.length > 0) {
      const task = stack.pop()!;
      result.push(task);

      if (task.subtasks && task.subtasks.length > 0) {
        for (let i = task.subtasks.length - 1; i >= 0; i--) {
          stack.push(task.subtasks[i]);
        }
      }
    }

    return result;
  }

  static getSubtasks(tasks: TaskWithStats[], parentTaskId: string): TaskWithStats[] {
    const parent = this.findTaskById(tasks, parentTaskId);
    return parent?.subtasks || [];
  }

  static hasSubtasks(task: TaskWithStats): boolean {
    return !!(task.subtasks && task.subtasks.length > 0);
  }

  static clearCache(): void {
    this.dateCache.clear();
  }
}
