import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { ColorUtils, SYSTEM_CONSTANTS, UI_CONFIG } from '@/lib/core';
import { useHabitCalendar } from '@/lib/hooks/use-habit-calendar';
import type { CompletionRecord, DateString, HabitCompletion, HabitWithMetadata } from '@/lib/types';
import {
  Brain,
  Calendar,
  ChevronDown,
  ChevronUp,
  Flame,
  Heart,
  Loader2Icon,
  MoreVertical,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import { CompletionControl } from '../form/completion-control';
import { ValidatedSelect } from '../form/validated-select';
import { ValidatedTextarea } from '../form/validated-textarea';
import { HabitActionsMenuContent } from '../habits/habit-actions-menu-content';

interface DashboardHabitCardProps {
  habit: HabitWithMetadata;
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

export function DashboardHabitCard({
  habit,
  completions,
  today,
  canModifyCompletion,
  onSetHabitCompletion
}: DashboardHabitCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [expandedHabits, setExpandedHabits] = useState(false);

  const { editFormData, canEditDay, updateFormField, handleSaveCompletion } = useHabitCalendar(
    habit,
    completions,
    today,
    () => null,
    onSetHabitCompletion
  );

  if (!canEditDay || !canModifyCompletion) return null;

  const handleSaveWithLoading = async () => {
    setIsSaving(true);
    await new Promise((res) => setTimeout(res, 500));
    handleSaveCompletion();
    setIsSaving(false);
  };

  return (
    <Card className="gap-4">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <CompletionControl
            habit={habit}
            completions={completions}
            selectedDate={today}
            onSetHabitCompletion={onSetHabitCompletion}
          />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setExpandedHabits(!expandedHabits)}>
              {expandedHabits ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted/50">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <HabitActionsMenuContent
                  habit={habit}
                  completions={completions}
                  selectedDate={today}
                  onSetHabitCompletion={onSetHabitCompletion}
                  canModifyCompletion={canModifyCompletion}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg break-all line-clamp-2">{habit.name}</h3>
          <Badge variant="outline" className={ColorUtils.getPriorityColor(habit.priority)}>
            {habit.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {habit.frequencySummary}
                </span>
                <span>•</span>
                <span className="capitalize">{habit.category}</span>
              </div>
              <Progress className="mb-2" value={habit.completionRate} />
              <div className="flex items-center gap-4 text-sm capitalize">
                <div className="flex items-center gap-1 text-orange-600">
                  <Flame className="size-3" />
                  <span className="font-semibold">{habit.currentStreak}</span>
                  <span className="text-muted-foreground">streak</span>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <Target className="size-3" />
                  <span className="font-semibold">{Math.round(habit.completionRate)}%</span>
                  <span className="text-muted-foreground">rate</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600">
                  <TrendingUp className="size-3" />
                  <span className="font-semibold">{habit.totalCompletions}</span>
                  <span className="text-muted-foreground">total</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {expandedHabits && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ValidatedSelect
                id={`habit-mood-${habit.id}`}
                label="Mood"
                icon={<Heart className="size-4 text-red-500" />}
                value={editFormData.mood}
                onValueChange={updateFormField('mood')}
                placeholder="Select mood 😊"
                options={UI_CONFIG.STATUS_OPTIONS.MOOD}
              />
              <ValidatedSelect
                id={`habit-difficulty-${habit.id}`}
                label="Difficulty"
                icon={<Zap className="size-4 text-yellow-500" />}
                value={editFormData.difficulty}
                onValueChange={updateFormField('difficulty')}
                placeholder="Select difficulty ⭐"
                options={UI_CONFIG.STATUS_OPTIONS.DIFFICULTY}
              />
            </div>

            <ValidatedTextarea
              id={`habit-note-${habit.id}`}
              label={
                <>
                  <Brain className="size-4 text-purple-500" /> Note
                </>
              }
              value={editFormData.note || ''}
              onChange={updateFormField('note')}
              placeholder="Add a note about this habit..."
              maxLength={SYSTEM_CONSTANTS.VALIDATION.MAX_NOTE_LENGTH}
            />

            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setExpandedHabits(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveWithLoading} disabled={isSaving} className="flex items-center gap-2">
                {isSaving ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
