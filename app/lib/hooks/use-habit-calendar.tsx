import { useCallback, useEffect, useMemo, useState } from 'react';
import { EDITABLE_STATUSES, FORM_INITIALIZE_STATUSES, UI_CONFIG } from '../core/constants';
import { DateUtils } from '../core/date-utils';
import { HabitFormManager, HabitStatusManager } from '../habit';
import { HabitCompletionManager } from '../habit/completion-system';
import { cn } from '../utils';
import type {
  Habit,
  HabitCompletion,
  DateString,
  HabitStatus,
  StatusMessage,
  CalendarModifiers,
  CompletionRecord,
  MoodValue,
  DifficultyValue
} from '../types';

// ---- Edit Form Data State Interface ----
interface EditFormDataState {
  completed: boolean;
  actualAmount: number;
  note: string;
  mood: MoodValue | null;
  difficulty: DifficultyValue | null;
  skipped: boolean;
}

// ---- Internal Hook: Edit Form Management ----
function useEditFormData(habit: Habit, completions: HabitCompletion[], selectedDate: DateString, canEditDay: boolean) {
  const [editFormData, setEditFormData] = useState<EditFormDataState>(() => HabitFormManager.createEditDataState());

  useEffect(() => {
    try {
      if (!canEditDay) {
        setEditFormData(HabitFormManager.createEditDataState());
        return;
      }

      const record = HabitCompletionManager.getRecord(completions, habit.id, selectedDate);
      const initialData = HabitFormManager.initializeEditDataFromRecord(record);
      setEditFormData(initialData);
    } catch (error) {
      console.error('Failed to initialize edit form data:', error);
      setEditFormData(HabitFormManager.createEditDataState());
    }
  }, [completions, selectedDate, canEditDay, habit.id]);

  const initializeFormData = useCallback(
    (dateString: DateString): EditFormDataState => {
      try {
        const status = HabitStatusManager.getDayStatus(habit, completions, dateString);

        if (FORM_INITIALIZE_STATUSES.includes(status as any)) {
          const record = HabitCompletionManager.getRecord(completions, habit.id, dateString);
          return HabitFormManager.initializeEditDataFromRecord(record);
        }

        return HabitFormManager.createEditDataState();
      } catch (error) {
        console.error('Failed to initialize form data for date:', dateString, error);
        return HabitFormManager.createEditDataState();
      }
    },
    [habit, completions]
  );

  return { editFormData, setEditFormData, initializeFormData };
}

// ---- Internal Hook: Calendar Modifiers ----
function useCalendarModifiers(habit: Habit, completions: HabitCompletion[]) {
  const modifiers = useMemo<CalendarModifiers>(() => {
    try {
      return HabitStatusManager.createCalendarModifiers(habit, completions);
    } catch (error) {
      console.error('Failed to create calendar modifiers:', error);
      return { completed: [], missed: [], skipped: [], periodCompleted: [] };
    }
  }, [habit, completions]);

  const modifierClasses = useMemo<Record<string, string>>(
    () => ({
      completed: cn(UI_CONFIG.CALENDAR_STYLES.DEFAULT_BUTTON, UI_CONFIG.CALENDAR_STYLES.MODIFIERS.completed),
      missed: cn(UI_CONFIG.CALENDAR_STYLES.DEFAULT_BUTTON, UI_CONFIG.CALENDAR_STYLES.MODIFIERS.missed),
      scheduled: cn(UI_CONFIG.CALENDAR_STYLES.DEFAULT_BUTTON, UI_CONFIG.CALENDAR_STYLES.MODIFIERS.scheduled),
      skipped: cn(UI_CONFIG.CALENDAR_STYLES.DEFAULT_BUTTON, UI_CONFIG.CALENDAR_STYLES.MODIFIERS.skipped),
      periodCompleted: cn(UI_CONFIG.CALENDAR_STYLES.DEFAULT_BUTTON, UI_CONFIG.CALENDAR_STYLES.MODIFIERS.periodCompleted)
    }),
    []
  );

  return { modifiers, modifierClasses };
}

