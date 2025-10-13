import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Row } from '@tanstack/react-table';
import { Calendar, GripVertical, MoreVertical, Edit2, Trash2, Lock } from 'lucide-react';
import React, { useCallback, useEffect, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { ColorUtils, DateUtils, FormatUtils } from '@/lib/core';
import { HABIT_CONFIG } from '@/lib/core/constants';
import { HabitFrequencyManager, HabitStatusManager } from '@/lib/habit';
import { DateString, HabitCompletion, HabitWithMetadata } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CompletionControl } from '../form/completion-control';
import { HabitIcon } from '../habit-icon';
import { HabitActionsMenuContent } from './habit-actions-menu-content';
import { useLocalState } from '@/lib/hooks/use-local-state';

// ============================================================================
// TYPES
// ============================================================================
interface Goal {
  id: string;
  name?: string;
  title?: string;
}

interface HabitListProps {
  habits: HabitWithMetadata[];
  completions: HabitCompletion[];
  selectedDate: DateString;
  onHabitSelect: (habitId: string) => void;
  onEditHabit: (habit: HabitWithMetadata) => void;
  onDeleteHabit: (habitId: string) => void;
  onSetHabitCompletion: (habitId: string, date: DateString, completed: boolean, data?: any) => void;
  goals?: Goal[];
  showAll: boolean;
}

// ============================================================================
// DRAG HANDLE
// ============================================================================
const DragHandle = React.memo(({ listeners, attributes }: any) => (
  <Button
    {...attributes}
    {...listeners}
    variant="ghost"
    size="sm"
    className="size-8 p-0 text-muted-foreground hover:bg-transparent cursor-grab active:cursor-grabbing"
    aria-label="Drag to reorder habit"
  >
    <GripVertical className="size-4" />
  </Button>
));
DragHandle.displayName = 'DragHandle';

// ============================================================================
// DRAGGABLE ROW
// ============================================================================
const DraggableHabitRow = React.memo(
  ({ row, completions, onEditHabit, onDeleteHabit, onHabitSelect, onSetHabitCompletion, selectedDate, goals, showAll }: any) => {
    const { transform, transition, setNodeRef, isDragging, attributes, listeners } = useSortable({
      id: row.original.id
    });

    return (
      <div
        ref={setNodeRef}
        data-dragging={isDragging}
        className={cn(
          'flex items-center justify-between gap-3 py-4 relative z-0 bg-card transition-all duration-200 w-full min-w-[500px]',
          isDragging ? 'z-10 opacity-80' : ''
        )}
        style={{
          transform: CSS.Transform.toString(transform),
          transition
        }}
      >
        <HabitRowContent
          habit={row.original}
          completions={completions}
          selectedDate={selectedDate}
          onEditHabit={onEditHabit}
          onDeleteHabit={onDeleteHabit}
          onHabitSelect={onHabitSelect}
          onSetHabitCompletion={onSetHabitCompletion}
          goals={goals}
          dragHandleProps={{ listeners, attributes }}
          showAll={showAll}
        />
      </div>
    );
  }
);
DraggableHabitRow.displayName = 'DraggableHabitRow';

