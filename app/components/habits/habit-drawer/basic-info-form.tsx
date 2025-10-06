import { ValidatedInput } from '@/components/form/validated-input';
import { ValidatedSelect } from '@/components/form/validated-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FORM_STYLES, HABIT_CONFIG, SYSTEM_CONSTANTS } from '@/lib/core';
import { AlertCircle, Sparkles, Target } from 'lucide-react';
import type { HabitFormSubComponentProps } from './type';

export function BasicInfoForm({ habitForm, updateField, validationErrors }: HabitFormSubComponentProps) {
  return (
    <Card className="border-0 shadow-none bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="size-5 text-purple-500" aria-hidden="true" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ValidatedInput
          id="habit-name"
          label="Habit Name"
          value={habitForm.name ?? ''}
          onChange={updateField('name')}
          placeholder="e.g., Morning Exercise"
          maxLength={SYSTEM_CONSTANTS.VALIDATION.MAX_NAME_LENGTH}
          error={validationErrors.name}
          required
        />
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="daily-target" className="flex items-center gap-2">
              <Target className="size-4" aria-hidden="true" />
              Daily Target
            </Label>
            <Input
              id="daily-target"
              type="number"
              value={habitForm.targetAmount ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('targetAmount')(Number(e.target.value))}
              className="h-12 text-base"
              min={SYSTEM_CONSTANTS.VALIDATION.MIN_TARGET_AMOUNT}
              max={SYSTEM_CONSTANTS.VALIDATION.MAX_TARGET_AMOUNT}
              required
              aria-required="true"
            />
            {validationErrors.targetAmount && (
              <div className={FORM_STYLES.error}>
                <AlertCircle className="size-3" />
                {validationErrors.targetAmount}
              </div>
            )}
          </div>
          <ValidatedSelect
            id="unit-select"
            label="Unit"
            value={habitForm.unit ?? ''}
            onValueChange={updateField('unit')}
            placeholder="Select unit"
            options={HABIT_CONFIG.UNITS}
            error={validationErrors.unit}
          />
        </div>
      </CardContent>
    </Card>
  );
}
