import { DateUtils } from '@/lib/core';
import { HabitCompletionManager, HabitFactory, HabitFrequencyManager, HabitScheduler } from '@/lib/habit';
import type {
  CompletionRecord,
  DateStats,
  DateString,
  Habit,
  HabitCompletion,
  HabitFormData,
  HabitStats,
  HabitStatsBreakdown,
  HabitWithMetadata,
  UseHabitsReturn
} from '@/lib/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { commands } from '../tauri-api';
import { useSettings } from '../context/settings-context';

// ============================================================================
// HABIT STATS CALCULATOR
// ============================================================================

export class HabitStatsCalculator {
  static calculate(
    habits: Habit[],
    completions: HabitCompletion[],
    selectedDate: DateString = DateUtils.getCurrentDateString()
  ): HabitStats {
    if (!habits.length) {
      return this.createEmptyStats();
    }

    const habitsForDate = HabitScheduler.getHabitsForDate(habits, completions, selectedDate);

    const completedForDate = habitsForDate.filter((h) => {
      const isCompleted = HabitCompletionManager.isCompletedOnDate(completions, h.id, selectedDate);
      const isSkipped = HabitCompletionManager.isSkippedOnDate(completions, h.id, selectedDate);
      return isCompleted && !isSkipped;
    }).length;

    const total = habits.length;
    const dueToday = habitsForDate.filter((h) => {
      const isSkipped = HabitCompletionManager.isSkippedOnDate(completions, h.id, selectedDate);
      return !isSkipped;
    }).length;

    const skippedToday = habitsForDate.filter((h) => {
      return HabitCompletionManager.isSkippedOnDate(completions, h.id, selectedDate);
    }).length;

    const percentage = dueToday > 0 ? Math.round((completedForDate / dueToday) * 100) : 0;

    // Calculate aggregate streak data
    const totalStreak = habits.reduce((sum, h) => {
      const stats = HabitCompletionManager.calculateHabitStats(completions, h);
      return sum + (stats.streak || 0);
    }, 0);

    const bestStreak = Math.max(
      ...habits.map((h) => {
        const stats = HabitCompletionManager.calculateHabitStats(completions, h);
        return stats.bestStreak || 0;
      }),
      0
    );

    return {
      completed: completedForDate,
      total,
      dueToday,
      percentage,
      totalTodayHabit: habitsForDate.length,
      totalStreak,
      bestStreak,
      avgCompletion: this.calculateAverageCompletion(habits, completions),
      activeHabits: this.calculateActiveHabits(habits, completions),
      completedThisWeek: this.calculateCompletedThisWeek(habits, completions),
      skippedToday
    };
  }

  static createEmptyStats(): HabitStats {
    return {
      completed: 0,
      total: 0,
      percentage: 0,
      totalTodayHabit: 0,
      totalStreak: 0,
      avgCompletion: 0,
      bestStreak: 0,
      activeHabits: 0,
      completedThisWeek: 0,
      dueToday: 0,
      skippedToday: 0
    };
  }

  static calculateAverageCompletion(habits: Habit[], completions: HabitCompletion[]): number {
    if (!habits.length) return 0;

    const totalAvg = habits.reduce((sum, habit) => {
      const startDate = habit.startDate || habit.createdAt;
      const today = DateUtils.getCurrentDateString();

      // Calculate days between start date and today (inclusive)
      const daysSinceCreation = DateUtils.calculateDaysBetween(startDate, today);

      // Add 1 to include today in the count (if between is 0, we still have 1 day)
      const days = Math.max(1, daysSinceCreation + 1);

      const actualCompletions = this.getActualCompletions(habit, completions);
      const completionRate = actualCompletions / days;

      // Check for NaN or Infinity
      if (isNaN(completionRate) || !isFinite(completionRate)) {
        return sum;
      }

      return sum + completionRate;
    }, 0);

    const avgResult = (totalAvg / habits.length) * 100;

    // Return 0 if result is NaN or Infinity
    if (isNaN(avgResult) || !isFinite(avgResult)) {
      return 0;
    }

    return Math.round(avgResult);
  }

  static calculateActiveHabits(habits: Habit[], completions: HabitCompletion[]): number {
    return completions.filter((completion) => {
      if (!completion.completedAt) return false;

      const daysSinceCompleted = DateUtils.calculateDaysBetween(completion.completedAt, DateUtils.getCurrentDateString());
      const lastRecord = HabitCompletionManager.getRecord(completions, completion.habitId, completion.completedAt);

      return daysSinceCompleted <= 7 && lastRecord?.completed && !lastRecord?.skipped;
    }).length;
  }

