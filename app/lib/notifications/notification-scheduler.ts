import { DateUtils } from '@/lib/core';
import { HabitFrequencyManager } from '@/lib/habit';
import type { DateString, Habit } from '@/lib/types';

export class NotificationScheduler {
  static getNextNotificationTime(habit: Habit, currentDate: DateString = DateUtils.getCurrentDateString()): string | null {
    if (!habit.reminder.enabled) return null;

    const [hours, minutes] = habit.reminder.time.split(':').map(Number);
    const today = DateUtils.getCurrentDateString();
    const now = new Date();

    if (currentDate !== today) {
      return null;
    }

    const todayReminderHasPassed = now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes);

    if (todayReminderHasPassed) {
      return null;
    }

    if (!HabitFrequencyManager.shouldCompleteOnDate(habit.frequency, today, habit.startDate)) {
      return null;
    }

    const notificationDate = new Date();
    notificationDate.setHours(hours, minutes, 0, 0);

    return notificationDate.toISOString();
  }

  static getNextNotificationTimeAcrossDays(
    habit: Habit,
    currentDate: DateString = DateUtils.getCurrentDateString()
  ): string | null {
    if (!habit.reminder.enabled) return null;

    const [hours, minutes] = habit.reminder.time.split(':').map(Number);
    let checkDate = DateUtils.createDateFromString(currentDate);
    const today = DateUtils.getCurrentDateString();
    const now = new Date();

    if (currentDate === today && (now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes))) {
      checkDate.setDate(checkDate.getDate() + 1);
    }

    for (let i = 0; i < 30; i++) {
      const dateStr = DateUtils.formatDate(checkDate);

      if (HabitFrequencyManager.shouldCompleteOnDate(habit.frequency, dateStr, habit.startDate)) {
        const notificationDate = new Date(checkDate);
        notificationDate.setHours(hours, minutes, 0, 0);
        return notificationDate.toISOString();
      }

      checkDate.setDate(checkDate.getDate() + 1);
    }

    return null;
  }
}
