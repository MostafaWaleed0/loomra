import { DateUtils } from '@/lib/core';
import { HabitCompletionManager } from '@/lib/habit';
import { NotificationScheduler } from '@/lib/notifications/notification-scheduler';
import { NOTIFICATION_RETRY_CONFIG, NOTIFICATION_STORAGE_KEYS, NotificationUtils } from '@/lib/notifications/notification-utils';
import { commands } from '@/lib/tauri-api';
import type {
  Habit,
  NotificationManagerReturn,
  NotificationPayload,
  NotificationState,
  ScheduledNotification,
  UseNotificationManagerProps
} from '@/lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export function useNotificationManager({
  habits,
  completions,
  onComplete,
  onSkip,
  settings
}: UseNotificationManagerProps): NotificationManagerReturn {
  const [state, setState] = useState<NotificationState>({
    scheduled: [],
    permissionGranted: false,
    isLoading: true,
    error: null,
    lastSync: null
  });

  const [sentStreakNotifications, setSentStreakNotifications] = useState<Set<string>>(new Set());
  const [cancelledNotifications, setCancelledNotifications] = useState<Set<string>>(new Set());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const schedulingQueue = useRef<Set<string>>(new Set());
  const hasInitialized = useRef(false);
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastCheckedDate = useRef<string>(DateUtils.getCurrentDateString());

  const exponentialBackoff = useCallback((attempt: number): number => {
    const delay = Math.min(NOTIFICATION_RETRY_CONFIG.baseDelay * Math.pow(2, attempt), NOTIFICATION_RETRY_CONFIG.maxDelay);
    return delay + Math.random() * 1000;
  }, []);

  const withRetry = useCallback(
    async <T,>(operation: () => Promise<T>, context: string, attempt = 0): Promise<T | null> => {
      try {
        return await operation();
      } catch {
        if (attempt < NOTIFICATION_RETRY_CONFIG.maxAttempts - 1) {
          const delay = exponentialBackoff(attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return withRetry(operation, context, attempt + 1);
        }
        return null;
      }
    },
    [exponentialBackoff]
  );

  const loadFromStorage = useCallback(<T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }, []);

  const saveToStorage = useCallback((key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, []);

  useEffect(() => {
    const streaks = loadFromStorage<string[]>(NOTIFICATION_STORAGE_KEYS.SENT_STREAKS, []);
    setSentStreakNotifications(new Set(streaks));

    const cancelled = loadFromStorage<string[]>(NOTIFICATION_STORAGE_KEYS.CANCELLED_NOTIFICATIONS, []);
    setCancelledNotifications(new Set(cancelled));
  }, [loadFromStorage]);

  useEffect(() => {
    saveToStorage(NOTIFICATION_STORAGE_KEYS.SENT_STREAKS, Array.from(sentStreakNotifications));
  }, [sentStreakNotifications, saveToStorage]);

  useEffect(() => {
    saveToStorage(NOTIFICATION_STORAGE_KEYS.CANCELLED_NOTIFICATIONS, Array.from(cancelledNotifications));
  }, [cancelledNotifications, saveToStorage]);

  const checkAndRequestPermission = useCallback(async (): Promise<boolean> => {
    const hasAsked = loadFromStorage(NOTIFICATION_STORAGE_KEYS.PERMISSION_ASKED, false);

    try {
      const granted = await commands.notifications.checkNotificationPermission();

      if (granted) {
        setState((prev) => ({ ...prev, permissionGranted: true }));
        return true;
      }

      if (!hasAsked) {
        saveToStorage(NOTIFICATION_STORAGE_KEYS.PERMISSION_ASKED, true);

        toast('Enable Notifications', {
          description: 'Get reminders for your habits and stay on track!',
          action: {
            label: 'Enable',
            onClick: async () => {
              const permission = await commands.notifications.requestNotificationPermission();
              setState((prev) => ({ ...prev, permissionGranted: permission }));

              if (permission) {
                toast.success('Notifications enabled!');
              }
            }
          },
          duration: 10000
        });
      }

      return false;
    } catch {
      setState((prev) => ({
        ...prev,
        permissionGranted: false,
        error: 'Failed to check notification permission'
      }));
      return false;
    }
  }, [loadFromStorage, saveToStorage]);

  useEffect(() => {
    checkAndRequestPermission();
  }, [checkAndRequestPermission]);

  const loadScheduledNotifications = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const schedules = await withRetry(() => commands.notifications.getScheduledNotifications(), 'Load scheduled notifications');

    if (!schedules) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load notifications'
      }));
      return;
    }

    const today = DateUtils.getCurrentDateString();

    const notifications: ScheduledNotification[] = schedules
      .filter((schedule) => {
        const scheduledDate = DateUtils.formatDate(new Date(schedule.scheduledTime));
        return scheduledDate === today;
      })
      .map((schedule) => {
        const scheduledDate = DateUtils.formatDate(new Date(schedule.scheduledTime));
        const habit = habits.find((h) => h.id === schedule.habitId);

        return {
          id: NotificationUtils.generateNotificationId(),
          habitId: schedule.habitId,
          scheduledTime: schedule.scheduledTime,
          payload: habit
            ? NotificationUtils.createReminderPayload(habit, scheduledDate)
            : {
                id: NotificationUtils.generateNotificationId(),
                habitId: schedule.habitId,
                title: `⏰ Time for ${schedule.habitName}`,
                body: "Don't forget your habit!",
                type: schedule.notificationType as any,
                scheduledFor: scheduledDate,
                actions: [
                  { action: 'complete', title: 'Mark Complete' },
                  { action: 'skip', title: 'Skip Today' },
                  { action: 'dismiss', title: 'Dismiss' }
                ]
              },
          status: 'pending',
          createdAt: new Date().toISOString()
        };
      });

    setState((prev) => ({
      ...prev,
      scheduled: notifications,
      isLoading: false,
      lastSync: new Date()
    }));
  }, [habits, withRetry]);

  useEffect(() => {
    loadScheduledNotifications();
  }, [loadScheduledNotifications]);

  const sendSystemNotification = useCallback(
    async (payload: NotificationPayload): Promise<void> => {
      if (!state.permissionGranted) return;

      const result = await withRetry(async () => {
        await commands.notifications.sendSystemNotification(payload);

        if (payload.type !== 'goal_deadline') {
          await commands.notifications.recordNotification({
            id: payload.id,
            habitId: payload.habitId,
            sentAt: new Date().toISOString(),
            notificationType: payload.type,
            opened: false,
            actionTaken: null,
            payloadData: JSON.stringify(payload)
          });
        }

        return true;
      }, 'Send system notification');

      if (!result) {
      }
    },
    [state.permissionGranted, withRetry]
  );

  const sendInAppNotification = useCallback(
    (payload: NotificationPayload) => {
      const actions: any = {};

      if (payload.actions?.find((a) => a.action === 'complete')) {
        actions.action = {
          label: 'Complete ✓',
          onClick: async () => {
            try {
              await onComplete(payload.habitId, payload.scheduledFor);
              toast.success('Habit completed! 🎉');

              await commands.notifications.markNotificationOpened(payload.id, 'complete');
            } catch {
              toast.error('Failed to complete habit');
            }
          }
        };
      }

      if (payload.actions?.find((a) => a.action === 'skip')) {
        actions.cancel = {
          label: 'Skip',
          onClick: async () => {
            try {
              await onSkip(payload.habitId, payload.scheduledFor);
              toast.info('Habit skipped');

              await commands.notifications.markNotificationOpened(payload.id, 'skip');
            } catch {
              toast.error('Failed to skip habit');
            }
          }
        };
      }

      return toast(payload.title, {
        description: payload.body,
        duration: 10000,
        ...actions,
        className: 'group',
        onDismiss: async () => {
          try {
            await commands.notifications.markNotificationOpened(payload.id, 'dismiss');
          } catch {}
        }
      });
    },
    [onComplete, onSkip]
  );

  const sendNotification = useCallback(
    async (payload: NotificationPayload) => {
      await sendSystemNotification(payload);
      sendInAppNotification(payload);

      setState((prev) => ({
        ...prev,
        scheduled: prev.scheduled.map((notif) => (notif.payload.id === payload.id ? { ...notif, status: 'sent' } : notif))
      }));
    },
    [sendSystemNotification, sendInAppNotification]
  );

  useEffect(() => {
    if (!settings.streakReminders || !hasInitialized.current) return;

    const newStreaks: Array<{ habit: Habit; streak: number }> = [];

    habits.forEach((habit) => {
      const { streak } = HabitCompletionManager.calculateHabitStats(completions, habit);
      const notificationKey = NotificationUtils.createNotificationKey(habit.id, `${streak}`, 'streak');

      if (NotificationUtils.isStreakMilestone(streak) && !sentStreakNotifications.has(notificationKey)) {
        newStreaks.push({ habit, streak });
      }
    });

    if (newStreaks.length > 0) {
      const sendStreakNotifications = async () => {
        for (const { habit, streak } of newStreaks) {
          const payload = NotificationUtils.createStreakPayload(habit, streak);
          sendInAppNotification(payload);

          const notificationKey = NotificationUtils.createNotificationKey(habit.id, `${streak}`, 'streak');
          setSentStreakNotifications((prev) => new Set(prev).add(notificationKey));
        }
      };

      sendStreakNotifications();
    }
  }, [habits, completions, settings.streakReminders, sentStreakNotifications, sendInAppNotification]);

  const scheduleNotification = useCallback(
    async (habit: Habit): Promise<void> => {
      if (!settings.habitReminders || !habit.reminder.enabled) return;
      if (schedulingQueue.current.has(habit.id)) return;

      schedulingQueue.current.add(habit.id);

      try {
        const currentDate = DateUtils.getCurrentDateString();
        const nextTime = NotificationScheduler.getNextNotificationTime(habit, currentDate);

        if (!nextTime) {
          schedulingQueue.current.delete(habit.id);
          return;
        }

        const scheduledDate = DateUtils.formatDate(new Date(nextTime));

        if (NotificationUtils.isHabitCompletedOrSkipped(completions, habit.id, scheduledDate)) {
          schedulingQueue.current.delete(habit.id);
          return;
        }

        const timeUntil = NotificationUtils.getTimeUntilNotification(nextTime);

        if (timeUntil < 0) {
          schedulingQueue.current.delete(habit.id);
          return;
        }

        const payload = NotificationUtils.createReminderPayload(habit, scheduledDate);

        const result = await withRetry(
          () =>
            commands.notifications.scheduleNotification({
              habitId: habit.id,
              habitName: habit.name,
              scheduledTime: nextTime,
              notificationType: 'reminder',
              isRecurring: true
            }),
          'Schedule notification'
        );

        if (!result) {
          throw new Error('Failed to schedule notification');
        }

        const scheduled: ScheduledNotification = {
          id: payload.id,
          habitId: habit.id,
          scheduledTime: nextTime,
          payload,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        setState((prev) => ({
          ...prev,
          scheduled: [...prev.scheduled.filter((n) => n.habitId !== habit.id), scheduled]
        }));

        const existingTimeout = timeoutRefs.current.get(habit.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        const timeout = setTimeout(() => {
          const notificationDate = DateUtils.formatDate(new Date(nextTime));
          const todayDate = DateUtils.getCurrentDateString();

          if (
            notificationDate === todayDate &&
            !NotificationUtils.isHabitCompletedOrSkipped(completions, habit.id, notificationDate)
          ) {
            sendNotification(payload);
          }

          timeoutRefs.current.delete(habit.id);
        }, timeUntil);

        timeoutRefs.current.set(habit.id, timeout);
      } catch {
        toast.error('Failed to schedule reminder', {
          description: 'Please try again later'
        });
      } finally {
        schedulingQueue.current.delete(habit.id);
      }
    },
    [settings.habitReminders, completions, withRetry, sendNotification]
  );

  const cancelNotification = useCallback(
    async (habitId: string): Promise<void> => {
      const notification = state.scheduled.find((n) => n.habitId === habitId && n.status === 'pending');
      if (!notification) return;

      const cancelKey = NotificationUtils.createNotificationKey(habitId, notification.payload.scheduledFor);

      const timeout = timeoutRefs.current.get(habitId);
      if (timeout) {
        clearTimeout(timeout);
        timeoutRefs.current.delete(habitId);
      }

      setState((prev) => ({
        ...prev,
        scheduled: prev.scheduled.map((notif) =>
          notif.habitId === habitId && notif.status === 'pending' ? { ...notif, status: 'cancelled' } : notif
        )
      }));

      setCancelledNotifications((prev) => new Set(prev).add(cancelKey));

      const result = await withRetry(() => commands.notifications.cancelNotification(habitId), 'Cancel notification');

      if (!result) {
        setState((prev) => ({
          ...prev,
          scheduled: prev.scheduled.map((notif) => (notif.habitId === habitId ? { ...notif, status: 'pending' } : notif))
        }));
        setCancelledNotifications((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cancelKey);
          return newSet;
        });
        toast.error('Failed to cancel notification');
      }
    },
    [state.scheduled, withRetry]
  );

  const rescheduleAll = useCallback(async () => {
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current.clear();
    schedulingQueue.current.clear();

    const schedulePromises = habits
      .filter((habit) => habit.reminder.enabled && settings.habitReminders)
      .map((habit) => scheduleNotification(habit));

    await Promise.allSettled(schedulePromises);
  }, [habits, settings.habitReminders, scheduleNotification]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      rescheduleAll();
    }

    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
      retryTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      retryTimeouts.current.clear();
    };
  }, [rescheduleAll]);

  useEffect(() => {
    if (hasInitialized.current) {
      rescheduleAll();
    }
  }, [completions, rescheduleAll]);

  useEffect(() => {
    const checkAndCleanup = () => {
      const today = DateUtils.getCurrentDateString();

      if (lastCheckedDate.current === today) {
        return;
      }

      lastCheckedDate.current = today;

      setState((prev) => {
        const todayNotifications = prev.scheduled.filter((n) => {
          const notificationDate = DateUtils.formatDate(new Date(n.scheduledTime));
          return notificationDate === today;
        });

        if (todayNotifications.length === prev.scheduled.length) {
          return prev;
        }

        return {
          ...prev,
          scheduled: todayNotifications
        };
      });

      timeoutRefs.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      timeoutRefs.current.clear();

      if (hasInitialized.current) {
        rescheduleAll();
      }
    };

    const interval = setInterval(checkAndCleanup, 60000);

    return () => clearInterval(interval);
  }, [rescheduleAll]);

  const getUpcomingNotifications = useCallback(() => {
    const today = DateUtils.getCurrentDateString();

    const todayNotifications = state.scheduled.filter((n) => {
      if (n.status !== 'pending') return false;

      const notificationDate = DateUtils.formatDate(new Date(n.scheduledTime));
      return notificationDate === today;
    });

    const activeNotifications = NotificationUtils.filterActiveNotifications(todayNotifications, completions);

    return NotificationUtils.sortByScheduledTime(activeNotifications, true);
  }, [state.scheduled, completions]);

  const getNotificationHistory = useCallback(
    async (limit?: number) => {
      return await withRetry(() => commands.notifications.getNotificationHistory(limit), 'Get notification history');
    },
    [withRetry]
  );

  const cleanNotificationHistory = useCallback(
    async (daysToKeep: number = 30) => {
      const deleted = await withRetry(
        () => commands.notifications.cleanNotificationHistory(daysToKeep),
        'Clean notification history'
      );

      if (deleted !== null) {
        toast.success(`Cleaned ${deleted} old notifications`);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        setCancelledNotifications((prev) => {
          const newSet = new Set<string>();
          prev.forEach((key) => {
            newSet.add(key);
          });
          return newSet;
        });
      }

      return deleted ?? 0;
    },
    [withRetry]
  );

  return {
    scheduledNotifications: state.scheduled,
    permissionGranted: state.permissionGranted,
    isLoading: state.isLoading,
    error: state.error,
    lastSync: state.lastSync,

    scheduleNotification,
    cancelNotification,
    rescheduleAll,
    sendNotification,

    getUpcomingNotifications,
    getNotificationHistory,
    cleanNotificationHistory,

    refreshPermission: checkAndRequestPermission,
    refreshScheduled: loadScheduledNotifications
  };
}
