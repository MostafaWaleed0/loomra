'use client';

import { ErrorFound } from '@/components/form/error-found';
import { ValidatedTextarea } from '@/components/form/validated-textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DateUtils, HABIT_CONFIG, HabitFormManager, SYSTEM_CONSTANTS, UI_CONFIG, WEEK_DAYS } from '@/lib/core';
import { HabitFactory, HabitFrequencyManager } from '@/lib/habit';
import type { FrequencyConfig, GoalWithStats, Habit, HabitFormData } from '@/lib/types';
import { PenTool, Save, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BasicInfoForm } from './basic-info-form';
import { FrequencySelector } from './frequency-selector';
import { GoalSection } from './goal-section';
import { SettingsForm } from './settings-form';
import { StyleForm } from './style-form';
import type { ValidationErrors } from './type';

interface HabitDrawerViewProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: HabitFormData | null, existingHabit: Habit | null) => Promise<Habit>;
  habitData: Habit | null;
  availableGoals: GoalWithStats[];
}

type FieldUpdater = (fieldName: string) => (value: any) => void;

export function HabitDrawerView({ isOpen, onClose, onSave, habitData, availableGoals }: HabitDrawerViewProps): JSX.Element {
  const [habitForm, setHabitForm] = useState<HabitFormData>(createDefaultHabitForm);
  const [frequencyConfig, setFrequencyConfig] = useState<FrequencyConfig>(HabitFormManager.getDefaultFrequencyConfig);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const errorCount = Object.values(validationErrors).filter(Boolean).length;
  const hasErrors = errorCount > 0;

  // ============================================================================
  // FORM CREATION
  // ============================================================================

  function createDefaultHabitForm(): HabitFormData {
    const defaultDailyFrequency = {
      type: HABIT_CONFIG.FREQUENCIES.DAILY,
      value: WEEK_DAYS.map((day) => day.key)
    };

    return {
      name: 'Untitled habit',
      category: HABIT_CONFIG.CATEGORIES[0],
      icon: 'Activity',
      color: UI_CONFIG.COLORS.ALL[0].value,
      targetAmount: HABIT_CONFIG.DEFAULTS.TARGET_AMOUNT,
      unit: HABIT_CONFIG.UNITS[0],
      frequency: defaultDailyFrequency,
      startDate: DateUtils.getCurrentDateString(),
      reminder: HABIT_CONFIG.DEFAULTS.REMINDER,
      linkedGoals: [],
      notes: '',
      priority: HABIT_CONFIG.PRIORITIES[1]
    };
  }

  // ============================================================================
  // FIELD VALIDATION & UPDATES
  // ============================================================================

  function createValidatedFieldUpdater(field: keyof HabitFormData): (value: any) => void {
    return (value: any) => {
      const validator = HabitFactory.validators[field];
      if (validator) {
        const result = validator(value);
        setHabitForm((prev) => ({ ...prev, [field]: result.value }));
        setValidationErrors((prev) => ({
          ...prev,
          [field]: result.isValid ? undefined : result.error
        }));
      } else {
        setHabitForm((prev) => ({ ...prev, [field]: value }));
      }
    };
  }

  function updateField(): FieldUpdater {
    const updaters: Record<string, (value: any) => void> = {};
    const validatableFields: (keyof HabitFormData)[] = [
      'name',
      'targetAmount',
      'category',
      'unit',
      'priority',
      'notes',
      'icon',
      'color',
      'startDate',
      'linkedGoals',
      'frequency',
      'reminder'
    ];

    validatableFields.forEach((field) => {
      updaters[field] = createValidatedFieldUpdater(field);
    });

    return (fieldName: string) =>
      updaters[fieldName] || ((value: any) => setHabitForm((prev) => ({ ...prev, [fieldName]: value })));
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  function handleClose(): void {
    if (!habitData) {
      setHabitForm(createDefaultHabitForm());
      setFrequencyConfig(HabitFormManager.getDefaultFrequencyConfig());
    }
    setValidationErrors({});
    onClose();
  }

  function handleSave(): void {
    const formValidation = HabitFactory.validateForm(habitForm);
    if (!formValidation.isValid) {
      const errorMap = formValidation.errors.reduce(
        (acc, { field, error }) => ({ ...acc, [field]: error }),
        {} as ValidationErrors
      );
      setValidationErrors(errorMap);
      return;
    }

    const completeHabitData: HabitFormData = {
      ...formValidation.validated,
      frequency: habitForm.frequency,
      reminder: {
        enabled: Boolean(habitForm.reminder?.enabled),
        time: formValidation.validated.reminder?.time || habitForm.reminder?.time || HABIT_CONFIG.DEFAULTS.REMINDER.time
      }
    };

    const habitToSave = HabitFactory.create(completeHabitData, habitData || undefined);
    if (!habitToSave) {
      setValidationErrors({ general: 'Failed to create valid habit. Please check your inputs.' });
      return;
    }

    onSave(habitToSave, habitData);
    handleClose();
  }

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (habitData) {
      const formValidation = HabitFactory.validateForm(habitData);
      if (!formValidation.isValid) {
        const errorMap = formValidation.errors.reduce(
          (acc, { field, error }) => ({ ...acc, [field]: error }),
          {} as ValidationErrors
        );
        setValidationErrors(errorMap);
      }

      const existingFrequency = habitData.frequency || HabitFrequencyManager.createDefaultFrequency();
      setHabitForm({
        ...formValidation.validated,
        frequency: existingFrequency,
        reminder: {
          enabled: Boolean(habitData.reminder?.enabled),
          time: habitData.reminder?.time || HABIT_CONFIG.DEFAULTS.REMINDER.time
        }
      });
      setFrequencyConfig(HabitFormManager.initializeFrequencyFromHabit(existingFrequency));
    } else {
      setHabitForm(createDefaultHabitForm());
      setFrequencyConfig(HabitFormManager.getDefaultFrequencyConfig());
      setValidationErrors({});
    }
  }, [habitData]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full max-w-4xl overflow-hidden p-0 sm:max-w-4xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-8 py-6 border-b-3">
            <SheetHeader>
              <SheetTitle className="text-2xl font-bold flex items-center gap-3 text-secondary-foreground">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Sparkles className="size-6" />
                </div>
                {habitData ? 'Edit Habit' : 'Create New Habit'}
              </SheetTitle>
            </SheetHeader>
            <p className="text-secondary-foreground mt-2">Design your perfect habit with advanced customization options</p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                <BasicInfoForm habitForm={habitForm} updateField={updateField()} validationErrors={validationErrors} />
                <FrequencySelector
                  habitForm={habitForm}
                  setHabitForm={setHabitForm}
                  frequencyConfig={frequencyConfig}
                  setFrequencyConfig={setFrequencyConfig}
                  updateField={updateField()}
                  validationErrors={validationErrors}
                />
                <SettingsForm habitForm={habitForm} updateField={updateField()} validationErrors={validationErrors} />
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                <GoalSection
                  habitForm={habitForm}
                  availableGoals={availableGoals}
                  updateField={updateField()}
                  validationErrors={validationErrors}
                />
                <StyleForm habitForm={habitForm} updateField={updateField()} validationErrors={validationErrors} />
                <Card className="border-0 shadow-none bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <PenTool className="size-5 text-slate-500" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ValidatedTextarea
                      id="goal-notes"
                      label=""
                      value={habitForm.notes || ''}
                      onChange={updateField()('notes')}
                      placeholder="Enter goal description"
                      maxLength={SYSTEM_CONSTANTS.VALIDATION.MAX_NOTE_LENGTH}
                      error={validationErrors.notes}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-secondary">
            <div className="flex justify-between items-center">
              <ErrorFound errorCount={errorCount} hasErrors={hasErrors} />
              <div className="flex justify-end gap-4 ml-auto">
                <Button variant="outline" size="lg" onClick={handleClose} aria-label="Cancel">
                  <X className="size-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  size="lg"
                  disabled={hasErrors}
                  aria-label={habitData ? 'Update Habit' : 'Create Habit'}
                >
                  <Save className="size-4 mr-2" />
                  {habitData ? 'Update Habit' : 'Create Habit'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