// ---- Hook Return Type ----
interface UseHabitCalendarReturn {
  editFormData: EditFormDataState;
  currentMonth: DateString;
  statusInfo: StatusMessage;
  canEditDay: boolean;
  calendarModifiers: CalendarModifiers;
  calendarModifierClasses: Record<string, string>;
  handleDaySelect: (date: Date) => void;
  handleGoToToday: () => void;
  updateFormField: <K extends keyof EditFormDataState>(field: K, value: EditFormDataState[K]) => void;
  handleSaveCompletion: () => void;
  setCurrentMonth: (month: DateString) => void;
}

// ---- Main Hook ----
export function useHabitCalendar(
  habit: Habit,
  completions: HabitCompletion[],
  selectedDate: DateString,
  onDateChange: (date: DateString) => void,
  onSetHabitCompletion?: (
    habitId: string,
    date: DateString,
    completed: boolean,
    additionalData?: Partial<CompletionRecord>
  ) => void
): any {
  const [visibleMonth, setVisibleMonth] = useState<Date>(() =>
    selectedDate ? DateUtils.createDateFromString(selectedDate) : new Date()
  );

  useEffect(() => {
    if (selectedDate) {
      const newDate = DateUtils.createDateFromString(selectedDate);
      setVisibleMonth(newDate);
    }
  }, [selectedDate]);

  // ---- Computed Values ----
  const dayStatus = useMemo<HabitStatus>(
    () => HabitStatusManager.getDayStatus(habit, completions, selectedDate),
    [habit, completions, selectedDate]
  );

  const statusInfo = useMemo<StatusMessage>(
    () =>
      HabitStatusManager.getStatusMessage(dayStatus, habit) || {
        title: 'Unknown Status',
        description: 'Status information unavailable',
        variant: 'default' as const
      },
    [dayStatus, habit]
  );

  const canEditDay = useMemo<boolean>(() => EDITABLE_STATUSES.includes(dayStatus as any), [dayStatus]);

  // ---- Internal Hooks ----
  const { editFormData, setEditFormData, initializeFormData } = useEditFormData(habit, completions, selectedDate, canEditDay);
  const { modifiers: calendarModifiers, modifierClasses: calendarModifierClasses } = useCalendarModifiers(habit, completions);

  // ---- Event Handlers ----
  const handleDaySelect = useCallback(
    (date: Date) => {
      try {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
          console.error('Invalid date provided to handleDaySelect:', date);
          return;
        }
        const dateString = DateUtils.formatDate(date);
        onDateChange(dateString);
        setVisibleMonth(date);
        setEditFormData(initializeFormData(dateString));
      } catch (error) {
        console.error('Failed to handle day selection:', error);
      }
    },
    [onDateChange, initializeFormData, setEditFormData]
  );

  const updateFormField = useMemo(() => HabitFormManager.createFieldUpdater(setEditFormData), [setEditFormData]);

  const handleSaveCompletion = useCallback(() => {
    try {
      if (!canEditDay || !onSetHabitCompletion) return;
      const completionData: Partial<CompletionRecord> = {
        actualAmount: editFormData.actualAmount,
        note: editFormData.note,
        mood: editFormData.mood,
        difficulty: editFormData.difficulty,
        skipped: editFormData.skipped
      };
      onSetHabitCompletion(habit.id, selectedDate, editFormData.completed, completionData);
    } catch (error) {
      console.error('Failed to save completion:', error);
    }
  }, [canEditDay, onSetHabitCompletion, habit.id, selectedDate, editFormData]);

  return {
    editFormData,
    visibleMonth,
    statusInfo,
    canEditDay,
    calendarModifiers,
    calendarModifierClasses,
    handleDaySelect,
    updateFormField,
    setVisibleMonth,
    handleSaveCompletion
  };
}
