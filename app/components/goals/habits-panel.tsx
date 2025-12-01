import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormatUtils } from '@/lib/core/format-utils';
import type { Habit } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Target, Zap } from 'lucide-react';
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
        'group relative flex items-center gap-4 rounded-2xl border p-4 transition-all duration-300',
        'bg-linear-to-br from-secondary/50 to-secondary/30',
        'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10',
        'overflow-hidden'
      )}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Icon container with background */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 rounded-xl bg-primary/10 blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <HabitIcon habit={habit} />
      </div>

      {/* Content */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{habit.name}</h3>
        </div>

        {habit.category && <Badge variant="outline">{habit.category}</Badge>}
      </div>
    </div>
  );
}

function EmptyState({ message, icon: Icon = Target }: { message: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="rounded-full bg-linear-to-br from-primary/20 to-primary/5 p-6 mb-4 animate-in zoom-in duration-300">
        <Icon className="size-16 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
    </div>
  );
}

export function HabitsPanel({ selectedGoalId, getHabitsByGoalId }: HabitsPanelProps) {
  const connectedHabits = getHabitsByGoalId(selectedGoalId);

  if (!selectedGoalId) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
            Connected Habits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState message="Select a goal to view and manage its connected habits" icon={Target} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-lg border-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="rounded-lg bg-primary/10 p-2">
              <Zap className="size-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <span>Connected Habits</span>
            </div>
          </CardTitle>
          {connectedHabits.length > 0 && <Badge>{FormatUtils.formatPlural(connectedHabits.length, 'Habit')}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {connectedHabits.length > 0 ? (
          <div className="space-y-3">
            {connectedHabits.map((habit) => (
              <HabitRow key={habit.id} habit={habit} />
            ))}
          </div>
        ) : (
          <EmptyState
            message="No habits linked to this goal yet. Create and connect habits to start tracking your progress!"
            icon={Zap}
          />
        )}
      </CardContent>
    </Card>
  );
}
