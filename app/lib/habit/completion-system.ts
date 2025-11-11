import { HABIT_CONFIG } from '../core/constants';
import { DateUtils } from '../core/date-utils';
import { ValidationUtils } from '../core/validation-utils';
import type {
  Habit,
  HabitCompletion,
  HabitFrequency,
  CompletionRecord,
  CompletionUpdateData,
  DateString,
  Timestamp
} from '@/lib/types';

export class HabitCompletionManager {
  static createCompletionId(habitId: string, date: DateString): string {
    return `${habitId}-${date}`;
  }

  static createBaseRecord(habitId: string, date: DateString): Omit<HabitCompletion, keyof CompletionRecord> {
    const now: Timestamp = new Date().toISOString();
    return {
      id: this.createCompletionId(habitId, date),
      habitId,
      date,
      createdAt: now,
      updatedAt: now
    };
  }

  static normalizeCompletionData(data: Partial<CompletionUpdateData>): CompletionRecord {
    return {
      completed: Boolean(data.completed),
      actualAmount: ValidationUtils.validateNumber(data.actualAmount ?? 0, 0, 0),
      targetAmount: ValidationUtils.validateNumber(data.targetAmount ?? 1, 1, 1),
      completedAt: data.completed ? data.completedAt || new Date().toISOString() : null,
      note: ValidationUtils.sanitizeString(data.note ?? ''),
      mood: data.mood || null,
      difficulty: data.difficulty || null,
      skipped: data.skipped || false
    };
  }

  // ---- Core CRUD-like operations ----
  static createRecord(habitId: string, date: DateString, data: Partial<CompletionRecord> = {}): HabitCompletion {
    const baseRecord = this.createBaseRecord(habitId, date);
    return {
      ...baseRecord,
      ...this.normalizeCompletionData(data)
    };
  }

  static updateRecord(existing: HabitCompletion, updates: Partial<CompletionUpdateData>): HabitCompletion {
    return {
      ...existing,
      ...this.normalizeCompletionData(updates),
      updatedAt: new Date().toISOString()
    };
  }

  static getRecord(completions: HabitCompletion[], habitId: string, date: DateString): HabitCompletion | null {
    return completions.find((c) => c.habitId === habitId && c.date === date) || null;
  }

  static isCompletedOnDate(completions: HabitCompletion[], habitId: string, date: DateString): boolean {
    const record = this.getRecord(completions, habitId, date);
    return record ? record.completed && !record.skipped : false;
  }

  static isSkippedOnDate(completions: HabitCompletion[], habitId: string, date: DateString): boolean {
    const record = this.getRecord(completions, habitId, date);
    return record ? record.skipped : false;
  }

  static getCurrentAmount(completions: HabitCompletion[], habitId: string, date: DateString): number {
    const record = this.getRecord(completions, habitId, date);
    return record ? record.actualAmount : 0;
  }

  static getHabitCompletions(completions: HabitCompletion[], habitId: string): HabitCompletion[] {
    return completions.filter((c) => c.habitId === habitId);
  }

  static getCompletionsInRange(
    completions: HabitCompletion[],
    habitId: string,
    startDate: DateString,
    endDate: DateString
  ): HabitCompletion[] {
    return this.getHabitCompletions(completions, habitId).filter((c) => c.date >= startDate && c.date <= endDate);
  }

  // ---- Streak Calculations ----
  static calculateCurrentStreak(completions: HabitCompletion[], habit: Habit): number {
    try {
      if (!habit.frequency?.type) return 0;

      let streak = 0;
      let currentDate = DateUtils.getCurrentDateString();
      let iterations = 0;
      const maxIterations = 365;

      if (habit.frequency.type === HABIT_CONFIG.FREQUENCIES.INTERVAL) {
        return this.calculateIntervalStreak(completions, habit);
      }

      while (iterations < maxIterations) {
        const shouldComplete = this.shouldCompleteOnDate(habit.frequency, currentDate, habit.startDate);

        if (shouldComplete) {
          const isCompleted = this.isCompletedOnDate(completions, habit.id, currentDate);
          const isSkipped = this.isSkippedOnDate(completions, habit.id, currentDate);

          if (isCompleted) {
            streak++;
          } else if (!isSkipped) {
            // Only break the streak if the day is NOT completed AND NOT skipped
            break;
          }
        }

        currentDate = DateUtils.addDays(currentDate, -1);
        iterations++;
      }

      return streak;
    } catch {
      return 0;
    }
  }

