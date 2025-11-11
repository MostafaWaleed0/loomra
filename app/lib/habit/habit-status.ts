import { HABIT_CONFIG } from '../core/constants';
import { DateUtils } from '../core/date-utils';
import { HabitCompletionManager } from './completion-system';
import { HabitFrequencyManager } from './frequency-system';
import { HabitScheduler } from './habit-scheduler';
import type {
  Habit,
  HabitCompletion,
  HabitStatus,
  DateString,
  StatusMessage,
  CalendarModifiers,
  StatusAnalysis,
  DateRange
} from '@/lib/types';

export class HabitStatusManager {
  // ---- Core Status Operations ----
  static getDayStatus(habit: Habit, completions: HabitCompletion[], dateString: DateString): HabitStatus {
    try {
      if (!habit || !dateString) return HABIT_CONFIG.STATUS.DEFAULT;

      // Check if before habit start date
      if (this.isBeforeStartDate(habit.startDate, dateString)) {
        return HABIT_CONFIG.STATUS.LOCKED;
      }

      // Check if this day was originally scheduled (before period completion)
      const wasOriginallyScheduled = HabitFrequencyManager.shouldCompleteOnDate(habit.frequency, dateString, habit.startDate);

      // Use HabitScheduler logic to determine if should complete on this date
      const shouldComplete = HabitScheduler.shouldCompleteOnDate(habit, completions, dateString);

      // If not scheduled at all
      if (!wasOriginallyScheduled) {
        return HABIT_CONFIG.STATUS.NOT_SCHEDULED;
      }

      // Check if it was actually completed on this specific date
      const record = HabitCompletionManager.getRecord(completions, habit.id, dateString);
      if (record?.completed && !record.skipped) {
        return HABIT_CONFIG.STATUS.COMPLETED;
      }

      // Check if it was skipped
      if (record?.skipped) {
        return HABIT_CONFIG.STATUS.SKIPPED;
      }

      // If originally scheduled but now not scheduled due to period completion
      if (!shouldComplete) {
        return HABIT_CONFIG.STATUS.PERIOD_COMPLETED;
      }

      // Check if future date
      if (DateUtils.isFutureDate(dateString)) {
        return HABIT_CONFIG.STATUS.FUTURE_LOCKED;
      }

      // Check if missed - only for X times per period habits after period ends
      const today = DateUtils.getCurrentDateString();
      if (DateUtils.isDateBefore(dateString, today)) {
        // For X times per period, only mark as missed if the period has ended
        if (habit.frequency.type === HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD) {
          if (this.getPeriodEndDate(habit, dateString)) {
            return HABIT_CONFIG.STATUS.MISSED;
          } else {
            return HABIT_CONFIG.STATUS.SCHEDULED; // Still in active period
          }
        } else {
          // For other frequency types, mark as missed if past due
          return HABIT_CONFIG.STATUS.MISSED;
        }
      }

      // Default scheduled
      return HABIT_CONFIG.STATUS.SCHEDULED;
    } catch {
      return HABIT_CONFIG.STATUS.DEFAULT;
    }
  }

  static getStatusMessage(status: HabitStatus, habit: Habit): StatusMessage | null {
    try {
      const messages = this.buildStatusMessages(habit);
      return messages[status] || null;
    } catch {
      return null;
    }
  }

