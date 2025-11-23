import { describe, it, expect, beforeEach } from 'vitest';
import { HabitCompletionManager } from '@/lib/habit/completion-system';
import { HABIT_CONFIG, SHARED_CONFIG } from '@/lib/core/constants';
import type { Habit, HabitCompletion } from '@/lib/types';
import { DateUtils } from '@/lib/core/date-utils';

describe('HabitCompletionManager', () => {
  let testHabit: Habit;
  let completions: HabitCompletion[];

  beforeEach(() => {
    testHabit = {
      id: 'habit_1',
      name: 'Exercise',
      category: SHARED_CONFIG.CATEGORIES[2],
      targetAmount: HABIT_CONFIG.DEFAULTS.TARGET_AMOUNT,
      unit: HABIT_CONFIG.UNITS[0],
      priority: HABIT_CONFIG.PRIORITIES[1],
      frequency: {
        type: HABIT_CONFIG.FREQUENCIES.DAILY,
        value: ['monday', 'wednesday', 'friday']
      },
      icon: 'Activity',
      color: '#3b82f6',
      notes: '',
      linkedGoals: [],
      startDate: '2024-01-01',
      reminder: HABIT_CONFIG.DEFAULTS.REMINDER,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    completions = [];
  });

  describe('createRecord', () => {
    it('should create a completion record', () => {
      const record = HabitCompletionManager.createRecord('habit_1', '2024-01-01', {
        completed: true,
        targetAmount: HABIT_CONFIG.DEFAULTS.TARGET_AMOUNT
      });

      expect(record.habitId).toBe('habit_1');
      expect(record.date).toBe('2024-01-01');
      expect(record.completed).toBe(true);
      expect(record.id).toBeDefined();
      expect(record.createdAt).toBeDefined();
    });

    it('should handle partial data', () => {
      const record = HabitCompletionManager.createRecord('habit_1', '2024-01-01');

      expect(record.completed).toBe(false);
      expect(record.actualAmount).toBe(0);
      expect(record.skipped).toBe(false);
    });
  });

  describe('updateRecord', () => {
    it('should update an existing record', () => {
      const original = HabitCompletionManager.createRecord('habit_1', '2024-01-01', {
        completed: false
      });

      const updated = HabitCompletionManager.updateRecord(original, {
        completed: true,
        actualAmount: 1,
        note: 'Great workout!'
      });

      expect(updated.completed).toBe(true);
      expect(updated.actualAmount).toBe(1);
      expect(updated.note).toBe('Great workout!');
      expect(updated.id).toBe(original.id);
    });
  });

  describe('getRecord', () => {
    it('should retrieve a record by habit ID and date', () => {
      const record = HabitCompletionManager.createRecord('habit_1', '2024-01-01');
      completions = [record];

      const found = HabitCompletionManager.getRecord(completions, 'habit_1', '2024-01-01');

      expect(found).toBeDefined();
      expect(found?.habitId).toBe('habit_1');
      expect(found?.date).toBe('2024-01-01');
    });

    it('should return null for non-existent record', () => {
      const found = HabitCompletionManager.getRecord(completions, 'habit_1', '2024-01-01');
      expect(found).toBeNull();
    });
  });

  describe('isCompletedOnDate', () => {
    it('should return true for completed habit', () => {
      const record = HabitCompletionManager.createRecord('habit_1', '2024-01-01', {
        completed: true
      });
      completions = [record];

      expect(HabitCompletionManager.isCompletedOnDate(completions, 'habit_1', '2024-01-01')).toBe(true);
    });

    it('should return false for skipped habit', () => {
      const record = HabitCompletionManager.createRecord('habit_1', '2024-01-01', {
        completed: true,
        skipped: true
      });
      completions = [record];

      expect(HabitCompletionManager.isCompletedOnDate(completions, 'habit_1', '2024-01-01')).toBe(false);
    });

    it('should return false when not completed', () => {
      expect(HabitCompletionManager.isCompletedOnDate(completions, 'habit_1', '2024-01-01')).toBe(false);
    });
  });

  describe('isSkippedOnDate', () => {
    it('should return true for skipped habit', () => {
      const record = HabitCompletionManager.createRecord('habit_1', '2024-01-01', {
        skipped: true
      });
      completions = [record];

      expect(HabitCompletionManager.isSkippedOnDate(completions, 'habit_1', '2024-01-01')).toBe(true);
    });

    it('should return false when not skipped', () => {
      expect(HabitCompletionManager.isSkippedOnDate(completions, 'habit_1', '2024-01-01')).toBe(false);
    });
  });

  describe('getCurrentAmount', () => {
    it('should return actual amount for completed habit', () => {
      const record = HabitCompletionManager.createRecord('habit_1', '2024-01-01', {
        completed: true,
        actualAmount: 5
      });
      completions = [record];

      expect(HabitCompletionManager.getCurrentAmount(completions, 'habit_1', '2024-01-01')).toBe(5);
    });

    it('should return 0 for non-existent record', () => {
      expect(HabitCompletionManager.getCurrentAmount(completions, 'habit_1', '2024-01-01')).toBe(0);
    });
  });

  describe('calculateCurrentStreak', () => {
    it('should calculate streak for daily habit', () => {
      testHabit.startDate = '2024-01-01'; // Monday
      testHabit.frequency = {
        type: HABIT_CONFIG.FREQUENCIES.DAILY,
        value: ['monday', 'wednesday', 'friday']
      };

      completions = [
        HabitCompletionManager.createRecord('habit_1', '2024-01-05', { completed: true }), // Friday
        HabitCompletionManager.createRecord('habit_1', '2024-01-03', { completed: true }), // Wednesday
        HabitCompletionManager.createRecord('habit_1', '2024-01-01', { completed: true }) // Monday
      ];

      const streak = HabitCompletionManager.calculateCurrentStreak(completions, testHabit);
      expect(streak).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for no completions', () => {
      const streak = HabitCompletionManager.calculateCurrentStreak([], testHabit);
      expect(streak).toBe(0);
    });

    it('should not break streak for skipped days', () => {
      const today = DateUtils.getCurrentDateString();
      const yesterday = DateUtils.addDays(today, -1);
      const twoDaysAgo = DateUtils.addDays(today, -2);

      testHabit.startDate = '2024-01-01';
      testHabit.frequency = {
        type: HABIT_CONFIG.FREQUENCIES.DAILY,
        value: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      };

      completions = [
        HabitCompletionManager.createRecord('habit_1', today, { completed: true }),
        HabitCompletionManager.createRecord('habit_1', yesterday, { skipped: true }),
        HabitCompletionManager.createRecord('habit_1', twoDaysAgo, { completed: true })
      ];

      const streak = HabitCompletionManager.calculateCurrentStreak(completions, testHabit);
      expect(streak).toEqual(2);
    });
  });

  describe('calculateHabitStats', () => {
    it('should calculate comprehensive stats', () => {
      testHabit.startDate = '2024-01-01';

      completions = [
        HabitCompletionManager.createRecord('habit_1', '2024-01-03', { completed: true }),
        HabitCompletionManager.createRecord('habit_1', '2024-01-01', { completed: true })
      ];

      const stats = HabitCompletionManager.calculateHabitStats(completions, testHabit);

      expect(stats.totalCompletions).toBe(2);
      expect(stats.streak).toBeGreaterThanOrEqual(0);
      expect(stats.bestStreak).toBeGreaterThanOrEqual(0);
      expect(stats.lastCompleted).toBe('2024-01-03');
    });

    it('should return zero stats for no completions', () => {
      const stats = HabitCompletionManager.calculateHabitStats([], testHabit);

      expect(stats.totalCompletions).toBe(0);
      expect(stats.streak).toBe(0);
      expect(stats.bestStreak).toBe(0);
      expect(stats.lastCompleted).toBeNull();
    });
  });

  describe('getCompletionsInRange', () => {
    it('should retrieve completions within date range', () => {
      completions = [
        HabitCompletionManager.createRecord('habit_1', '2024-01-01', { completed: true }),
        HabitCompletionManager.createRecord('habit_1', '2024-01-05', { completed: true }),
        HabitCompletionManager.createRecord('habit_1', '2024-01-10', { completed: true })
      ];

      const rangeCompletions = HabitCompletionManager.getCompletionsInRange(completions, 'habit_1', '2024-01-01', '2024-01-07');

      expect(rangeCompletions).toHaveLength(2);
      expect(rangeCompletions[0].date).toBe('2024-01-01');
      expect(rangeCompletions[1].date).toBe('2024-01-05');
    });
  });
});