  static calculateCompletedThisWeek(habits: Habit[], completions: HabitCompletion[]): number {
    const weekStart = DateUtils.getWeekStart();
    const weekEnd = DateUtils.getWeekEnd();

    return habits.reduce((sum, habit) => {
      const weekDates = DateUtils.getDateRange(weekStart, weekEnd);
      const hasActualCompletionThisWeek = weekDates.some((date) => {
        const isCompleted = HabitCompletionManager.isCompletedOnDate(completions, habit.id, date);
        const isSkipped = HabitCompletionManager.isSkippedOnDate(completions, habit.id, date);
        return isCompleted && !isSkipped;
      });
      return hasActualCompletionThisWeek ? sum + 1 : sum;
    }, 0);
  }

  static getActualCompletions(habit: Habit, completions: HabitCompletion[]): number {
    const habitCompletions = HabitCompletionManager.getHabitCompletions(completions, habit.id);
    return habitCompletions.filter((record) => record.completed && !record.skipped).length;
  }

  static getDetailedBreakdown(
    habits: Habit[],
    completions: HabitCompletion[],
    selectedDate: DateString = DateUtils.getCurrentDateString()
  ): HabitStatsBreakdown {
    const stats = this.calculate(habits, completions, selectedDate);
    const habitsForDate = HabitScheduler.getHabitsForDate(habits, completions, selectedDate);

    return {
      ...stats,
      breakdown: {
        totalHabits: habits.length,
        scheduledToday: habitsForDate.length,
        completedToday: stats.completed,
        pendingToday: stats.dueToday - stats.completed,
        skippedToday: stats.skippedToday,
        notScheduledToday: habits.length - habitsForDate.length,
        completionRate: stats.percentage,
        weeklyActiveRate: habits.length > 0 ? Math.round((stats.activeHabits / habits.length) * 100) : 0
      }
    };
  }

  static getStatsForDateRange(
    habits: Habit[],
    completions: HabitCompletion[],
    startDate: DateString,
    endDate: DateString
  ): DateStats[] {
    const dates = DateUtils.getDateRange(startDate, endDate);

    return dates.map((date) => ({
      date,
      stats: this.calculate(habits, completions, date),
      isToday: date === DateUtils.getCurrentDateString()
    }));
  }
}

// ============================================================================
// USE HABITS HOOK
// ============================================================================

