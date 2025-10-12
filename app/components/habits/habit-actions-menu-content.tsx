import React from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { HabitFormManager } from '@/lib/core';
import { HabitCompletionManager } from '@/lib/habit';
import type { DateString, Habit, HabitCompletion } from '@/lib/types';
import { Calendar, CheckCircle, RotateCcw, XCircle } from 'lucide-react';

interface HabitActionsMenuContentProps {
  habit: Habit;
  completions: HabitCompletion[];
  selectedDate: DateString;
  onSetHabitCompletion: (habitId: string, date: DateString, completed: boolean, data?: any) => void;
  canModifyCompletion: boolean;
}

export const HabitActionsMenuContent = React.memo<HabitActionsMenuContentProps>(
  ({ habit, completions, selectedDate, onSetHabitCompletion, canModifyCompletion }) => {
    const completionRecord = HabitCompletionManager.getRecord(completions, habit.id, selectedDate);
    const completionActions = HabitFormManager.createCompletionHandlers(habit, completions, selectedDate, onSetHabitCompletion);

    return (
      <>
        {/* Completion Actions */}
        {canModifyCompletion && completionActions && (
          <>
            {completionRecord?.completed && !completionRecord?.skipped ? (
              <>
                <DropdownMenuItem onClick={completionActions.markIncomplete} className="text-slate-600 dark:text-slate-400">
                  <RotateCcw className="mr-1 size-4" />
                  Mark Incomplete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={completionActions.toggleSkip} className="text-orange-600 dark:text-orange-400">
                  <Calendar className="mr-1 size-4" />
                  Skip Today
                </DropdownMenuItem>
              </>
            ) : completionRecord?.skipped ? (
              <>
                <DropdownMenuItem onClick={completionActions.toggleSkip} className="text-sky-600 dark:text-sky-400">
                  <RotateCcw className="mr-1 size-4" />
                  Unskip Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={completionActions.markComplete} className="text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="mr-1 size-4" />
                  Mark Complete
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={completionActions.markComplete} className="text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="mr-1 size-4" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={completionActions.toggleSkip} className="text-orange-600 dark:text-orange-400">
                  <XCircle className="mr-1 size-4" />
                  Skip Today
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </>
    );
  }
);
