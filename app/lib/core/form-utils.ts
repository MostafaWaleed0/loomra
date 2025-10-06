// core/form-utils.ts
import { HabitCompletionManager } from '../habit/completion-system';
import { WEEK_DAYS, HABIT_CONFIG } from './constants';
import { Habit, HabitCompletion } from '../types';

export class HabitFormManager {
  static getDefaultFrequencyConfig() {
    return {
      selectedDays: WEEK_DAYS.map((d) => d.key),
      intervalDays: 2,
      repetitionsPerPeriod: 3,
      period: 'week' as const,
      specificDates: [] as number[]
    };
  }

  static initializeFrequencyFromHabit(habitFrequency: any) {
    if (!habitFrequency) return this.getDefaultFrequencyConfig();

    const freq = habitFrequency;
    return {
      selectedDays: freq.type === HABIT_CONFIG.FREQUENCIES.DAILY ? freq.value || [] : [],
      intervalDays: freq.type === HABIT_CONFIG.FREQUENCIES.INTERVAL ? freq.value?.interval || 2 : 2,
      repetitionsPerPeriod: freq.type === HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD ? freq.value?.repetitionsPerPeriod || 3 : 3,
      period: freq.type === HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD ? freq.value?.period || 'week' : 'week',
      specificDates: freq.type === HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES ? freq.value || [] : []
    };
  }

  static createEditDataState() {
    return {
      completed: false,
      actualAmount: 0,
      note: '',
      mood: null,
      difficulty: null,
      skipped: false
    };
  }

  static initializeEditDataFromRecord(record: HabitCompletion | null): any {
    return {
      completed: record?.completed ?? false,
      actualAmount: record?.actualAmount ?? 0,
      note: record?.note ?? '',
      mood: record?.mood ?? null,
      difficulty: record?.difficulty ?? null,
      skipped: record?.skipped ?? false
    };
  }

  static createFieldUpdater<T>(setState: React.Dispatch<React.SetStateAction<T>>) {
    return (field: keyof T) => (value: any) => {
      setState((prev) => ({ ...prev, [field]: value }));
    };
  }

  static toggleArrayItem<T>(array: T[], item: T, add: boolean): T[] {
    return add ? [...array, item] : array.filter((i) => i !== item);
  }

  static createCompletionHandlers(
    habit: Habit,
    completions: HabitCompletion[],
    dateString: string,
    onSetHabitCompletion: (habitId: string, date: string, completed: boolean, data: any) => void
  ) {
    const currentRecord = HabitCompletionManager.getRecord(completions, habit.id, dateString);
    const currentAmount = currentRecord?.actualAmount || 0;
    const targetAmount = habit.targetAmount;
    const isCurrentlySkipped = currentRecord?.skipped || false;

    return {
      increment: () => {
        const newAmount = Math.min(currentAmount + 1, targetAmount);
        const completed = newAmount >= targetAmount;

        onSetHabitCompletion(habit.id, dateString, completed, {
          actualAmount: newAmount,
          note: currentRecord?.note || '',
          mood: currentRecord?.mood || null,
          difficulty: currentRecord?.difficulty || null,
          skipped: false
        });
      },

      decrement: () => {
        const newAmount = Math.max(currentAmount - 1, 0);
        const completed = newAmount >= targetAmount;

        const additionalData = {
          actualAmount: newAmount,
          note: currentRecord?.note || '',
          mood: currentRecord?.mood || null,
          difficulty: currentRecord?.difficulty || null,
          skipped: false
        };

        onSetHabitCompletion(habit.id, dateString, completed, additionalData);
      },

      toggle: () => {
        const isCurrentlyCompleted = (currentRecord?.completed && !currentRecord?.skipped) || false;
        const newCompleted = !isCurrentlyCompleted;

        if (newCompleted) {
          onSetHabitCompletion(habit.id, dateString, true, {
            actualAmount: targetAmount,
            note: currentRecord?.note || '',
            mood: currentRecord?.mood || null,
            difficulty: currentRecord?.difficulty || null,
            skipped: false
          });
        } else {
          onSetHabitCompletion(habit.id, dateString, false, {
            actualAmount: 0,
            note: currentRecord?.note || '',
            mood: currentRecord?.mood || null,
            difficulty: currentRecord?.difficulty || null,
            skipped: false
          });
        }
      },

      markComplete: () => {
        onSetHabitCompletion(habit.id, dateString, true, {
          actualAmount: targetAmount,
          note: currentRecord?.note || '',
          mood: currentRecord?.mood || null,
          difficulty: currentRecord?.difficulty || null,
          skipped: false
        });
      },

      markIncomplete: () => {
        onSetHabitCompletion(habit.id, dateString, false, {
          actualAmount: 0,
          note: currentRecord?.note || '',
          mood: currentRecord?.mood || null,
          difficulty: currentRecord?.difficulty || null,
          skipped: false
        });
      },

      toggleSkip: () => {
        const newSkipped = !isCurrentlySkipped;

        onSetHabitCompletion(habit.id, dateString, false, {
          actualAmount: newSkipped ? 0 : currentAmount,
          note: currentRecord?.note || '',
          mood: currentRecord?.mood || null,
          difficulty: currentRecord?.difficulty || null,
          skipped: newSkipped
        });
      },

      save: (editData: any) => {
        onSetHabitCompletion(habit.id, dateString, editData.completed, {
          actualAmount: editData.actualAmount,
          note: editData.note,
          mood: editData.mood,
          difficulty: editData.difficulty,
          skipped: editData.skipped
        });
      }
    };
  }
}
