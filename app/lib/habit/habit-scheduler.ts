import type {
  DateString,
  GroupedHabits,
  Habit,
  HabitCompletion,
  HabitStatusForDate,
  HabitWithStatus,
  UpcomingHabit
} from '@/lib/types';
import { HABIT_CONFIG } from '../core/constants';
import { DateUtils } from '../core/date-utils';
import { HabitCompletionManager } from './completion-system';
import { HabitFrequencyManager } from './frequency-system';

export class HabitScheduler {
  static shouldCompleteOnDate(habit: Habit, completions: HabitCompletion[], date: DateString): boolean {
    // Check if habit is scheduled based on frequency rules
    const isScheduled = HabitFrequencyManager.shouldCompleteOnDate(habit.frequency, date, habit.startDate);

    // If not scheduled by frequency rules, don't show
    if (!isScheduled) {
      return false;
    }

    // If already completed or skipped on this date, show it
    const record = HabitCompletionManager.getRecord(completions, habit.id, date);
    if (record && (record.completed || record.skipped)) {
      return true;
    }

    // For X times per period, check if already completed enough times
    if (habit.frequency.type === HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD) {
      const { quotaMet } = this.getXTimesPerPeriodQuota(habit, completions, date);
      if (quotaMet) {
        return false;
      }
    }

    return true;
  }

  static getHabitsForDate(habits: Habit[], completions: HabitCompletion[], date: DateString): Habit[] {
    return habits.filter((habit) => this.shouldCompleteOnDate(habit, completions, date));
  }

  static getHabitStatusForDate(habit: Habit, completions: HabitCompletion[], date: DateString): HabitStatusForDate {
    const record = HabitCompletionManager.getRecord(completions, habit.id, date);
    const isScheduled = this.shouldCompleteOnDate(habit, completions, date);
    const isCompleted = (record?.completed && !record.skipped) || false;
    const isSkipped = record?.skipped || false;
    const actualAmount = record?.actualAmount || 0;
    const canComplete = isScheduled && !DateUtils.isFutureDate(date);

    return {
      isScheduled,
      isCompleted,
      isSkipped,
      actualAmount,
      canComplete
    };
  }

  /**
   * Get quota information for X times per period habits
   */
  static getXTimesPerPeriodQuota(habit: Habit, completions: HabitCompletion[], date: DateString): { quotaMet: boolean } {
    if (habit.frequency.type !== HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD || !habit.frequency.value) {
      return { quotaMet: false };
    }

    const { repetitionsPerPeriod, period } = habit.frequency.value;
    let periodStart: DateString;
    let periodEnd: DateString;

    if (period === 'week') {
      periodStart = DateUtils.getWeekStart(DateUtils.createDateFromString(date), true);
      periodEnd = DateUtils.getWeekEnd(DateUtils.createDateFromString(date), true);
    } else if (period === 'month') {
      periodStart = DateUtils.getMonthStart(DateUtils.createDateFromString(date));
      periodEnd = DateUtils.getMonthEnd(DateUtils.createDateFromString(date));
    } else {
      return { quotaMet: false };
    }

    const periodDates = DateUtils.getDateRange(periodStart, periodEnd);
    const completedCount = periodDates.reduce((count, d) => {
      const isCompleted = HabitCompletionManager.isCompletedOnDate(completions, habit.id, d);
      return count + (isCompleted ? 1 : 0);
    }, 0);

    return {
      quotaMet: completedCount >= repetitionsPerPeriod
    };
  }

  static getHabitsWithStatus(habits: Habit[], completions: HabitCompletion[], date: DateString): HabitWithStatus[] {
    return habits.map((habit) => ({
      ...habit,
      ...this.getHabitStatusForDate(habit, completions, date)
    }));
  }

  static getHabitsGroupedByStatus(habits: Habit[], completions: HabitCompletion[], date: DateString): GroupedHabits {
    const scheduled: HabitWithStatus[] = [];
    const completed: HabitWithStatus[] = [];
    const skipped: HabitWithStatus[] = [];
    const notScheduled: HabitWithStatus[] = [];

    for (const habit of habits) {
      const status = this.getHabitStatusForDate(habit, completions, date);
      const habitWithStatus: HabitWithStatus = { ...habit, ...status };

      if (!status.isScheduled) {
        notScheduled.push(habitWithStatus);
      } else if (status.isCompleted) {
        completed.push(habitWithStatus);
      } else if (status.isSkipped) {
        skipped.push(habitWithStatus);
      } else {
        scheduled.push(habitWithStatus);
      }
    }

    const totalScheduled = scheduled.length + completed.length + skipped.length;

    return {
      scheduled,
      completed,
      skipped,
      notScheduled,
      stats: {
        total: habits.length,
        scheduledCount: totalScheduled,
        completedCount: completed.length,
        skippedCount: skipped.length,
        pendingCount: scheduled.length,
        completionRate: totalScheduled > 0 ? Math.round((completed.length / totalScheduled) * 100) : 0
      }
    };
  }

  static getUpcomingHabits(habits: Habit[], completions: HabitCompletion[], days = 7): UpcomingHabit[] {
    const today = DateUtils.getCurrentDateString();
    const upcomingDates: DateString[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = DateUtils.formatDate(date);
      upcomingDates.push(dateStr);
    }

    return upcomingDates.map((date) => ({
      date,
      habits: this.getHabitsForDate(habits, completions, date),
      isToday: date === today
    }));
  }
}