// ============================================================================
// ROW CONTENT
// ============================================================================
const HabitRowContent = React.memo(
  ({
    habit,
    completions,
    selectedDate,
    onEditHabit,
    onDeleteHabit,
    onHabitSelect,
    onSetHabitCompletion,
    goals,
    dragHandleProps,
    showAll
  }: any) => {
    const dayStatus = HabitStatusManager.getDayStatus(habit, completions, selectedDate);
    const statusInfo = HabitStatusManager.getStatusMessage(dayStatus, habit);
    const frequencyDescription = HabitFrequencyManager.describe(habit.frequency);
    const canModifyCompletion = !DateUtils.isFutureDate(selectedDate) && dayStatus !== HABIT_CONFIG.STATUS.LOCKED;

    return (
      <>
        {showAll ? <DragHandle {...dragHandleProps} /> : null}
        <div className="flex items-center gap-3 flex-1">
          <HabitIcon habit={habit} size="size-10" className="flex-shrink-0" />
          <div className="flex-1">
            <Button
              variant="link"
              className="h-auto p-0 text-left font-semibold text-foreground justify-start hover:text-primary transition-colors"
              onClick={() => onHabitSelect(habit.id)}
              aria-label={`Select habit ${habit.name}`}
            >
              <span className="truncate text-base">{habit.name}</span>
            </Button>

            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className="text-xs">
                {habit.category}
              </Badge>
              <Badge className={cn(ColorUtils.getPriorityColor(habit.priority), 'text-xs')}>{habit.priority}</Badge>
              {habit.linkedGoals?.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {FormatUtils.formatList(
                    goals
                      .filter((goal: Goal) => goal && (goal.title || goal.name) && habit.linkedGoals.includes(goal.id))
                      .map((goal: Goal) => goal.title || goal.name || ''),
                    { maxItems: 2 }
                  )}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1 truncate">{frequencyDescription}</div>
          </div>
        </div>

        {/* Status / Completion / Actions */}

        <div className="flex justify-end items-center gap-3 sm:gap-4">
          {showAll ? null : (
            <>
              {statusInfo && (
                <Badge variant={statusInfo.variant} className="text-xs font-medium">
                  {statusInfo.title}
                </Badge>
              )}
              <div className="flex flex-col items-end">
                {canModifyCompletion ? (
                  <CompletionControl
                    habit={habit}
                    completions={completions}
                    selectedDate={selectedDate}
                    onSetHabitCompletion={onSetHabitCompletion}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="size-4" />
                    <span className="text-sm">{DateUtils.isFutureDate(selectedDate) ? 'Future' : 'Locked'}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex flex-col items-center min-w-12 sm:min-w-16">
            <div className="text-sm font-semibold text-foreground">{habit.currentStreak || 0}</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="size-9 p-0 hover:bg-muted/50" aria-label="Open habit actions menu">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-45">
              {showAll ? null : (
                <>
                  <HabitActionsMenuContent
                    habit={habit}
                    completions={completions}
                    selectedDate={selectedDate}
                    onSetHabitCompletion={onSetHabitCompletion}
                    canModifyCompletion={canModifyCompletion}
                  />
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => onEditHabit(habit)}>
                <Edit2 className="mr-1 size-4" />
                Edit Habit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDeleteHabit(habit.id)} className="text-destructive">
                <Trash2 className="mr-1 size-4" />
                Delete Habit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </>
    );
  }
);
HabitRowContent.displayName = 'HabitRowContent';

// ============================================================================
// MAIN COMPONENT WITH useLocalStorage
// ============================================================================
export const HabitList = React.memo<HabitListProps>(
  ({
    habits,
    completions,
    selectedDate,
    onHabitSelect,
    onEditHabit,
    onDeleteHabit,
    onSetHabitCompletion,
    goals = [],
    showAll
  }) => {
    const [habitOrder, setHabitOrder] = useLocalState<string[]>('habit-order', []);

    const orderedHabits = useMemo(() => {
      if (habitOrder.length === 0) return habits;
      const ordered = habitOrder
        .map((id: UniqueIdentifier) => habits.find((h) => h.id === id))
        .filter(Boolean) as HabitWithMetadata[];
      const newOnes = habits.filter((h) => !habitOrder.includes(h.id));
      return [...ordered, ...newOnes];
    }, [habits, habitOrder]);

    const [data, setData] = React.useState<HabitWithMetadata[]>(orderedHabits);

    useEffect(() => {
      setData(orderedHabits);
    }, [orderedHabits]);

    const sensors = useSensors(
      useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
      useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
      useSensor(KeyboardSensor)
    );

    const dataIds = useMemo<UniqueIdentifier[]>(() => data.map(({ id }) => id), [data]);

    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const newData = arrayMove(data, oldIndex, newIndex);
        setData(newData);

        if (showAll) {
          setHabitOrder(newData.map((h) => h.id));
        }
      },
      [data, dataIds, setHabitOrder, showAll]
    );

    if (data.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No habits found</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {DateUtils.isToday(selectedDate)
                ? 'No habits are scheduled for today. Create your first habit to get started!'
                : `No habits scheduled for ${DateUtils.formatDateForDisplay(selectedDate)}`}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="shadow-none p-0">
        <CardContent>
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border overflow-auto">
                {data.map((habit) => {
                  const rowData = { original: habit, id: habit.id } as Row<HabitWithMetadata>;
                  return (
                    <DraggableHabitRow
                      key={habit.id}
                      row={rowData}
                      completions={completions}
                      onEditHabit={onEditHabit}
                      onDeleteHabit={onDeleteHabit}
                      onHabitSelect={onHabitSelect}
                      onSetHabitCompletion={onSetHabitCompletion}
                      selectedDate={selectedDate}
                      goals={goals}
                      showAll={showAll}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    );
  }
);
HabitList.displayName = 'HabitList';
