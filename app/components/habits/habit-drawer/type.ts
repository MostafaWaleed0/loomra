import { Habit, HabitFormData } from '@/lib/types';

export interface ValidationErrors extends Partial<Habit> {
  general?: string;
}

export interface HabitFormSubComponentProps {
  habitForm: HabitFormData;
  updateField: (field: string) => (value: any) => void;
  validationErrors: ValidationErrors;
}
