import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorUtils, DateUtils, FormatUtils } from '@/lib/core';
import type { GoalWithStats, Habit, HabitFormData, UseHabitsReturn } from '@/lib/types';
import { Calendar, CalendarDays, Target } from 'lucide-react';
import { useState } from 'react';
import { HabitDrawerView } from './habit-drawer/habit-drawer-view';
import { HabitHeader } from './habit-header';
import { HabitList } from './habit-list';

interface DrawerState {
  isOpen: boolean;
  editingHabit: Habit | null;
  mode: 'create' | 'edit';
}

interface HabitPreferences {
  showOnlyScheduledForDate: boolean;
  showCompletedHabits: boolean;
  groupByCategory: boolean;
}

interface EmptyHabitsStateProps {
  onCreate: () => void;
  isDateSpecific: boolean;
}

interface HabitViewProps extends UseHabitsReturn {
  goals: GoalWithStats[];
}

// JSDoc: Renders empty state for habits
function EmptyHabitsState({ onCreate, isDateSpecific }: EmptyHabitsStateProps) {
  return (
    <CardContent className="flex flex-col items-center justify-center py-12">
      <Calendar className="size-12 text-muted-foreground mb-4" aria-hidden="true" />
      <h3 className="text-lg font-medium text-muted-foreground mb-2">
        {isDateSpecific ? 'No habits scheduled for this date' : 'No habits found'}
      </h3>
      <p className="text-sm text-muted-foreground text-center mb-4">
        {isDateSpecific
          ? 'Select a different date or create a new habit to get started.'
          : 'Create your first habit to start building better routines.'}
      </p>
      <Button onClick={onCreate}>Create Habit</Button>
    </CardContent>
  );
}

// JSDoc: Manages habit view preferences
function useHabitPreferences(): [HabitPreferences] {
  const preferences: HabitPreferences = {
    showOnlyScheduledForDate: true,
    showCompletedHabits: true,
    groupByCategory: false
  };
  return [preferences];
}

// JSDoc: Renders habit view with list, header, and drawer
export function HabitView({
  goals,
  completions,
  stats,
  selectedDate,
  handleSaveHabit,
  handleDeleteHabit,
  getHabitsForDate,
  setHabitCompletion,
  handleHabitSelect
}: HabitViewProps) {
  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    editingHabit: null,
    mode: 'create'
  });

  const [prefs] = useHabitPreferences();

  function closeHabitDrawerView(): void {
    setDrawerState({ isOpen: false, editingHabit: null, mode: 'create' });
  }

  function openCreateHabitDrawerView(): void {
    setDrawerState({ isOpen: true, editingHabit: null, mode: 'create' });
  }

  function openEditHabitDrawerView(habit: Habit): void {
    setDrawerState({ isOpen: true, editingHabit: habit, mode: 'edit' });
  }

  const habitsWithMetadata = getHabitsForDate(selectedDate);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <HabitHeader onCreateHabit={openCreateHabitDrawerView} />
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
                <div>
                  <CardTitle className="text-lg">
                    {selectedDate ? DateUtils.formatDateForDisplay(selectedDate) : 'Select Date'}
                  </CardTitle>
                  <CardDescription>{FormatUtils.formatPlural(stats.dueToday, 'habit')} scheduled</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`${ColorUtils.getCompletionColor(stats.percentage)} font-medium`}>
                  {FormatUtils.formatProgress(stats.completed, stats.dueToday, { showPercentage: false })}
                </Badge>
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className={`text-lg font-bold ${ColorUtils.getCompletionColor(stats.percentage)}`}>
                    {FormatUtils.formatPercentage(stats.completed, stats.dueToday)}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {habitsWithMetadata.length === 0 ? (
              <EmptyHabitsState onCreate={openCreateHabitDrawerView} isDateSpecific={prefs.showOnlyScheduledForDate} />
            ) : (
              <HabitList
                habits={habitsWithMetadata}
                completions={completions}
                selectedDate={selectedDate}
                onHabitSelect={handleHabitSelect}
                onEditHabit={openEditHabitDrawerView}
                onDeleteHabit={handleDeleteHabit}
                onSetHabitCompletion={setHabitCompletion}
                goals={goals}
              />
            )}
          </CardContent>
        </Card>
      </div>
      <HabitDrawerView
        isOpen={drawerState.isOpen}
        onClose={closeHabitDrawerView}
        onSave={handleSaveHabit}
        habitData={drawerState.editingHabit}
        availableGoals={goals}
      />
    </div>
  );
}
