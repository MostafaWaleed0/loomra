import { HABIT_CONFIG, SYSTEM_CONSTANTS } from '@/lib/core/constants';
import { HabitFactory } from '@/lib/habit/habit-factory';
import type { Habit, HabitFormData } from '@/lib/types';
import { describe, expect, it } from 'vitest';

describe('HabitFactory', () => {
  describe('validators', () => {
    describe('name', () => {
      it('should validate a valid name', () => {
        const result = HabitFactory.validators.name('Morning Exercise');
        expect(result.isValid).toBe(true);
        expect(result.value).toBe('Morning Exercise');
        expect(result.error).toBeUndefined();
      });

      it('should handle empty name', () => {
        const result = HabitFactory.validators.name('');
        expect(result.isValid).toBe(false);
        expect(result.value).toBe('');
        expect(result.error).toContain('at least');
      });

      it('should truncate long names', () => {
        const longName = 'a'.repeat(SYSTEM_CONSTANTS.VALIDATION.MAX_NAME_LENGTH + 50);
        const result = HabitFactory.validators.name(longName);
        expect(result.isValid).toBe(false);
        expect(result.value.length).toBeLessThanOrEqual(SYSTEM_CONSTANTS.VALIDATION.MAX_NAME_LENGTH);
        expect(result.error).toContain('truncated');
      });

      it('should sanitize whitespace', () => {
        const result = HabitFactory.validators.name('  Test  ');
        expect(result.value).toBe(' Test ');
        expect(result.isValid).toBe(true);
      });

      it('should enforce minimum length', () => {
        const shortName = 'a'.repeat(SYSTEM_CONSTANTS.VALIDATION.MIN_NAME_LENGTH - 1);
        const result = HabitFactory.validators.name(shortName);
        expect(result.isValid).toBe(false);
      });
    });

    describe('targetAmount', () => {
      it('should validate positive numbers', () => {
        const result = HabitFactory.validators.targetAmount(5);
        expect(result.isValid).toBe(true);
        expect(result.value).toBe(5);
      });

      it('should handle string numbers', () => {
        const result = HabitFactory.validators.targetAmount('10');
        expect(result.isValid).toBe(true);
        expect(result.value).toBe(10);
      });

      it('should use default for invalid values', () => {
        const result = HabitFactory.validators.targetAmount('invalid');
        expect(result.value).toBe(HABIT_CONFIG.DEFAULTS.TARGET_AMOUNT);
        expect(result.isValid).toBe(false);
      });

      it('should enforce minimum value', () => {
        const result = HabitFactory.validators.targetAmount(SYSTEM_CONSTANTS.VALIDATION.MIN_TARGET_AMOUNT - 5);
        expect(result.value).toBeGreaterThanOrEqual(SYSTEM_CONSTANTS.VALIDATION.MIN_TARGET_AMOUNT);
      });

      it('should enforce maximum value', () => {
        const result = HabitFactory.validators.targetAmount(SYSTEM_CONSTANTS.VALIDATION.MAX_TARGET_AMOUNT + 1000);
        expect(result.value).toBeLessThanOrEqual(SYSTEM_CONSTANTS.VALIDATION.MAX_TARGET_AMOUNT);
      });

      it('should accept values within valid range', () => {
        const validValue = Math.floor(
          (SYSTEM_CONSTANTS.VALIDATION.MIN_TARGET_AMOUNT + SYSTEM_CONSTANTS.VALIDATION.MAX_TARGET_AMOUNT) / 2
        );
        const result = HabitFactory.validators.targetAmount(validValue);
        expect(result.isValid).toBe(true);
        expect(result.value).toBe(validValue);
      });
    });

    describe('category', () => {
      it('should validate first category from config', () => {
        const firstCategory = HABIT_CONFIG.CATEGORIES[0];
        const result = HabitFactory.validators.category(firstCategory);
        expect(result.isValid).toBe(true);
        expect(result.value).toBe(firstCategory);
      });

      it('should use default for invalid category', () => {
        const result = HabitFactory.validators.category('invalid_category_xyz');
        expect(result.isValid).toBe(false);
        expect(result.value).toBe(HABIT_CONFIG.CATEGORIES[0]);
      });

      it('should validate all available categories', () => {
        HABIT_CONFIG.CATEGORIES.forEach((category) => {
          const result = HabitFactory.validators.category(category);
          expect(result.isValid).toBe(true);
          expect(result.value).toBe(category);
        });
      });

      it('should be case-sensitive for categories', () => {
        const category = HABIT_CONFIG.CATEGORIES[0];
        const wrongCase = category.toLowerCase();
        if (category !== wrongCase) {
          const result = HabitFactory.validators.category(wrongCase);
          expect(result.isValid).toBe(false);
        }
      });
    });

    describe('priority', () => {
      it('should validate all priority levels', () => {
        HABIT_CONFIG.PRIORITIES.forEach((priority) => {
          const result = HabitFactory.validators.priority(priority);
          expect(result.isValid).toBe(true);
          expect(result.value).toBe(priority);
        });
      });

      it('should use default priority for invalid value', () => {
        const result = HabitFactory.validators.priority('invalid');
        expect(result.isValid).toBe(false);
        expect(result.value).toBe(HABIT_CONFIG.PRIORITIES[1]); // medium
      });

      it('should have exactly 3 priority levels', () => {
        expect(HABIT_CONFIG.PRIORITIES).toHaveLength(3);
        expect(HABIT_CONFIG.PRIORITIES).toContain('low');
        expect(HABIT_CONFIG.PRIORITIES).toContain('medium');
        expect(HABIT_CONFIG.PRIORITIES).toContain('high');
      });
    });

    describe('unit', () => {
      it('should validate all available units', () => {
        HABIT_CONFIG.UNITS.forEach((unit) => {
          const result = HabitFactory.validators.unit(unit);
          expect(result.isValid).toBe(true);
          expect(result.value).toBe(unit);
        });
      });

      it('should use default unit for invalid value', () => {
        const result = HabitFactory.validators.unit('invalid_unit');
        expect(result.isValid).toBe(false);
        expect(result.value).toBe(HABIT_CONFIG.UNITS[0]);
      });

      it('should have times as first unit', () => {
        expect(HABIT_CONFIG.UNITS[0]).toBe('times');
      });
    });

    describe('frequency', () => {
      it('should validate daily frequency', () => {
        const freq = {
          type: HABIT_CONFIG.FREQUENCIES.DAILY,
          value: ['monday', 'wednesday', 'friday']
        };
        const result = HabitFactory.validators.frequency(freq);
        expect(result.isValid).toBe(true);
        expect(result.value.type).toBe(HABIT_CONFIG.FREQUENCIES.DAILY);
      });

      it('should validate interval frequency', () => {
        const freq = {
          type: HABIT_CONFIG.FREQUENCIES.INTERVAL,
          value: { interval: 3 }
        };
        const result = HabitFactory.validators.frequency(freq);
        expect(result.isValid).toBe(true);
        expect((result.value.value as { interval: number }).interval).toBe(3);
      });

      it('should validate X times per period frequency', () => {
        const freq = {
          type: HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD,
          value: { repetitionsPerPeriod: 3, period: 'week' }
        };
        const result = HabitFactory.validators.frequency(freq);
        expect(result.isValid).toBe(true);
        expect(result.value.type).toBe(HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD);
      });

      it('should validate specific dates frequency', () => {
        const freq = {
          type: HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES,
          value: [1, 15, 30]
        };
        const result = HabitFactory.validators.frequency(freq);
        expect(result.isValid).toBe(true);
        expect(result.value.type).toBe(HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES);
      });

      it('should create default frequency for null input', () => {
        const result = HabitFactory.validators.frequency(null);
        expect(result.value.type).toBe(HABIT_CONFIG.FREQUENCIES.DAILY);
        expect(Array.isArray(result.value.value)).toBe(true);
      });

      it('should validate all frequency types', () => {
        const frequencyTypes = Object.values(HABIT_CONFIG.FREQUENCIES);
        expect(frequencyTypes).toHaveLength(4);
        expect(frequencyTypes).toContain('daily');
        expect(frequencyTypes).toContain('interval');
        expect(frequencyTypes).toContain('x_times_per_period');
        expect(frequencyTypes).toContain('specific_dates');
      });
    });

    describe('reminder', () => {
      it('should validate reminder with default time', () => {
        const reminder = { enabled: true, time: HABIT_CONFIG.DEFAULTS.REMINDER.time };
        const result = HabitFactory.validators.reminder(reminder);
        expect(result.isValid).toBe(true);
        expect(result.value.time).toBe(HABIT_CONFIG.DEFAULTS.REMINDER.time);
      });

      it('should validate disabled reminder', () => {
        const reminder = { enabled: false, time: '09:00' };
        const result = HabitFactory.validators.reminder(reminder);
        expect(result.isValid).toBe(true);
        expect(result.value.enabled).toBe(false);
      });

      it('should use default for invalid time format', () => {
        const reminder = { enabled: true, time: 'invalid' };
        const result = HabitFactory.validators.reminder(reminder);
        expect(result.value.time).toBe(HABIT_CONFIG.DEFAULTS.REMINDER.time);
      });

      it('should validate time format HH:MM', () => {
        const validTimes = ['00:00', '09:30', '12:00', '23:59'];
        validTimes.forEach((time) => {
          const reminder = { enabled: true, time };
          const result = HabitFactory.validators.reminder(reminder);
          expect(result.isValid).toBe(true);
          expect(result.value.time).toBe(time);
        });
      });
    });

    describe('notes', () => {
      it('should validate notes within limit', () => {
        const notes = 'a'.repeat(SYSTEM_CONSTANTS.VALIDATION.MAX_NOTE_LENGTH - 10);
        const result = HabitFactory.validators.notes(notes);
        expect(result.isValid).toBe(true);
        expect(result.value.length).toBeLessThanOrEqual(SYSTEM_CONSTANTS.VALIDATION.MAX_NOTE_LENGTH);
      });

      it('should truncate notes exceeding limit', () => {
        const longNotes = 'a'.repeat(SYSTEM_CONSTANTS.VALIDATION.MAX_NOTE_LENGTH + 100);
        const result = HabitFactory.validators.notes(longNotes);
        expect(result.value.length).toBe(SYSTEM_CONSTANTS.VALIDATION.MAX_NOTE_LENGTH);
      });

      it('should handle empty notes', () => {
        const result = HabitFactory.validators.notes('');
        expect(result.isValid).toBe(true);
        expect(result.value).toBe('');
      });
    });
  });

  describe('create', () => {
    it('should create a new habit with valid data', () => {
      const data: Partial<HabitFormData> = {
        name: 'Test Habit',
        category: HABIT_CONFIG.CATEGORIES[2], // Use dynamic category
        targetAmount: HABIT_CONFIG.DEFAULTS.TARGET_AMOUNT,
        unit: HABIT_CONFIG.UNITS[0],
        priority: HABIT_CONFIG.PRIORITIES[1],
        frequency: {
          type: HABIT_CONFIG.FREQUENCIES.DAILY,
          value: ['monday', 'wednesday', 'friday']
        }
      };

      const habit = HabitFactory.create(data);

      expect(habit).not.toBeNull();
      expect(habit?.name).toBe('Test Habit');
      expect(habit?.category).toBe(HABIT_CONFIG.CATEGORIES[2]);
      expect(habit?.targetAmount).toBe(HABIT_CONFIG.DEFAULTS.TARGET_AMOUNT);
      expect(habit?.id).toBeDefined();
      expect(habit?.createdAt).toBeDefined();
      expect(habit?.updatedAt).toBeDefined();
    });

    it('should create habit with default values for missing fields', () => {
      const data: Partial<HabitFormData> = {
        name: 'Minimal Habit'
      };

      const habit = HabitFactory.create(data);

      expect(habit).not.toBeNull();
      expect(habit?.name).toBe('Minimal Habit');
      expect(habit?.targetAmount).toBe(HABIT_CONFIG.DEFAULTS.TARGET_AMOUNT);
      expect(habit?.category).toBe(HABIT_CONFIG.CATEGORIES[0]);
      expect(habit?.unit).toBe(HABIT_CONFIG.UNITS[0]);
    });

    it('should preserve existing habit ID when updating', () => {
      const existing: Habit = {
        id: 'habit_123',
        name: 'Old Name',
        category: HABIT_CONFIG.CATEGORIES[0],
        targetAmount: HABIT_CONFIG.DEFAULTS.TARGET_AMOUNT,
        unit: HABIT_CONFIG.UNITS[0],
        priority: HABIT_CONFIG.PRIORITIES[1],
        frequency: { type: HABIT_CONFIG.FREQUENCIES.DAILY, value: ['monday'] },
        icon: 'Activity',
        color: '#3b82f6',
        notes: '',
        linkedGoals: [],
        startDate: '2024-01-01',
        reminder: HABIT_CONFIG.DEFAULTS.REMINDER,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const updates = { name: 'New Name' };
      const updated = HabitFactory.create(updates, existing);

      expect(updated?.id).toBe('habit_123');
      expect(updated?.name).toBe('New Name');
      expect(updated?.createdAt).toBe(existing.createdAt);
    });
  });

  describe('update', () => {
    it('should update existing habit', () => {
      const existing: Habit = {
        id: 'habit_123',
        name: 'Old Name',
        category: HABIT_CONFIG.CATEGORIES[0],
        targetAmount: HABIT_CONFIG.DEFAULTS.TARGET_AMOUNT,
        unit: HABIT_CONFIG.UNITS[0],
        priority: HABIT_CONFIG.PRIORITIES[1],
        frequency: { type: HABIT_CONFIG.FREQUENCIES.DAILY, value: ['monday'] },
        icon: 'Activity',
        color: '#3b82f6',
        notes: '',
        linkedGoals: [],
        startDate: '2024-01-01',
        reminder: HABIT_CONFIG.DEFAULTS.REMINDER,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const updates = {
        name: 'Updated Name',
        priority: HABIT_CONFIG.PRIORITIES[2]
      };

      const updated = HabitFactory.update(existing, updates);

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.priority).toBe(HABIT_CONFIG.PRIORITIES[2]);
      expect(updated?.id).toBe(existing.id);
    });
  });

  describe('validateForm', () => {
    it('should validate complete form data', () => {
      const data: Partial<HabitFormData> = {
        name: 'Test Habit',
        category: HABIT_CONFIG.CATEGORIES[0],
        targetAmount: 5,
        unit: HABIT_CONFIG.UNITS[1], // 'minutes'
        priority: HABIT_CONFIG.PRIORITIES[2], // 'high'
        icon: 'Activity',
        color: '#3b82f6',
        reminder: { enabled: true, time: '08:00' },
        linkedGoals: [],
        frequency: {
          type: HABIT_CONFIG.FREQUENCIES.DAILY,
          value: ['monday', 'wednesday', 'friday']
        }
      };

      const result = HabitFactory.validateForm(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validated.name).toBe('Test Habit');
      expect(result.validated.category).toBe(HABIT_CONFIG.CATEGORIES[0]);
    });

    it('should return errors for invalid data', () => {
      const data = {
        name: '', // Too short
        category: 'invalid_category',
        targetAmount: SYSTEM_CONSTANTS.VALIDATION.MAX_TARGET_AMOUNT + 1000 // Too high
      };

      const result = HabitFactory.validateForm(data as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate with minimum required fields', () => {
      const data: Partial<HabitFormData> = {
        name: 'a'.repeat(SYSTEM_CONSTANTS.VALIDATION.MIN_NAME_LENGTH)
      };

      const result = HabitFactory.validateForm(data);

      // Should have default values filled in
      expect(result.validated.category).toBe(HABIT_CONFIG.CATEGORIES[0]);
      expect(result.validated.priority).toBe(HABIT_CONFIG.PRIORITIES[1]);
      expect(result.validated.targetAmount).toBe(HABIT_CONFIG.DEFAULTS.TARGET_AMOUNT);
    });
  });
});
