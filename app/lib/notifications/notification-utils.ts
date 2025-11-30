import { DateUtils } from '@/lib/core';
import { HabitCompletionManager } from '@/lib/habit';
import type { DateString, Habit, HabitCompletion, NotificationPayload } from '@/lib/types';

export class NotificationUtils {
  static isHabitCompletedOrSkipped(completions: HabitCompletion[], habitId: string, date: DateString): boolean {
    return (
      HabitCompletionManager.isCompletedOnDate(completions, habitId, date) ||
      HabitCompletionManager.isSkippedOnDate(completions, habitId, date)
    );
  }

  static generateNotificationId(prefix: 'notification' | 'schedule' | 'reminder' = 'notification'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getTimeUntilNotification(scheduledTime: string): number {
    return new Date(scheduledTime).getTime() - Date.now();
  }

  static formatTimeUntil(milliseconds: number): string {
    if (milliseconds < 0) return 'Past due';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  static isUrgentNotification(scheduledTime: string): boolean {
    const timeUntil = this.getTimeUntilNotification(scheduledTime);
    return timeUntil < 5 * 60 * 1000 && timeUntil > 0;
  }

  static isSoonNotification(scheduledTime: string): boolean {
    const timeUntil = this.getTimeUntilNotification(scheduledTime);
    return timeUntil < 60 * 60 * 1000 && timeUntil > 0;
  }

  static createNotificationKey(habitId: string, date: DateString, type?: string): string {
    return type ? `${habitId}-${date}-${type}` : `${habitId}-${date}`;
  }

  static getNotificationIconName(type: string): string {
    const iconMap: Record<string, string> = {
      reminder: 'Clock',
      streak: 'TrendingUp',
      goal_deadline: 'Target',
      daily_summary: 'Calendar',
      milestone: 'Sparkles'
    };
    return iconMap[type] || 'Bell';
  }

  static getNotificationColor(type: string): string {
    const colorMap: Record<string, string> = {
      reminder: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      streak: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      goal_deadline: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      daily_summary: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      milestone: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20'
    };
    return colorMap[type] || 'bg-muted/10 text-muted-foreground border-muted/20';
  }

  static createReminderPayload(habit: Habit, scheduledFor: DateString): NotificationPayload {
    return {
      id: this.generateNotificationId(),
      habitId: habit.id,
      title: `⏰ Time for ${habit.name}`,
      body: "Don't forget your habit!",
      type: 'reminder',
      scheduledFor,
      icon: habit.icon,
      actions: [
        { action: 'complete', title: 'Mark Complete' },
        { action: 'skip', title: 'Skip Today' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };
  }

  static createStreakPayload(habit: Habit, streak: number): NotificationPayload {
    return {
      id: this.generateNotificationId(),
      habitId: habit.id,
      title: `🔥 ${streak}-Day Streak!`,
      body: `Amazing! You've completed "${habit.name}" for ${streak} days in a row!`,
      type: 'streak',
      scheduledFor: DateUtils.getCurrentDateString(),
      icon: habit.icon
    };
  }

  static createDailySummaryPayload(completed: number, total: number, completionRate: number): NotificationPayload {
    const emoji = completionRate >= 80 ? '🌟' : completionRate >= 50 ? '👍' : '💪';
    return {
      id: this.generateNotificationId(),
      habitId: 'summary',
      title: `${emoji} Daily Summary`,
      body: `${completed}/${total} habits completed (${completionRate}%)`,
      type: 'daily_summary',
      scheduledFor: DateUtils.getCurrentDateString()
    };
  }

  static filterActiveNotifications<T extends { habitId: string; payload: { scheduledFor: DateString } }>(
    notifications: T[],
    completions: HabitCompletion[]
  ): T[] {
    return notifications.filter(
      (notification) => !this.isHabitCompletedOrSkipped(completions, notification.habitId, notification.payload.scheduledFor)
    );
  }

  static sortByScheduledTime<T extends { scheduledTime: string }>(notifications: T[], ascending: boolean = true): T[] {
    return [...notifications].sort((a, b) => {
      const timeA = new Date(a.scheduledTime).getTime();
      const timeB = new Date(b.scheduledTime).getTime();
      return ascending ? timeA - timeB : timeB - timeA;
    });
  }

  static getStreakMilestones(): number[] {
    return [7, 14, 21, 30, 60, 90, 100, 365];
  }

  static isStreakMilestone(streak: number): boolean {
    return this.getStreakMilestones().includes(streak);
  }

  static isValidPayload(payload: any): payload is NotificationPayload {
    return (
      payload &&
      typeof payload === 'object' &&
      typeof payload.id === 'string' &&
      typeof payload.habitId === 'string' &&
      typeof payload.title === 'string' &&
      typeof payload.body === 'string' &&
      typeof payload.type === 'string' &&
      typeof payload.scheduledFor === 'string'
    );
  }

  static createStorageKey(namespace: string, ...identifiers: string[]): string {
    return [namespace, ...identifiers].filter(Boolean).join(':');
  }
}

export const NOTIFICATION_STORAGE_KEYS = {
  SENT_STREAKS: 'sentStreakNotifications',
  SENT_GOAL_DEADLINES: 'sentGoalDeadlineNotifications',
  CANCELLED_NOTIFICATIONS: 'cancelledNotifications',
  LAST_SUMMARY: 'lastDailySummary',
  PERMISSION_ASKED: 'notificationPermissionAsked'
} as const;

export const NOTIFICATION_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000
} as const;

export const NOTIFICATION_TIME_THRESHOLDS = {
  URGENT: 5 * 60 * 1000,
  SOON: 60 * 60 * 1000,
  UPCOMING: 24 * 60 * 60 * 1000
} as const;
