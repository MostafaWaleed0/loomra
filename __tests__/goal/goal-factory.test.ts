import { GOAL_CONFIG, SHARED_CONFIG, SYSTEM_CONSTANTS } from '@/lib/core/constants';
import { GoalFactory } from '@/lib/goal/goal-factory';
import type { Goal, GoalFormData } from '@/lib/types';
import { describe, expect, it } from 'vitest';

describe('GoalFactory', () => {
  describe('validators', () => {
    describe('title', () => {
      it('should validate a valid title', () => {
        const result = GoalFactory.validators.title(' Learn TypeScript ');
        expect(result.isValid).toBe(true);
        expect(result.value).toBe(' Learn TypeScript ');
      });

      it('should reject empty title', () => {
        const result = GoalFactory.validators.title('');
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should truncate long titles', () => {
        const longTitle = 'a'.repeat(300);
        const result = GoalFactory.validators.title(longTitle);
        expect(result.value.length).toBeLessThanOrEqual(SYSTEM_CONSTANTS.VALIDATION.MAX_NAME_LENGTH);
      });
    });

    describe('deadline', () => {
      it('should validate valid date', () => {
        const result = GoalFactory.validators.deadline('2025-12-31');
        expect(result.isValid).toBe(true);
        expect(result.value).toBe('2025-12-31');
      });

      it('should allow undefined deadline', () => {
        const result = GoalFactory.validators.deadline(undefined);
        expect(result.isValid).toBe(true);
        expect(result.value).toBeUndefined();
      });

      it('should handle invalid date', () => {
        const result = GoalFactory.validators.deadline('invalid-date');
        expect(result.isValid).toBe(false);
        expect(result.value).toBeUndefined();
      });
    });

    describe('status', () => {
      it('should validate valid status', () => {
        const result = GoalFactory.validators.status(GOAL_CONFIG.STATUS.ACTIVE);
        expect(result.isValid).toBe(true);
        expect(result.value).toBe(GOAL_CONFIG.STATUS.ACTIVE);
      });

      it('should use default for invalid status', () => {
        const result = GoalFactory.validators.status('invalid');
        expect(result.isValid).toBe(false);
        expect(result.value).toBe(GOAL_CONFIG.DEFAULTS.STATUS);
      });
    });
  });

  describe('create', () => {
    it('should create a new goal with valid data', () => {
      const data: Partial<GoalFormData> = {
        title: 'Test Goal',
        description: 'Test description',
        category: SHARED_CONFIG.CATEGORIES[0], // 'Mindfulness'
        priority: GOAL_CONFIG.PRIORITIES[2], // 'high'
        deadline: '2025-12-31'
      };

      const goal = GoalFactory.create(data);

      expect(goal).not.toBeNull();
      expect(goal?.title).toBe('Test Goal');
      expect(goal?.description).toBe('Test description');
      expect(goal?.id).toBeDefined();
      expect(goal?.createdAt).toBeDefined();
    });

    it('should throw error for invalid input', () => {
      const goal = GoalFactory.create({ title: '' });
      expect(goal).toBeNull();
    });

    it('should preserve existing ID on update', () => {
      const existing: Goal = {
        id: 'goal_123',
        title: 'Old Title',
        description: '',
        category: SHARED_CONFIG.CATEGORIES[0], // 'Mindfulness'
        priority: GOAL_CONFIG.PRIORITIES[1], // 'medium'
        status: GOAL_CONFIG.STATUS.ACTIVE,
        icon: GOAL_CONFIG.DEFAULTS.ICON,
        color: GOAL_CONFIG.DEFAULTS.COLOR,
        notes: '',
        deadline: '',
        linkedHabits: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const updated = GoalFactory.create({ title: 'New Title' }, existing);

      expect(updated?.id).toBe('goal_123');
      expect(updated?.title).toBe('New Title');
    });
  });

  describe('update', () => {
    it('should update existing goal', () => {
      const existing: Goal = {
        id: 'goal_123',
        title: 'Original',
        description: '',
        category: SHARED_CONFIG.CATEGORIES[0], // 'Mindfulness'
        priority: GOAL_CONFIG.PRIORITIES[1], // 'medium'
        status: GOAL_CONFIG.STATUS.ACTIVE,
        icon: GOAL_CONFIG.DEFAULTS.ICON,
        color: GOAL_CONFIG.DEFAULTS.COLOR,
        notes: '',
        deadline: '',
        linkedHabits: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const updated = GoalFactory.update(existing, {
        title: 'Updated',
        priority: GOAL_CONFIG.PRIORITIES[2] // 'high'
      });

      expect(updated?.title).toBe('Updated');
      expect(updated?.priority).toBe(GOAL_CONFIG.PRIORITIES[2]);
      expect(updated?.id).toBe(existing.id);
    });

    it('should return null when existing goal is null', () => {
      const updated = GoalFactory.update(null, { title: 'New' });
      expect(updated).toBeNull();
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      expect(GoalFactory.calculateProgress(5, 10)).toBe(50);
      expect(GoalFactory.calculateProgress(10, 10)).toBe(100);
      expect(GoalFactory.calculateProgress(0, 10)).toBe(0);
    });

    it('should return 0 for zero total tasks', () => {
      expect(GoalFactory.calculateProgress(0, 0)).toBe(0);
    });
  });

  describe('isOverdue', () => {
    it('should return false for no deadline', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test',
        description: '',
        category: SHARED_CONFIG.CATEGORIES[0], // 'Mindfulness'
        priority: GOAL_CONFIG.PRIORITIES[1], // 'medium'
        status: GOAL_CONFIG.STATUS.ACTIVE,
        icon: GOAL_CONFIG.DEFAULTS.ICON,
        color: GOAL_CONFIG.DEFAULTS.COLOR,
        notes: '',
        deadline: '',
        linkedHabits: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      expect(GoalFactory.isOverdue(goal)).toBe(false);
    });

    it('should return true for past deadline', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test',
        description: '',
        category: SHARED_CONFIG.CATEGORIES[0], // 'Mindfulness'
        priority: GOAL_CONFIG.PRIORITIES[1], // 'medium'
        status: GOAL_CONFIG.STATUS.ACTIVE,
        icon: GOAL_CONFIG.DEFAULTS.ICON,
        color: GOAL_CONFIG.DEFAULTS.COLOR,
        notes: '',
        linkedHabits: [],
        deadline: '2020-01-01',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      expect(GoalFactory.isOverdue(goal)).toBe(true);
    });

    it('should return false for completed goal with past deadline', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test',
        description: '',
        category: SHARED_CONFIG.CATEGORIES[0], // 'Mindfulness'
        priority: GOAL_CONFIG.PRIORITIES[1], // 'medium'
        status: GOAL_CONFIG.STATUS.COMPLETED,
        icon: GOAL_CONFIG.DEFAULTS.ICON,
        color: GOAL_CONFIG.DEFAULTS.COLOR,
        notes: '',
        linkedHabits: [],
        deadline: '2020-01-01',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      expect(GoalFactory.isOverdue(goal)).toBe(false);
    });
  });

  describe('getDaysUntilDeadline', () => {
    it('should return null for no deadline', () => {
      const goal: Goal = {
        id: 'goal_1',
        title: 'Test',
        description: '',
        category: SHARED_CONFIG.CATEGORIES[0], // 'Mindfulness'
        priority: GOAL_CONFIG.PRIORITIES[1], // 'medium'
        status: GOAL_CONFIG.STATUS.ACTIVE,
        icon: GOAL_CONFIG.DEFAULTS.ICON,
        color: GOAL_CONFIG.DEFAULTS.COLOR,
        notes: '',
        deadline: '',
        linkedHabits: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      expect(GoalFactory.getDaysUntilDeadline(goal)).toBeNull();
    });

    it('should calculate days correctly', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const goal: Goal = {
        id: 'goal_1',
        title: 'Test',
        description: '',
        category: SHARED_CONFIG.CATEGORIES[0], // 'Mindfulness'
        priority: GOAL_CONFIG.PRIORITIES[1], // 'medium'
        status: GOAL_CONFIG.STATUS.ACTIVE,
        icon: GOAL_CONFIG.DEFAULTS.ICON,
        color: GOAL_CONFIG.DEFAULTS.COLOR,
        notes: '',
        linkedHabits: [],
        deadline: tomorrowStr,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const days = GoalFactory.getDaysUntilDeadline(goal);
      expect(days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sortGoals', () => {
    const goals: Goal[] = [
      {
        id: '1',
        title: 'B Goal',
        description: '',
        category: SHARED_CONFIG.CATEGORIES[0], // 'Mindfulness'
        priority: GOAL_CONFIG.PRIORITIES[2], // 'high'
        status: GOAL_CONFIG.STATUS.ACTIVE,
        icon: GOAL_CONFIG.DEFAULTS.ICON,
        color: GOAL_CONFIG.DEFAULTS.COLOR,
        notes: '',
        deadline: '',
        linkedHabits: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        title: 'A Goal',
        description: '',
        category: SHARED_CONFIG.CATEGORIES[0], // 'Mindfulness'
        priority: GOAL_CONFIG.PRIORITIES[0], // 'low'
        status: GOAL_CONFIG.STATUS.ACTIVE,
        icon: GOAL_CONFIG.DEFAULTS.ICON,
        color: GOAL_CONFIG.DEFAULTS.COLOR,
        notes: '',
        deadline: '',
        linkedHabits: [],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }
    ];

    it('should sort by title', () => {
      const sorted = GoalFactory.sortGoals(goals, 'title');
      expect(sorted[0].title).toBe('A Goal');
      expect(sorted[1].title).toBe('B Goal');
    });

    it('should sort by priority', () => {
      const sorted = GoalFactory.sortGoals(goals, 'priority');
      expect(sorted[0].priority).toBe(GOAL_CONFIG.PRIORITIES[2]); // 'high'
      expect(sorted[1].priority).toBe(GOAL_CONFIG.PRIORITIES[0]); // 'low'
    });

    it('should sort ascending when specified', () => {
      const sorted = GoalFactory.sortGoals(goals, 'title', true);
      expect(sorted[0].title).toBe('B Goal');
      expect(sorted[1].title).toBe('A Goal');
    });
  });
});