  static calculateIntervalStreak(completions: HabitCompletion[], habit: Habit): number {
    try {
      if (!habit.startDate || habit.frequency.type !== 'interval' || !habit.frequency.value?.interval) {
        return 0;
      }

      const interval = habit.frequency.value.interval;
      let streak = 0;
      let checkDate = new Date();

      // Find most recent scheduled date
      for (let i = 0; i <= interval; i++) {
        const testDateStr = DateUtils.formatDate(checkDate);
        const daysSinceStart = DateUtils.calculateDaysBetween(habit.startDate, testDateStr);

        if (daysSinceStart >= 0 && daysSinceStart % interval === 0) {
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // Count backward
      let iterations = 0;
      while (iterations < 100) {
        const dateStr = DateUtils.formatDate(checkDate);
        const daysSinceStart = DateUtils.calculateDaysBetween(habit.startDate, dateStr);

        if (daysSinceStart >= 0 && daysSinceStart % interval === 0) {
          const isCompleted = this.isCompletedOnDate(completions, habit.id, dateStr);
          if (isCompleted) {
            streak++;
            checkDate.setDate(checkDate.getDate() - interval);
          } else {
            break;
          }
        } else {
          break;
        }
        iterations++;
      }

      return streak;
    } catch {
      return 0;
    }
  }

  static calculateBestStreak(completions: HabitCompletion[], habit: Habit): number {
    try {
      const habitCompletions = this.getHabitCompletions(completions, habit.id)
        .filter((c) => c.completed && !c.skipped)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (habitCompletions.length === 0) return 0;

      let bestStreak = 0;
      let currentStreak = 0;
      let previousDate: Date | null = null;

      for (const completion of habitCompletions) {
        const currentDate = new Date(completion.date);

        if (previousDate) {
          const isConsecutive = this.isConsecutiveCompletion(habit.frequency, previousDate, currentDate);
          if (isConsecutive) {
            currentStreak++;
          } else {
            bestStreak = Math.max(bestStreak, currentStreak);
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }

        previousDate = currentDate;
      }

      return Math.max(bestStreak, currentStreak);
    } catch {
      return 0;
    }
  }

  // ---- Stats ----
  static calculateHabitStats(
    completions: HabitCompletion[],
    habit: Habit
  ): {
    streak: number;
    bestStreak: number;
    totalCompletions: number;
    lastCompleted: DateString | null;
  } {
    const habitCompletions = this.getHabitCompletions(completions, habit.id)
      .filter((c) => c.completed && !c.skipped)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalCompletions = habitCompletions.length;
    const lastCompleted = totalCompletions > 0 ? habitCompletions[0].date : null;
    const currentStreak = this.calculateCurrentStreak(completions, habit);
    const bestStreak = this.calculateBestStreak(completions, habit);

    return {
      streak: currentStreak,
      bestStreak: bestStreak,
      totalCompletions,
      lastCompleted
    };
  }

  // ---- Private helpers ----
  static isConsecutiveCompletion(frequency: HabitFrequency, prev: Date, current: Date): boolean {
    const daysDiff = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    switch (frequency.type) {
      case HABIT_CONFIG.FREQUENCIES.DAILY:
        return daysDiff === 1;
      case HABIT_CONFIG.FREQUENCIES.INTERVAL:
        return daysDiff === (frequency.value?.interval ?? 0);
      default:
        return daysDiff <= 7;
    }
  }

  static shouldCompleteOnDate(frequency: HabitFrequency, dateString: DateString, habitStartDate?: DateString): boolean {
    if (!frequency || (habitStartDate && !DateUtils.isDateAfterOrEqual(dateString, habitStartDate))) {
      return false;
    }

    const dayOfWeek = DateUtils.getDateWeekday(dateString);

    switch (frequency.type) {
      case HABIT_CONFIG.FREQUENCIES.DAILY:
        return Array.isArray(frequency.value) && frequency.value.includes(dayOfWeek);

      case HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES:
        if (!Array.isArray(frequency.value)) return false;
        const dayOfMonth = parseInt(dateString.split('-')[2]);
        return frequency.value.includes(dayOfMonth);

      case HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD:
        return true;

      case HABIT_CONFIG.FREQUENCIES.INTERVAL:
        if (!frequency.value?.interval || !habitStartDate) return false;
        const daysSinceStart = DateUtils.calculateDaysBetween(habitStartDate, dateString);
        return daysSinceStart >= 0 && daysSinceStart % frequency.value.interval === 0;

      default:
        return false;
    }
  }
}
