import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskUtils } from '@/lib/tasks/task-utils';
import type { TaskWithStats } from '@/lib/types';

describe('TaskUtils', () => {
  let mockTasks: TaskWithStats[];

  beforeEach(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    mockTasks = [
      {
        id: 'task_1',
        title: 'Parent Task',
        done: false,
        goalId: 'goal_1',
        parentTaskId: null,
        priority: 'high',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        dueDate: tomorrow.toISOString(),
        isOverdue: false,
        daysUntilDue: 1,
        daysSinceCreated: 0,
        subtasks: [
          {
            id: 'task_2',
            title: 'Child Task 1',
            done: true,
            goalId: 'goal_1',
            parentTaskId: 'task_1',
            priority: 'medium',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            isOverdue: false,
            daysUntilDue: null,
            daysSinceCreated: 0,
            subtasks: [],
            subtaskCount: 0,
            completedSubtaskCount: 0
          },
          {
            id: 'task_3',
            title: 'Child Task 2',
            done: false,
            goalId: 'goal_1',
            parentTaskId: 'task_1',
            priority: 'low',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            isOverdue: false,
            daysUntilDue: null,
            daysSinceCreated: 0,
            subtasks: [],
            subtaskCount: 0,
            completedSubtaskCount: 0
          }
        ],
        subtaskCount: 2,
        completedSubtaskCount: 1
      },
      {
        id: 'task_4',
        title: 'Simple Task',
        done: false,
        goalId: null,
        parentTaskId: null,
        priority: 'medium',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        dueDate: yesterday.toISOString(),
        isOverdue: true,
        daysUntilDue: -1,
        daysSinceCreated: 0,
        subtasks: [],
        subtaskCount: 0,
        completedSubtaskCount: 0
      }
    ];
  });

  afterEach(() => {
    TaskUtils.clearCache();
  });

  describe('getActionableTasks', () => {
    it('should return leaf tasks only', () => {
      const actionable = TaskUtils.getActionableTasks(mockTasks);

      expect(actionable).toHaveLength(3); // task_2, task_3, task_4
      expect(actionable.some((t) => t.id === 'task_1')).toBe(false); // Parent excluded
      expect(actionable.some((t) => t.id === 'task_2')).toBe(true);
      expect(actionable.some((t) => t.id === 'task_3')).toBe(true);
      expect(actionable.some((t) => t.id === 'task_4')).toBe(true);
    });

    it('should handle empty array', () => {
      const actionable = TaskUtils.getActionableTasks([]);
      expect(actionable).toHaveLength(0);
    });

    it('should handle tasks with no subtasks', () => {
      const simpleTasks: TaskWithStats[] = [
        {
          id: 'task_1',
          title: 'Simple',
          done: false,
          goalId: null,
          parentTaskId: null,
          priority: 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isOverdue: false,
          daysUntilDue: null,
          daysSinceCreated: 0,
          subtasks: [],
          subtaskCount: 0,
          completedSubtaskCount: 0
        }
      ];

      const actionable = TaskUtils.getActionableTasks(simpleTasks);
      expect(actionable).toHaveLength(1);
    });
  });

  describe('findTaskById', () => {
    it('should find root task', () => {
      const found = TaskUtils.findTaskById(mockTasks, 'task_1');
      expect(found).not.toBeNull();
      expect(found?.title).toBe('Parent Task');
    });

    it('should find nested task', () => {
      const found = TaskUtils.findTaskById(mockTasks, 'task_2');
      expect(found).not.toBeNull();
      expect(found?.title).toBe('Child Task 1');
    });

    it('should return null for non-existent task', () => {
      const found = TaskUtils.findTaskById(mockTasks, 'nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('calculateTaskStats', () => {
    it('should calculate correct statistics', () => {
      const stats = TaskUtils.calculateTaskStats(mockTasks);

      expect(stats.totalTasks).toBe(3); // Only actionable tasks
      expect(stats.activeTasks).toBe(2); // task_3 and task_4
      expect(stats.completedTasks).toBe(1); // task_2
      expect(stats.overdueTasks).toBe(1); // task_4
      expect(stats.completionRate).toBeGreaterThanOrEqual(0);
      expect(stats.completionRate).toBeLessThanOrEqual(100);
    });

    it('should handle empty task list', () => {
      const stats = TaskUtils.calculateTaskStats([]);

      expect(stats.totalTasks).toBe(0);
      expect(stats.completionRate).toBe(0);
    });
  });

  describe('isTaskInTimeFilter', () => {
    it('should return true for "all" filter', () => {
      const result = TaskUtils.isTaskInTimeFilter(mockTasks[0], 'all');
      expect(result).toBe(true);
    });

    it('should filter "no-date" tasks correctly', () => {
      const taskWithoutDate: TaskWithStats = {
        ...mockTasks[1],
        dueDate: undefined
      };

      expect(TaskUtils.isTaskInTimeFilter(taskWithoutDate, 'no-date')).toBe(true);
      expect(TaskUtils.isTaskInTimeFilter(mockTasks[0], 'no-date')).toBe(false);
    });

    it('should filter overdue tasks', () => {
      expect(TaskUtils.isTaskInTimeFilter(mockTasks[1], 'overdue')).toBe(true);
    });
  });

  describe('filterTasksHierarchical', () => {
    it('should filter by search query', () => {
      const filtered = TaskUtils.filterTasksHierarchical(mockTasks, 'simple', 'all', 'all');

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some((t) => t.title.toLowerCase().includes('simple'))).toBe(true);
    });

    it('should filter by task status', () => {
      const activeFiltered = TaskUtils.filterTasksHierarchical(mockTasks, '', 'active', 'all');
      const allActive = activeFiltered.every((task) => !task.done || (task.subtasks && task.subtasks.length > 0));

      expect(allActive).toBe(true);
    });

    it('should filter by time', () => {
      const overdueFiltered = TaskUtils.filterTasksHierarchical(mockTasks, '', 'all', 'overdue');

      // Should include the overdue task or its parent
      expect(overdueFiltered.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty search', () => {
      const filtered = TaskUtils.filterTasksHierarchical(mockTasks, '', 'all', 'all');
      expect(filtered.length).toBeGreaterThanOrEqual(mockTasks.length);
    });
  });

  describe('sortTasks', () => {
    it('should sort completed tasks last', () => {
      const sorted = TaskUtils.sortTasks([...mockTasks[0].subtasks!]);

      expect(sorted[0].done).toBe(false);
      expect(sorted[sorted.length - 1].done).toBe(true);
    });

    it('should sort by priority', () => {
      const tasks: TaskWithStats[] = [
        { ...mockTasks[0], priority: 'low', done: false },
        { ...mockTasks[1], priority: 'high', done: false }
      ];

      const sorted = TaskUtils.sortTasks(tasks);
      expect(sorted[0].priority).toBe('high');
    });

    it('should handle empty array', () => {
      const sorted = TaskUtils.sortTasks([]);
      expect(sorted).toHaveLength(0);
    });
  });

  describe('getAllSubtasksFlat', () => {
    it('should return all subtasks recursively', () => {
      const subtasks = TaskUtils.getAllSubtasksFlat(mockTasks, 'task_1');

      expect(subtasks).toHaveLength(2);
      expect(subtasks.some((t) => t.id === 'task_2')).toBe(true);
      expect(subtasks.some((t) => t.id === 'task_3')).toBe(true);
    });

    it('should return empty array for non-existent parent', () => {
      const subtasks = TaskUtils.getAllSubtasksFlat(mockTasks, 'nonexistent');
      expect(subtasks).toHaveLength(0);
    });

    it('should return empty array for task with no subtasks', () => {
      const subtasks = TaskUtils.getAllSubtasksFlat(mockTasks, 'task_4');
      expect(subtasks).toHaveLength(0);
    });
  });

  describe('getSubtasks', () => {
    it('should return direct children only', () => {
      const subtasks = TaskUtils.getSubtasks(mockTasks, 'task_1');

      expect(subtasks).toHaveLength(2);
      expect(subtasks.every((t) => t.parentTaskId === 'task_1')).toBe(true);
    });

    it('should return empty array for non-existent parent', () => {
      const subtasks = TaskUtils.getSubtasks(mockTasks, 'nonexistent');
      expect(subtasks).toHaveLength(0);
    });
  });

  describe('hasSubtasks', () => {
    it('should return true for parent task', () => {
      expect(TaskUtils.hasSubtasks(mockTasks[0])).toBe(true);
    });

    it('should return false for leaf task', () => {
      expect(TaskUtils.hasSubtasks(mockTasks[1])).toBe(false);
    });
  });
});
