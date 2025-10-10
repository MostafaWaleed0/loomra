import type { CompletionRecord, DateString, HabitCompletion, HabitWithMetadata } from '@/lib/types';
import { DashboardHabitCard } from './dashboard-habit-card';

interface DashboardHabitListProps {
  habits: HabitWithMetadata[];
  completions: HabitCompletion[];
  today: DateString;
  canModifyCompletion: boolean;
  onSetHabitCompletion: (
    habitId: string,
    date: DateString,
    completed: boolean,
    additionalData?: Partial<CompletionRecord>
  ) => Promise<void>;
}

export function DashboardHabitList({
  habits,
  completions,
  today,
  canModifyCompletion,
  onSetHabitCompletion
}: DashboardHabitListProps) {
  return (
    <>
      {habits.map((habit) => (
        <DashboardHabitCard
          key={habit.id}
          habit={habit}
          completions={completions}
          today={today}
          canModifyCompletion={canModifyCompletion}
          onSetHabitCompletion={onSetHabitCompletion}
        />
      ))}
    </>
  );
}
