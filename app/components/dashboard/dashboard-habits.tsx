import { DateUtils } from '@/lib/core';
import type { CompletionRecord, DateString, HabitCompletion, HabitWithMetadata } from '@/lib/types';
import { Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DashboardHabitList } from './dashboard-habit-list';

interface DashboardHabitsProps {
  completions: HabitCompletion[];
  getHabitsWithMetadata: (date?: DateString) => HabitWithMetadata[];
  onSetHabitCompletion: (
    habitId: string,
    date: DateString,
    completed: boolean,
    additionalData?: Partial<CompletionRecord>
  ) => Promise<void>;
}

export function DashboardHabits({ completions, getHabitsWithMetadata, onSetHabitCompletion }: DashboardHabitsProps) {
  const today = DateUtils.formatDate(new Date());
  const habitsWithMetadata = getHabitsWithMetadata(today);
  const canModifyCompletion = !DateUtils.isFutureDate(today);

  return (
    <Card className="h-fit">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Zap className="size-6 text-primary" />
          Today's Habit Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {habitsWithMetadata.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
            <Zap className="size-8 text-primary mb-1" />
            <p className="text-lg font-semibold">No habits scheduled for today</p>
            <p className="text-sm">Create a new habit to get started!</p>
          </div>
        ) : (
          <DashboardHabitList
            habits={habitsWithMetadata}
            completions={completions}
            canModifyCompletion={canModifyCompletion}
            onSetHabitCompletion={onSetHabitCompletion}
            today={today}
          />
        )}
      </CardContent>
    </Card>
  );
}