  static createCalendarModifiers(habit: Habit, completionHistory: HabitCompletion[] = []): CalendarModifiers {
    try {
      if (!habit) {
        return { completed: [], missed: [], skipped: [], periodCompleted: [] };
      }

      const completed: Date[] = [];
      const missed: Date[] = [];
      const skipped: Date[] = [];
      const periodCompleted: Date[] = [];
      const todayStr = DateUtils.getCurrentDateString();
      const startStr = habit.startDate || todayStr;

      // Filter completions for this habit only
      const habitCompletions = completionHistory.filter((record) => record.habitId === habit.id);
      const historyMap = this.buildHistoryMap(habitCompletions);

      for (
        let dateStr = startStr;
        DateUtils.isDateBefore(dateStr, todayStr) || dateStr === todayStr;
        dateStr = DateUtils.addDays(dateStr, 1)
      ) {
        const dateObj = DateUtils.createDateFromString(dateStr);
        if (!dateObj) continue;

        // Only process days that fall within the CURRENT habit's frequency schedule
        const isCurrentlyScheduled = HabitFrequencyManager.shouldCompleteOnDate(habit.frequency, dateStr, habit.startDate);
        const shouldComplete = HabitScheduler.shouldCompleteOnDate(habit, completionHistory, dateStr);

        // Skip this date entirely if it's not part of the current frequency schedule
        if (!isCurrentlyScheduled && !shouldComplete) {
          continue;
        }

        const record = historyMap.get(dateStr);
        const isSkipped = HabitCompletionManager.isSkippedOnDate(completionHistory, habit.id, dateStr);

        // Only show completion records that match the current frequency schedule
        if (record?.completed && !isSkipped && isCurrentlyScheduled) {
          completed.push(dateObj);
        }
        // Only show skipped records that match the current frequency schedule
        else if (isSkipped && isCurrentlyScheduled) {
          skipped.push(dateObj);
        }
        // If the day was originally scheduled but became unscheduled due to period completion
        else if (isCurrentlyScheduled && !shouldComplete && DateUtils.isDateBefore(dateStr, todayStr)) {
          periodCompleted.push(dateObj);
        }
        // Only mark as missed if it was scheduled AND it's in the past AND within current frequency
        else if (shouldComplete && isCurrentlyScheduled && DateUtils.isDateBefore(dateStr, todayStr)) {
          if (habit.frequency?.type === HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD) {
            // Only mark as missed if the period has ended AND requirement was not met
            if (this.isPeriodCompleteForDate(habit, dateStr, todayStr)) {
              missed.push(dateObj);
            }
          } else {
            missed.push(dateObj);
          }
        }
      }

      return { completed, missed, skipped, periodCompleted };
    } catch {
      return { completed: [], missed: [], skipped: [], periodCompleted: [] };
    }
  }

  // Helper method to determine if a period is complete for a given date
  static isPeriodCompleteForDate(habit: Habit, dateStr: DateString, todayStr: DateString): boolean {
    try {
      const frequency = habit.frequency;

      // For X times per period habits, check if the period has ended
      if (frequency?.type === HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD) {
        const { period } = frequency.value;
        let periodEnd: DateString;

        if (period === 'week') {
          periodEnd = DateUtils.getWeekEnd(DateUtils.createDateFromString(dateStr), true);
        } else if (period === 'month') {
          periodEnd = DateUtils.getMonthEnd(DateUtils.createDateFromString(dateStr));
        } else {
          return true; // Unknown period type, default to allowing missed status
        }

        // The period is complete if today is after the period end date
        return DateUtils.isDateBefore(periodEnd, todayStr);
      }

      // For other frequency types, get the period end date
      const periodEndDate = this.getPeriodEndDate(habit, dateStr);

      // The period is complete if today is after the period end date
      return DateUtils.isDateBefore(periodEndDate, todayStr);
    } catch {
      return true; // Default to allowing missed status if we can't determine period
    }
  }

  // Helper method to get the end date of the period containing the given date
  static getPeriodEndDate(habit: Habit, dateStr: DateString): DateString {
    const frequency = habit.frequency;

    if (!frequency || frequency.type === HABIT_CONFIG.FREQUENCIES.DAILY) {
      return dateStr;
    }

    if (frequency.type === HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD && frequency.value.period === 'week') {
      return DateUtils.getWeekEnd(DateUtils.createDateFromString(dateStr), true);
    }

    if (frequency.type === HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD && frequency.value.period === 'month') {
      return DateUtils.getMonthEnd(DateUtils.createDateFromString(dateStr));
    }

    // If unable to determine, return the date itself
    return dateStr;
  }

