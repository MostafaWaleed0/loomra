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

      // Handle interval-based habits separately
      if (habit.frequency.type === HABIT_CONFIG.FREQUENCIES.INTERVAL) {
        return this.calculateIntervalStreak(completions, habit);
      }

      // Handle X times per period separately
      if (habit.frequency.type === HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD) {
        return this.calculateXTimesPerPeriodStreak(completions, habit);
      }

      let streak = 0;
      let currentDate = DateUtils.getCurrentDateString();
      let iterations = 0;
      const maxIterations = 365;

      while (iterations < maxIterations) {
        // Only check scheduled days
        const shouldComplete = this.shouldCompleteOnDate(habit.frequency, currentDate, habit.startDate);

        if (shouldComplete) {
          const isCompleted = this.isCompletedOnDate(completions, habit.id, currentDate);
          const isSkipped = this.isSkippedOnDate(completions, habit.id, currentDate);

          if (isCompleted) {
            streak++;
          } else if (isSkipped) {
            // Skipped: Don't increment streak, but don't break it either
            // Continue checking previous days
          } else {
            // Not completed and not skipped: Break the streak
            break;
          }
        }

        currentDate = DateUtils.addDays(currentDate, -1);
        iterations++;

        // Stop if we go before habit start date
        if (habit.startDate && DateUtils.isDateBefore(currentDate, habit.startDate)) {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
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

      // Find the most recent scheduled date (working backwards from today)
      let foundScheduledDate = false;
      for (let i = 0; i <= interval; i++) {
        const testDateStr = DateUtils.formatDate(checkDate);
        const daysSinceStart = DateUtils.calculateDaysBetween(habit.startDate, testDateStr);

        if (daysSinceStart >= 0 && daysSinceStart % interval === 0) {
          foundScheduledDate = true;
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }

      if (!foundScheduledDate) return 0;

      // Count backwards through scheduled dates
      let iterations = 0;
      const maxIterations = 100;

      while (iterations < maxIterations) {
        const dateStr = DateUtils.formatDate(checkDate);
        const daysSinceStart = DateUtils.calculateDaysBetween(habit.startDate, dateStr);

        // Stop if we've gone before the start date
        if (daysSinceStart < 0) break;

        // Check if this is a scheduled interval day
        if (daysSinceStart % interval === 0) {
          const isCompleted = this.isCompletedOnDate(completions, habit.id, dateStr);
          const isSkipped = this.isSkippedOnDate(completions, habit.id, dateStr);

          if (isCompleted) {
            streak++;
          } else if (isSkipped) {
            // Skipped: Don't increment, but continue checking previous intervals
          } else {
            // Not completed and not skipped: Break the streak
            break;
          }

          // Move to previous interval
          checkDate.setDate(checkDate.getDate() - interval);
        } else {
          break;
        }

        iterations++;
      }

      return streak;
    } catch (error) {
      console.error('Error calculating interval streak:', error);
      return 0;
    }
  }

  static calculateXTimesPerPeriodStreak(completions: HabitCompletion[], habit: Habit): number {
    try {
      if (habit.frequency.type !== HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD || !habit.frequency.value) {
        return 0;
      }

      const { repetitionsPerPeriod, period } = habit.frequency.value;
      let streak = 0;
      let currentDate = new Date();
      let iterations = 0;
      const maxIterations = 52; // Max ~1 year of weeks/months

      while (iterations < maxIterations) {
        const dateStr = DateUtils.formatDate(currentDate);

        // Stop if before habit start
        if (habit.startDate && DateUtils.isDateBefore(dateStr, habit.startDate)) {
          break;
        }

        // Get period boundaries
        let periodStart: DateString;
        let periodEnd: DateString;

        if (period === 'week') {
          periodStart = DateUtils.getWeekStart(currentDate, true);
          periodEnd = DateUtils.getWeekEnd(currentDate, true);
        } else if (period === 'month') {
          periodStart = DateUtils.getMonthStart(currentDate);
          periodEnd = DateUtils.getMonthEnd(currentDate);
        } else {
          break;
        }

        // Count completions in this period (excluding skipped)
        const periodDates = DateUtils.getDateRange(periodStart, periodEnd);
        const completedCount = periodDates.reduce((count, date) => {
          const isCompleted = this.isCompletedOnDate(completions, habit.id, date);
          return count + (isCompleted ? 1 : 0);
        }, 0);

        // Check if period quota was met
        if (completedCount >= repetitionsPerPeriod) {
          streak++;
        } else {
          // Quota not met: Break the streak
          break;
        }

        // Move to previous period
        if (period === 'week') {
          currentDate.setDate(currentDate.getDate() - 7);
        } else {
          currentDate.setMonth(currentDate.getMonth() - 1);
        }

        iterations++;
      }

      return streak;
    } catch (error) {
      console.error('Error calculating X times per period streak:', error);
      return 0;
    }
  }

  static calculateBestStreak(completions: HabitCompletion[], habit: Habit): number {
    try {
      if (!habit.frequency?.type) return 0;

      // For X times per period, calculate differently
      if (habit.frequency.type === HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD) {
        return this.calculateBestXTimesPerPeriodStreak(completions, habit);
      }

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
          const isConsecutive = this.isConsecutiveCompletion(habit.frequency, previousDate, currentDate, habit.startDate);
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
    } catch (error) {
      console.error('Error calculating best streak:', error);
      return 0;
    }
  }

  static calculateBestXTimesPerPeriodStreak(completions: HabitCompletion[], habit: Habit): number {
    try {
      if (habit.frequency.type !== HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD || !habit.frequency.value || !habit.startDate) {
        return 0;
      }

      const { repetitionsPerPeriod, period } = habit.frequency.value;
      const startDate = new Date(habit.startDate);
      const today = new Date();

      let bestStreak = 0;
      let currentStreakCount = 0;
      let currentDate = new Date(startDate);

      while (currentDate <= today) {
        let periodStart: DateString;
        let periodEnd: DateString;

        if (period === 'week') {
          periodStart = DateUtils.getWeekStart(currentDate, true);
          periodEnd = DateUtils.getWeekEnd(currentDate, true);
        } else {
          periodStart = DateUtils.getMonthStart(currentDate);
          periodEnd = DateUtils.getMonthEnd(currentDate);
        }

        const periodDates = DateUtils.getDateRange(periodStart, periodEnd);
        const completedCount = periodDates.reduce((count, date) => {
          const isCompleted = this.isCompletedOnDate(completions, habit.id, date);
          return count + (isCompleted ? 1 : 0);
        }, 0);

        if (completedCount >= repetitionsPerPeriod) {
          currentStreakCount++;
          bestStreak = Math.max(bestStreak, currentStreakCount);
        } else {
          currentStreakCount = 0;
        }

        // Move to next period
        if (period === 'week') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      return bestStreak;
    } catch (error) {
      console.error('Error calculating best X times per period streak:', error);
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
      bestStreak: Math.max(bestStreak, currentStreak),
      totalCompletions,
      lastCompleted
    };
  }

  // ---- Private helpers ----
  static isConsecutiveCompletion(frequency: HabitFrequency, prev: Date, current: Date, habitStartDate?: DateString): boolean {
    const daysDiff = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    switch (frequency.type) {
      case HABIT_CONFIG.FREQUENCIES.DAILY: {
        // For daily habits, check if they're on consecutive scheduled days
        if (!Array.isArray(frequency.value)) return false;

        // Simple case: consecutive calendar days
        if (daysDiff === 1) return true;

        // Complex case: check if they're consecutive scheduled days (accounting for gaps)
        let checkDate = new Date(prev);
        checkDate.setDate(checkDate.getDate() + 1);

        while (checkDate < current) {
          const dateStr = DateUtils.formatDate(checkDate);
          const dayOfWeek = DateUtils.getDateWeekday(dateStr);

          if (frequency.value.includes(dayOfWeek)) {
            // Found a scheduled day between prev and current that wasn't completed
            return false;
          }

          checkDate.setDate(checkDate.getDate() + 1);
        }

        return true;
      }

      case HABIT_CONFIG.FREQUENCIES.INTERVAL:
        return daysDiff === (frequency.value?.interval ?? 0);

      case HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES: {
        // Consecutive months with the same day number
        const prevMonth = prev.getMonth();
        const currentMonth = current.getMonth();
        const monthDiff = (current.getFullYear() - prev.getFullYear()) * 12 + (currentMonth - prevMonth);
        return monthDiff === 1 && prev.getDate() === current.getDate();
      }

      default:
        return daysDiff <= 7;
    }
  }

  static shouldCompleteOnDate(frequency: HabitFrequency, dateString: DateString, habitStartDate?: DateString): boolean {
    if (!frequency) return false;

    // Check if date is before habit start
    if (habitStartDate && DateUtils.isDateBefore(dateString, habitStartDate)) {
      return false;
    }

    switch (frequency.type) {
      case HABIT_CONFIG.FREQUENCIES.DAILY: {
        if (!Array.isArray(frequency.value)) return false;
        const dayOfWeek = DateUtils.getDateWeekday(dateString);
        return frequency.value.includes(dayOfWeek);
      }

      case HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES: {
        if (!Array.isArray(frequency.value)) return false;
        const dayOfMonth = parseInt(dateString.split('-')[2], 10);
        return frequency.value.includes(dayOfMonth);
      }

      case HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD:
        // For X times per period, any day in the period is valid
        return true;

      case HABIT_CONFIG.FREQUENCIES.INTERVAL: {
        if (!frequency.value?.interval || !habitStartDate) return false;
        const daysSinceStart = DateUtils.calculateDaysBetween(habitStartDate, dateString);
        return daysSinceStart >= 0 && daysSinceStart % frequency.value.interval === 0;
      }

      default:
        return false;
    }
  }
}
