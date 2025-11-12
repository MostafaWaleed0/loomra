import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorUtils, FormatUtils, HabitFormManager, UIUtils } from '@/lib/core';
import { GoalWithStats } from '@/lib/types';
import { AlertCircle, Target } from 'lucide-react';
import { useMemo } from 'react';
import { HabitFormSubComponentProps } from './type';

interface GoalSectionProps extends HabitFormSubComponentProps {
  availableGoals: GoalWithStats[];
}

export function GoalSection({ habitForm, availableGoals, updateField, validationErrors }: GoalSectionProps) {
  // Validate and sanitize available goals
  const validatedGoals = useMemo(() => {
    const goalsArray = Array.isArray(availableGoals) ? availableGoals : [];
    return goalsArray.filter((goal) => goal && typeof goal === 'object' && goal.id && goal.title);
  }, [availableGoals]);

  // Handle goal toggle
  const handleToggleGoal = (goalId: string) => {
    if (!goalId) {
      console.warn('Goal ID is required for toggle operation');
      return;
    }

    const currentLinkedGoals = Array.isArray(habitForm.linkedGoals) ? habitForm.linkedGoals : [];
    const isLinked = currentLinkedGoals.includes(goalId);
    const updatedLinkedGoals = HabitFormManager.toggleArrayItem(currentLinkedGoals, goalId, !isLinked);

    updateField('linkedGoals')(updatedLinkedGoals);
  };

  // Sort goals with linked goals first, then alphabetically
  const sortedGoals = useMemo(() => {
    const linkedGoals = Array.isArray(habitForm.linkedGoals) ? habitForm.linkedGoals : [];
    return [...validatedGoals].sort((a, b) => {
      const aChecked = linkedGoals.includes(a.id);
      const bChecked = linkedGoals.includes(b.id);

      // Primary sort: checked goals first
      if (aChecked !== bChecked) {
        return aChecked ? -1 : 1;
      }

      // Secondary sort: alphabetical by title
      return a.title.localeCompare(b.title);
    });
  }, [validatedGoals, habitForm.linkedGoals]);

  // Generate selection summary
  const selectionSummary = useMemo(() => {
    const linkedGoals = Array.isArray(habitForm.linkedGoals) ? habitForm.linkedGoals : [];
    return FormatUtils.formatSelectionBadge(linkedGoals.length, 'goal');
  }, [habitForm.linkedGoals]);

  const linkedGoals = Array.isArray(habitForm.linkedGoals) ? habitForm.linkedGoals : [];

  return (
    <Card className="border-0 shadow-none bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="size-5 text-orange-500" aria-hidden="true" />
          Linked Goals
        </CardTitle>
        <div className="flex items-center justify-between mt-2">
          {linkedGoals.length > 0 && <p className="text-sm text-muted-foreground">{selectionSummary}</p>}
          {validationErrors.linkedGoals && (
            <div className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="size-3" />
              {validationErrors.linkedGoals}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {sortedGoals.length > 0 ? (
            <>
              {sortedGoals.map((goal) => {
                const isChecked = linkedGoals.includes(goal.id);
                const progressColor = ColorUtils.getProgressColor(goal.progress);

                return (
                  <label
                    key={UIUtils.generateComponentKey('goal', goal.id)}
                    htmlFor={`goal-${goal.id}`}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                      isChecked
                        ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/50'
                        : 'border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600'
                    }`}
                  >
                    <Checkbox
                      id={`goal-${goal.id}`}
                      checked={isChecked}
                      onCheckedChange={() => handleToggleGoal(goal.id)}
                      className="shrink-0 border-ring"
                    />

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isChecked ? 'text-orange-700 dark:text-orange-300' : 'text-secondary-foreground'
                        }`}
                      >
                        {goal.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{goal.category}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-xs font-semibold ${progressColor}`}>
                        {FormatUtils.formatPercentage(goal.progress, 100, 0)}
                      </Badge>

                      {/* Progress indicator */}
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
                        />
                      </div>
                    </div>
                  </label>
                );
              })}

              {/* Summary footer */}
              {linkedGoals.length > 0 && (
                <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    <strong>Linked Goals:</strong>{' '}
                    {FormatUtils.formatList(
                      sortedGoals.filter((goal) => linkedGoals.includes(goal.id)).map((goal) => goal.title),
                      { maxItems: 3, conjunction: 'and' }
                    )}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Target className="size-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No goals available</p>
              <p className="text-xs text-muted-foreground mt-1">Create some goals first to link them to your habits</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
