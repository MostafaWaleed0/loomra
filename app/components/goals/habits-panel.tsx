import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Habit } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';
import { HabitIcon } from '../habit-icon';

interface HabitsPanelProps {
  selectedGoalId: string;
  getHabitsByGoalId: (goalId: string) => Habit[];
}

interface HabitRowProps {
  habit: Habit;
}

function HabitRow({ habit }: HabitRowProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-xl border p-3 transition',
        'bg-secondary hover:border-primary/30 hover:bg-primary/5'
      )}
    >
      <HabitIcon habit={habit} />
      <div className="flex-1">
        <div className="font-semibold">{habit.name}</div>
        {habit.category && <Badge>{habit.category}</Badge>}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">{message}</div>;
}

export function HabitsPanel({ selectedGoalId, getHabitsByGoalId }: HabitsPanelProps) {
  const connectedHabits = getHabitsByGoalId(selectedGoalId);

  if (!selectedGoalId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Connected Habits</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState message="Select a goal to manage connected habits" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Target className="size-5 text-primary" />
          Habits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectedHabits.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-secondary-foreground">
              Linked Habits <span className="text-sm text-muted-foreground">({connectedHabits.length})</span>
            </h4>
            <div className="space-y-2">
              {connectedHabits.map((habit) => (
                <HabitRow key={habit.id} habit={habit} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState message="No habits available. Create some habits first!" />
        )}
      </CardContent>
    </Card>
  );
}
