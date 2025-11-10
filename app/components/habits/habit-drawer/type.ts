import { Habit, HabitFormData } from '@/lib/types';

export interface ValidationErrors extends Partial<Habit> {
  general?: string;
}

export interface HabitFormSubComponentProps {
  habitForm: HabitFormData;
  updateField: (field: keyof HabitFormData) => (value: any) => void;
  validationErrors: ValidationErrors;
}