export function useHabits(): UseHabitsReturn {
  const { settings } = useSettings();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateString>(DateUtils.getCurrentDateString());
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const habitsCacheRef = useRef<Map<string, Habit>>(new Map());

  const selectedHabit = useMemo(() => {
    if (!selectedHabitId) return null;
    const habit = habits.find((h) => h.id === selectedHabitId) || null;
    if (habit) {
      habitsCacheRef.current.set(habit.id, habit);
    }
    return habit;
  }, [selectedHabitId, habits]);

  // ============================================================================
  // INITIAL DATA LOAD - Only on mount
  // ============================================================================

  const loadAllCompletions = useCallback(async (): Promise<HabitCompletion[]> => {
    try {
      const allHabits = await commands.habits.getAllHabits();
      const completionPromises = allHabits.map((habit) => commands.habitCompletions.getHabitCompletions(habit.id, null, null));
      const completionArrays = await Promise.all(completionPromises);
      return completionArrays.flat();
    } catch (error) {
      console.error('Failed to load completions:', error);
      return [];
    }
  }, []);

  const loadInitialData = useCallback(async (): Promise<void> => {
    try {
      const [loadedHabits, allCompletions] = await Promise.all([commands.habits.getAllHabits(), loadAllCompletions()]);

      setHabits(loadedHabits);
      setCompletions(allCompletions);

      if (selectedHabitId && !loadedHabits.find((h) => h.id === selectedHabitId)) {
        setSelectedHabitId(null);
      }
    } catch (error) {
      console.error('Failed to load habits data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadAllCompletions, selectedHabitId]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // ============================================================================
  // CRUD OPERATIONS - Optimistic updates
  // ============================================================================

  const handleSaveHabit = useCallback(
    async (habitData: HabitFormData | null, existingHabit: Habit | null = null): Promise<Habit> => {
      try {
        const normalizedHabit = HabitFactory.create(habitData as HabitFormData, existingHabit || undefined, settings.habits);
        if (!normalizedHabit) throw new Error('Failed to create habit');

        let savedHabit: Habit;
        if (existingHabit) {
          savedHabit = await commands.habits.updateHabit(normalizedHabit);

          setHabits((prev) => prev.map((h) => (h.id === existingHabit.id ? savedHabit : h)));
          habitsCacheRef.current.set(savedHabit.id, savedHabit);
        } else {
          savedHabit = await commands.habits.createHabit(normalizedHabit);

          setHabits((prev) => [...prev, savedHabit]);
          habitsCacheRef.current.set(savedHabit.id, savedHabit);
        }

        return savedHabit;
      } catch (error) {
        console.error('Failed to save habit:', error);
        throw error;
      }
    },
    [settings]
  );

  const handleDeleteHabit = useCallback(
    async (habitId: string): Promise<void> => {
      if (!habitId) return;

      const habit = habits.find((h) => h.id === habitId);
      const habitCompletions = completions.filter((c) => c.habitId === habitId);

      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      setCompletions((prev) => prev.filter((c) => c.habitId !== habitId));
      habitsCacheRef.current.delete(habitId);

      if (selectedHabitId === habitId) {
        setSelectedHabitId(null);
      }

      try {
        await commands.habits.deleteHabit(habitId);
      } catch (error) {
        console.error('Failed to delete habit:', error);

        if (habit) {
          setHabits((prev) => [...prev, habit]);
          setCompletions((prev) => [...prev, ...habitCompletions]);
          habitsCacheRef.current.set(habitId, habit);
        }
        throw error;
      }
    },
    [habits, completions, selectedHabitId]
  );

  // ============================================================================
  // DATE OPERATIONS
  // ============================================================================

  const handleDateSelect = useCallback((date: Date | DateString): void => {
    if (!date) return;
    const dateString = typeof date === 'string' ? date : DateUtils.formatDate(date);
    setSelectedDate(dateString);
  }, []);

  // ============================================================================
  // COMPLETION OPERATIONS - Optimistic updates
  // ============================================================================

  const updateHabitStats = useCallback(
    async (habitId: string): Promise<void> => {
      try {
        const habit = habits.find((h) => h.id === habitId);
        if (!habit) return;

        const stats = HabitCompletionManager.calculateHabitStats(completions, habit);
        const updatedHabit: Habit = {
          ...habit,
          ...stats,
          updatedAt: new Date().toISOString()
        };

        setHabits((prev) =>
          prev.map((h) => {
            if (h.id === habitId) {
              habitsCacheRef.current.set(habitId, updatedHabit);
              return updatedHabit;
            }
            return h;
          })
        );

        await commands.habits.updateHabit(updatedHabit);
      } catch (error) {
        console.error('Failed to update habit stats:', error);
      }
    },
    [habits, completions]
  );

  const setHabitCompletion = useCallback(
    async (
      habitId: string,
      date: DateString,
      completed: boolean,
      additionalData: Partial<CompletionRecord> = {}
    ): Promise<void> => {
      try {
        const habit = habits.find((h) => h.id === habitId);
        if (!habit) return;

        const existingRecord = HabitCompletionManager.getRecord(completions, habitId, date);
        let savedRecord: HabitCompletion;

        if (existingRecord) {
          const updatedRecord = HabitCompletionManager.updateRecord(existingRecord, {
            completed,
            targetAmount: habit.targetAmount,
            ...additionalData
          });

          setCompletions((prev) => prev.map((r) => (r.id === existingRecord.id ? updatedRecord : r)));

          savedRecord = await commands.habitCompletions.updateHabitCompletion(updatedRecord);

          setCompletions((prev) => prev.map((r) => (r.id === existingRecord.id ? savedRecord : r)));
        } else {
          const newRecord = HabitCompletionManager.createRecord(habitId, date, {
            completed,
            targetAmount: habit.targetAmount,
            ...additionalData
          });

          setCompletions((prev) => [...prev, newRecord]);

          savedRecord = await commands.habitCompletions.createHabitCompletion(newRecord);

          setCompletions((prev) => prev.map((r) => (r.habitId === habitId && r.completedAt === date ? savedRecord : r)));
        }

        // Update stats in background
        setTimeout(() => updateHabitStats(habitId), 0);
      } catch (error) {
        console.error('Failed to set habit completion:', error);
        await loadInitialData();
        throw error;
      }
    },
    [habits, completions, updateHabitStats, loadInitialData]
  );

  const toggleHabitCompletion = useCallback(
    async (habitId: string, date: DateString = selectedDate): Promise<void> => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const existingRecord = HabitCompletionManager.getRecord(completions, habitId, date);
      const wasCompleted = (existingRecord?.completed && !existingRecord?.skipped) || false;
      const newCompleted = !wasCompleted;
      const newAmount = newCompleted ? habit.targetAmount : 0;

      const additionalData: Partial<CompletionRecord> = newCompleted
        ? {
            actualAmount: newAmount,
            note: existingRecord?.note || '',
            mood: existingRecord?.mood || null,
            difficulty: existingRecord?.difficulty || null,
            skipped: false
          }
        : { actualAmount: newAmount, note: '', mood: null, difficulty: null, skipped: false };

      await setHabitCompletion(habitId, date, newCompleted, additionalData);
    },
    [habits, completions, selectedDate, setHabitCompletion]
  );

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  const getHabitById = useCallback(
    (habitId: string): Habit | null => {
      const habit = habits.find((h) => h.id === habitId) || null;
      if (habit) {
        habitsCacheRef.current.set(habitId, habit);
      } else {
        habitsCacheRef.current.delete(habitId);
      }
      return habit;
    },
    [habits]
  );

  const getHabitsForDate = useCallback(
    (date: DateString = selectedDate): Habit[] => {
      return HabitScheduler.getHabitsForDate(habits, completions, date);
    },
    [habits, completions, selectedDate]
  );

  const getHabitsByGoalId = useCallback(
    (goalId: string): Habit[] => {
      if (!goalId) return [];
      return habits.filter(
        (habit) => habit.linkedGoals && Array.isArray(habit.linkedGoals) && habit.linkedGoals.includes(goalId)
      );
    },
    [habits]
  );

  const isSkippedOnDate = useCallback(
    (habit: Habit, date: DateString): boolean => {
      return HabitCompletionManager.isSkippedOnDate(completions, habit.id, date);
    },
    [completions]
  );

  const getHabitsWithMetadata = useCallback(
    (date: DateString = selectedDate, showAll = false): HabitWithMetadata[] => {
      const today = DateUtils.getCurrentDateString();
      const weekStart = DateUtils.getWeekStart();
      const weekEnd = DateUtils.getWeekEnd();
      const monthStart = DateUtils.getMonthStart();
      const monthEnd = DateUtils.getMonthEnd();
      const displayedHabits = showAll ? habits : getHabitsForDate(selectedDate);

      return displayedHabits.map((habit) => {
        const status = HabitScheduler.getHabitStatusForDate(habit, completions, date);

        // Calculate completions for this week
        const weekDates = DateUtils.getDateRange(weekStart, weekEnd);
        const completionsThisWeek = weekDates.filter(
          (d) =>
            HabitCompletionManager.isCompletedOnDate(completions, habit.id, d) &&
            !HabitCompletionManager.isSkippedOnDate(completions, habit.id, d)
        ).length;

        // Calculate completions for this month
        const monthDates = DateUtils.getDateRange(monthStart, monthEnd);
        const completionsThisMonth = monthDates.filter(
          (d) =>
            HabitCompletionManager.isCompletedOnDate(completions, habit.id, d) &&
            !HabitCompletionManager.isSkippedOnDate(completions, habit.id, d)
        ).length;

        // Calculate completion rate
        const startDate = habit.startDate || habit.createdAt;
        const datesSinceStart = DateUtils.getDateRange(startDate, today);
        const scheduledDays = datesSinceStart.filter((d) =>
          HabitFrequencyManager.shouldCompleteOnDate(habit.frequency, d, startDate)
        ).length;
        const actualCompletions = HabitStatsCalculator.getActualCompletions(habit, completions);
        const completionRate = scheduledDays > 0 ? Math.round((actualCompletions / scheduledDays) * 100) : 0;

        // Calculate streak data from completions
        const habitStats = HabitCompletionManager.calculateHabitStats(completions, habit);
        const actualCompletionsCount = HabitStatsCalculator.getActualCompletions(habit, completions);

        // Find last completed date
        const habitCompletions = HabitCompletionManager.getHabitCompletions(completions, habit.id);
        const completedRecords = habitCompletions
          .filter((r) => r.completed && !r.skipped)
          .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
        const lastCompletedAt = completedRecords.length > 0 ? completedRecords[0].completedAt : null;

        return {
          ...habit,
          frequencySummary: HabitFrequencyManager.describe(habit.frequency),
          actualAmount: status.actualAmount,
          currentStreak: habitStats.streak || 0,
          longestStreak: habitStats.bestStreak || 0,
          completionRate,
          totalCompletions: actualCompletionsCount,
          lastCompletedAt,
          completionsThisWeek,
          completionsThisMonth
        };
      });
    },
    [habits, completions, selectedDate]
  );

  // ============================================================================
  // HABIT SELECTION
  // ============================================================================

  const handleHabitSelect = useCallback((habitId: string | null): void => {
    if (!habitId) {
      setSelectedHabitId(null);
      return;
    }
    if (typeof habitId === 'string') {
      setSelectedHabitId(habitId);
      return;
    }
    setSelectedHabitId(null);
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const stats = useMemo(
    () => HabitStatsCalculator.calculate(habits, completions, selectedDate),
    [habits, completions, selectedDate]
  );

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    habits,
    completions,
    stats,
    selectedDate,
    selectedHabit,
    isLoading,
    refreshHabits: loadInitialData,
    handleSaveHabit,
    handleDeleteHabit,
    handleDateSelect,
    getHabitsForDate,
    toggleHabitCompletion,
    setHabitCompletion,
    getHabitById,
    getHabitsByGoalId,
    getHabitsWithMetadata,
    isSkippedOnDate,
    handleHabitSelect
  };
}
