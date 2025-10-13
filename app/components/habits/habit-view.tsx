import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorUtils, DateUtils, FormatUtils } from '@/lib/core';
import type { GoalWithStats, HabitWithMetadata, UseHabitsReturn } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Calendar, CalendarDays, Target } from 'lucide-react';
import { useState } from 'react';
import { SectionHeader } from '../layout/section-header';
import { HabitDrawerView } from './habit-drawer/habit-drawer-view';
import { HabitList } from './habit-list';

interface DrawerState {
  isOpen: boolean;
  editingHabit: HabitWithMetadata | null;
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
  getHabitsWithMetadata,
  setHabitCompletion,
  handleHabitSelect
}: HabitViewProps) {
  const [showAllHabits, setShowAllHabits] = useState(false);

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

  function openEditHabitDrawerView(habit: HabitWithMetadata): void {
    setDrawerState({ isOpen: true, editingHabit: habit, mode: 'edit' });
  }

  const habitsWithMetadata = getHabitsWithMetadata(selectedDate, showAllHabits);

  return (
    <div>
      <SectionHeader
        title="Habit Tracker"
        description="Build consistency, track routines, and celebrate small wins daily."
        onButtonClick={openCreateHabitDrawerView}
        buttonLabel="New Habit"
      />
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant={showAllHabits ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowAllHabits(true)}
          className="min-w-24"
        >
          All Habits
        </Button>
        <Button
          variant={!showAllHabits ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowAllHabits(false)}
          className="min-w-24"
        >
          Today's Schedule
        </Button>
        <Badge variant="secondary" className="ml-auto capitalize">
          {showAllHabits ? FormatUtils.formatPlural(habitsWithMetadata.length, 'habit') : `${stats.dueToday} scheduled`}
        </Badge>
      </div>
      <Card>
        <CardHeader className="pb-4">
          {showAllHabits ? (
            <div className="flex items-center gap-3">
              <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
              <CardTitle className="text-lg">All Scheduled Habits</CardTitle>
            </div>
          ) : (
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
                <Badge variant="outline" className={ColorUtils.getCompletionColor(stats.percentage)}>
                  {FormatUtils.formatProgress(stats.completed, stats.dueToday, { showPercentage: false })}
                </Badge>
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className={cn(ColorUtils.getCompletionColor(stats.percentage), 'text-lg font-bold')}>
                    {FormatUtils.formatPercentage(stats.completed, stats.dueToday)}
                  </span>
                </div>
              </div>
            </div>
          )}
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
              showAll={showAllHabits}
            />
          )}
        </CardContent>
      </Card>
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
