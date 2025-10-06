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

    return {
      completed: completedForDate,
      total,
      dueToday,
      percentage,
      totalStreak: habits.reduce((sum, h) => sum + (h.streak || 0), 0),
      bestStreak: Math.max(...habits.map((h) => h.bestStreak || 0), 0),
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
      const daysSinceCreation = Math.max(1, DateUtils.calculateDaysBetween(habit.createdAt));
      const actualCompletions = this.getActualCompletions(habit, completions);
      return sum + actualCompletions / daysSinceCreation;
    }, 0);

    return Math.round((totalAvg / habits.length) * 100);
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
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateString>(DateUtils.getCurrentDateString());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const habitsCacheRef = useRef<Map<string, Habit>>(new Map());

  // ============================================================================
  // INITIAL DATA LOAD
  // ============================================================================

  const loadAllCompletions = useCallback(async (): Promise<HabitCompletion[]> => {
    try {
      const allHabits = await window.electronAPI.habits.getAllHabits();
      const completionPromises = allHabits.map((habit) =>
        window.electronAPI.habitCompletions.getHabitCompletions(habit.id, null, null)
      );
      const completionArrays = await Promise.all(completionPromises);
      return completionArrays.flat();
    } catch (error) {
      console.error('Failed to load completions:', error);
      return [];
    }
  }, []);

  const loadInitialData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const [loadedHabits, allCompletions] = await Promise.all([window.electronAPI.habits.getAllHabits(), loadAllCompletions()]);

      setHabits(loadedHabits);
      setCompletions(allCompletions);
    } catch (error) {
      console.error('Failed to load habits data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadAllCompletions]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const handleSaveHabit = useCallback(
    async (habitData: HabitFormData | null, existingHabit: Habit | null = null): Promise<Habit> => {
      try {
        const normalizedHabit = HabitFactory.create(habitData as HabitFormData, existingHabit || undefined);
        if (!normalizedHabit) throw new Error('Failed to create habit');

        let savedHabit: Habit;
        if (existingHabit) {
          savedHabit = await window.electronAPI.habits.updateHabit(normalizedHabit);
        } else {
          savedHabit = await window.electronAPI.habits.createHabit(normalizedHabit);
        }

        setHabits((prev) => {
          const newHabits = existingHabit
            ? prev.map((habit) => (habit.id === existingHabit.id ? savedHabit : habit))
            : [...prev, savedHabit];
          habitsCacheRef.current.set(savedHabit.id, savedHabit);
          return newHabits;
        });

        if (selectedHabit && existingHabit && selectedHabit.id === existingHabit.id) {
          setSelectedHabit(savedHabit);
        }

        return savedHabit;
      } catch (error) {
        console.error('Failed to save habit:', error);
        throw error;
      }
    },
    [selectedHabit]
  );

  const handleDeleteHabit = useCallback(
    async (habitId: string): Promise<void> => {
      if (!habitId) return;
      try {
        await window.electronAPI.habits.deleteHabit(habitId);
        setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
        setCompletions((prev) => prev.filter((completion) => completion.habitId !== habitId));
        habitsCacheRef.current.delete(habitId);
        if (selectedHabit?.id === habitId) {
          setSelectedHabit(null);
        }
      } catch (error) {
        console.error('Failed to delete habit:', error);
        throw error;
      }
    },
    [selectedHabit]
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
  // COMPLETION OPERATIONS
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

        await window.electronAPI.habits.updateHabit(updatedHabit);

        setHabits((prev) =>
          prev.map((h) => {
            if (h.id === habitId) {
              habitsCacheRef.current.set(habitId, updatedHabit);
              return updatedHabit;
            }
            return h;
          })
        );
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
          savedRecord = await window.electronAPI.habitCompletions.updateHabitCompletion(updatedRecord);
          setCompletions((prev) => prev.map((r) => (r.id === existingRecord.id ? savedRecord : r)));
        } else {
          const newRecord = HabitCompletionManager.createRecord(habitId, date, {
            completed,
            targetAmount: habit.targetAmount,
            ...additionalData
          });
          savedRecord = await window.electronAPI.habitCompletions.createHabitCompletion(newRecord);
          setCompletions((prev) => [...prev, savedRecord]);
        }

        setTimeout(() => updateHabitStats(habitId), 0);
      } catch (error) {
        console.error('Failed to set habit completion:', error);
        throw error;
      }
    },
    [habits, completions, updateHabitStats]
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
    (date: DateString = selectedDate): HabitWithMetadata[] => {
      return habits.map((habit) => {
        const status = HabitScheduler.getHabitStatusForDate(habit, completions, date);
        return {
          ...habit,
          frequencySummary: HabitFrequencyManager.describe(habit.frequency),
          isDueOnDate: status.isScheduled,
          completedOnDate: status.isCompleted,
          actualAmount: status.actualAmount,
          isDueToday: HabitScheduler.shouldCompleteOnDate(habit, completions, DateUtils.getCurrentDateString()),
          completedToday: HabitCompletionManager.isCompletedOnDate(completions, habit.id, DateUtils.getCurrentDateString()),
          skippedOnDate: status.isSkipped,
          skippedToday: HabitCompletionManager.isSkippedOnDate(completions, habit.id, DateUtils.getCurrentDateString()),
          currentStreak: habit.streak || 0,
          longestStreak: habit.bestStreak || 0,
          completionRate: 0,
          totalCompletions: habit.totalCompletions || 0,
          lastCompletedAt: habit.lastCompleted || null,
          completionsThisWeek: 0,
          completionsThisMonth: 0
        };
      });
    },
    [habits, completions, selectedDate]
  );

  // ============================================================================
  // HABIT SELECTION
  // ============================================================================

  const handleHabitSelect = useCallback(
    (habitIdOrHabit: string | Habit | null): void => {
      if (!habitIdOrHabit) {
        setSelectedHabit(null);
        return;
      }
      if (typeof habitIdOrHabit === 'string') {
        const habit = getHabitById(habitIdOrHabit);
        setSelectedHabit(habit);
        return;
      }
      if (habitIdOrHabit.id) {
        const habit = getHabitById(habitIdOrHabit.id);
        setSelectedHabit(habit);
        return;
      }
      setSelectedHabit(null);
    },
    [getHabitById]
  );

  useEffect(() => {
    if (selectedHabit && selectedHabit.id) {
      const updatedHabit = habits.find((h) => h.id === selectedHabit.id);
      if (updatedHabit && updatedHabit.updatedAt !== selectedHabit.updatedAt) {
        setSelectedHabit(updatedHabit);
      }
    }
  }, [habits, selectedHabit]);

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