  // ---- Status Analysis ----
  static analyzeHabitStatus(habit: Habit, completions: HabitCompletion[], dateRange: DateRange): StatusAnalysis {
    try {
      const dates = DateUtils.getDateRange(dateRange.start, dateRange.end);
      const statusCounts: StatusAnalysis = {
        completed: 0,
        missed: 0,
        scheduled: 0,
        skipped: 0,
        notScheduled: 0,
        periodCompleted: 0,
        totalDays: dates.length,
        totalScheduled: 0,
        completionRate: 0
      };

      for (const date of dates) {
        const status = this.getDayStatus(habit, completions, date);
        switch (status) {
          case HABIT_CONFIG.STATUS.COMPLETED:
            statusCounts.completed++;
            break;
          case HABIT_CONFIG.STATUS.MISSED:
            statusCounts.missed++;
            break;
          case HABIT_CONFIG.STATUS.SCHEDULED:
            statusCounts.scheduled++;
            break;
          case HABIT_CONFIG.STATUS.SKIPPED:
            statusCounts.skipped++;
            break;
          case HABIT_CONFIG.STATUS.NOT_SCHEDULED:
            statusCounts.notScheduled++;
            break;
          case HABIT_CONFIG.STATUS.PERIOD_COMPLETED:
            statusCounts.periodCompleted++;
            break;
        }
      }

      statusCounts.totalScheduled = statusCounts.completed + statusCounts.missed + statusCounts.scheduled + statusCounts.skipped;
      statusCounts.completionRate =
        statusCounts.totalScheduled > 0 ? Math.round((statusCounts.completed / statusCounts.totalScheduled) * 100) : 0;

      return statusCounts;
    } catch {
      return {
        completed: 0,
        missed: 0,
        scheduled: 0,
        skipped: 0,
        notScheduled: 0,
        periodCompleted: 0,
        totalDays: 0,
        totalScheduled: 0,
        completionRate: 0
      };
    }
  }

  // ---- Private Helpers ----
  static readCompletionRecord(
    completions: HabitCompletion[],
    habitId: string,
    dateString: DateString
  ): { completed: boolean; skipped: boolean } {
    const record = HabitCompletionManager.getRecord(completions, habitId, dateString);
    return {
      completed: Boolean(record?.completed && record.habitId === habitId),
      skipped: Boolean(record?.skipped && record.habitId === habitId)
    };
  }

  static isBeforeStartDate(startDate: DateString | undefined, dateString: DateString): boolean {
    if (!startDate) return false;
    return DateUtils.isDateBefore(dateString, startDate);
  }

  static buildStatusMessages(habit: Habit): Record<HabitStatus, StatusMessage> {
    const startDateForDisplay = habit?.startDate ? DateUtils.formatDateForDisplay(habit.startDate) : undefined;

    return {
      [HABIT_CONFIG.STATUS.LOCKED]: {
        title: 'Day Locked',
        description: startDateForDisplay ? `This habit starts on ${startDateForDisplay}` : 'This habit is not yet available',
        variant: 'outline'
      },
      [HABIT_CONFIG.STATUS.PERIOD_COMPLETED]: {
        title: 'Period Completed',
        description: 'You have already completed the required repetitions for this period',
        variant: 'secondary'
      },
      [HABIT_CONFIG.STATUS.NOT_SCHEDULED]: {
        title: 'Not Scheduled',
        description: 'This habit is not scheduled for this date',
        variant: 'outline'
      },
      [HABIT_CONFIG.STATUS.SKIPPED]: {
        title: 'Skipped',
        description: 'You chose to skip this habit for today',
        variant: 'secondary',
        icon: 'outline'
      },
      [HABIT_CONFIG.STATUS.FUTURE_LOCKED]: {
        title: 'Future Date',
        description: 'You cannot complete habits for future dates',
        variant: 'outline'
      },
      [HABIT_CONFIG.STATUS.COMPLETED]: {
        title: 'Completed',
        description: 'This habit was completed on this date',
        variant: 'default'
      },
      [HABIT_CONFIG.STATUS.SCHEDULED]: {
        title: 'Scheduled',
        description: 'This habit is scheduled for this date',
        variant: 'default'
      },
      [HABIT_CONFIG.STATUS.MISSED]: {
        title: 'Missed',
        description: 'This habit was not completed on this date',
        variant: 'destructive'
      },
      [HABIT_CONFIG.STATUS.DEFAULT]: {
        title: 'Default',
        description: 'Default status',
        variant: 'outline'
      }
    };
  }

  static buildHistoryMap(completionHistory: HabitCompletion[]): Map<DateString, HabitCompletion> {
    const historyMap = new Map<DateString, HabitCompletion>();

    if (!Array.isArray(completionHistory)) return historyMap;

    for (const record of completionHistory) {
      if (record?.date) {
        historyMap.set(record.date, record);
      }
    }

    return historyMap;
  }
}
