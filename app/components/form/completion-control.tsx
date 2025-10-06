import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { HabitFormManager } from '@/lib/core';
import { HabitCompletionManager } from '@/lib/habit';
import type { DateString, Habit, HabitCompletion } from '@/lib/types';
import { Minus, Plus } from 'lucide-react';
import { useMemo } from 'react';

interface CompletionData {
  currentAmount: number;
  isCompleted: boolean;
  targetAmount: number;
  record: HabitCompletion | null;
}

export interface CompletionControlProps {
  completions: HabitCompletion[];
  habit: Habit;
  selectedDate: DateString;
  onSetHabitCompletion: (habitId: string, date: string, completed: boolean, data?: any) => void;
}

export function CompletionControl({ completions, habit, selectedDate, onSetHabitCompletion }: CompletionControlProps) {
  const completionData = useMemo<CompletionData>(() => {
    const record = HabitCompletionManager.getRecord(completions, habit.id, selectedDate);
    const currentAmount = Math.min(record?.actualAmount || 0, habit.targetAmount);
    const isCompleted = record?.completed || false;
    const targetAmount = habit.targetAmount || 1;
    return { currentAmount, isCompleted, targetAmount, record };
  }, [completions, habit.id, habit.targetAmount, selectedDate]);

  const handlers = useMemo(
    () => HabitFormManager.createCompletionHandlers(habit, completions, selectedDate, onSetHabitCompletion),
    [habit, completions, selectedDate, onSetHabitCompletion]
  );

  const { currentAmount, isCompleted, targetAmount } = completionData;

  return (
    <div>
      {targetAmount > 1 ? (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlers.decrement} disabled={currentAmount <= 0} className="size-6">
            <Minus />
          </Button>
          <div className="flex items-center gap-2 min-w-[80px] justify-center">
            <span className="font-semibold">
              {currentAmount}/{targetAmount}
            </span>
            <span className="text-xs text-muted-foreground capitalize">{habit.unit}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handlers.increment}
            disabled={currentAmount >= targetAmount}
            className="size-6"
          >
            <Plus />
          </Button>
        </div>
      ) : (
        <Checkbox checked={isCompleted} onCheckedChange={handlers.toggle} className="scale-125" />
      )}
    </div>
  );
}
