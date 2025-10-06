import { useState } from 'react';
import { GoalFactory } from '@/lib/goal/goal-factory';
import type { Goal, GoalFormData } from '@/lib/types';

export interface UseGoalFormReturn {
  formData: GoalFormData;
  validationErrors: Record<string, string>;
  hasErrors: boolean;
  updateField: (fieldName: keyof GoalFormData) => (value: any) => void;
  validateForm: () => boolean;
  resetForm: (data?: Partial<Goal> | Goal | null) => void;
  setFormData: React.Dispatch<React.SetStateAction<GoalFormData>>;
}

export const useGoalForm = (initialData: Partial<Goal> | Goal | null = null): UseGoalFormReturn => {
  const [formData, setFormData] = useState<GoalFormData>(() => {
    if (initialData) {
      return {
        ...initialData
      } as GoalFormData;
    }
    const newGoal = GoalFactory.create({ title: 'New Goal' });
    if (!newGoal) throw new Error('Failed to create initial goal');
    return {
      ...newGoal
    } as GoalFormData;
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const updateField = (fieldName: keyof GoalFormData) => (value: any) => {
    const validator = GoalFactory.validators?.[fieldName as keyof typeof GoalFactory.validators];
    if (validator) {
      const result = validator(value);
      setFormData((prev) => ({ ...prev, [fieldName]: result.value }));
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        if (result.error) {
          newErrors[fieldName] = result.error;
        } else {
          delete newErrors[fieldName];
        }
        return newErrors;
      });
      return;
    }
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const validation = GoalFactory.validateForm(formData);
    if (!validation.isValid) {
      const errorMap = validation.errors.reduce<Record<string, string>>((acc, { field, error }) => {
        acc[field] = error;
        return acc;
      }, {});
      setValidationErrors(errorMap);
      return false;
    }
    setValidationErrors({});
    return true;
  };

  const resetForm = (data: Partial<Goal> | Goal | null = null): void => {
    if (!data) {
      const newGoal = GoalFactory.create({ title: 'New Goal' });
      if (newGoal) {
        setFormData({
          ...newGoal
        } as GoalFormData);
        setValidationErrors({});
      }
      return;
    }
    if ((data as Goal).id) {
      setFormData({
        ...data
      } as GoalFormData);
      setValidationErrors({});
      return;
    }
    const newGoal = GoalFactory.create({ title: 'New Goal', ...data });
    if (newGoal) {
      setFormData({
        ...newGoal,
        progress: 0
      } as GoalFormData);
      setValidationErrors({});
    }
  };

  const hasErrors = Object.values(validationErrors).some(Boolean);

  return {
    formData,
    validationErrors,
    hasErrors,
    updateField,
    validateForm,
    resetForm,
    setFormData
  };
};
