'use client';

import { DatePicker } from '@/components/form/date-picker';
import { ValidatedSelect } from '@/components/form/validated-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateUtils } from '@/lib/core';
import { HABIT_CONFIG } from '@/lib/core/constants';
import { DateString } from '@/lib/types';
import { AlertCircle, Boxes, Clock, Tag } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { HabitFormSubComponentProps } from './type';

export function SettingsForm({ habitForm, updateField, validationErrors }: HabitFormSubComponentProps) {
  function handleDateSelect(date: Date | undefined): void {
    updateField('startDate')(DateUtils.formatDate(date ?? '') as DateString);
  }

  function handleReminderToggle(checked: boolean): void {
    updateField('reminder')({ ...habitForm.reminder, enabled: checked });
  }

  function handleReminderTimeChange(event: ChangeEvent<HTMLInputElement>): void {
    updateField('reminder')({ ...habitForm.reminder, time: event.target.value });
  }

  function getSelectedDate(): Date | undefined {
    return habitForm.startDate ? DateUtils.createDateFromString(habitForm.startDate) : undefined;
  }

  return (
    <Card className="border-0 shadow-none bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Tag className="size-5 text-emerald-500" aria-hidden="true" />
          Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DatePicker
          id="start-date"
          label="Start Date"
          date={getSelectedDate()}
          onSelect={handleDateSelect}
          placeholder="Select Date"
          error={validationErrors.startDate}
          mode="full"
          showActions={false}
        />
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reminder"
              checked={habitForm.reminder.enabled}
              onCheckedChange={handleReminderToggle}
              className="border-ring"
              aria-describedby="reminder-label"
            />
            <Label id="reminder-label" htmlFor="reminder" className="flex items-center gap-2">
              <Clock className="size-4" aria-hidden="true" />
              Enable Reminder
            </Label>
          </div>
          {habitForm.reminder.enabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="time-picker">Reminder Time</Label>
                {validationErrors.reminder?.time && (
                  <div className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {validationErrors.reminder.time}
                  </div>
                )}
              </div>
              <Input
                type="time"
                id="time-picker"
                value={habitForm.reminder.time || HABIT_CONFIG.DEFAULTS.REMINDER.time}
                onChange={handleReminderTimeChange}
                className="h-12"
                required
              />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <ValidatedSelect
            id="habit-category"
            label="Category"
            icon={<Boxes strokeWidth={1} className="size-4" aria-hidden="true" />}
            value={habitForm.category ?? ''}
            onValueChange={updateField('category')}
            placeholder="Select priority"
            options={HABIT_CONFIG.CATEGORIES}
            error={validationErrors.category}
          />
          <ValidatedSelect
            id="habit-priority"
            label="Priority"
            value={habitForm.priority ?? ''}
            icon={<Tag strokeWidth={1} className="size-4" aria-hidden="true" />}
            onValueChange={updateField('priority')}
            placeholder="Select priority"
            options={HABIT_CONFIG.PRIORITIES}
            error={validationErrors.priority}
          />
        </div>
      </CardContent>
    </Card>
  );
}
