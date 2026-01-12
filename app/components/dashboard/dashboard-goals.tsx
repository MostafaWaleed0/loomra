import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateUtils } from '@/lib/core/date-utils';
import { useLocalState } from '@/lib/hooks/use-local-state';
import { AppSettings } from '@/lib/tauri-api';
import type { GoalWithStats, UseGoalsReturn } from '@/lib/types';
import { Target } from 'lucide-react';
import { GoalListItem } from '../goals/goal-list-item';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type DashboardGoalsProps = {
  goals: GoalWithStats[];
  setActiveView: (view: string) => void;
  setSelectedGoal: UseGoalsReturn['setSelectedGoal'];
  settings: AppSettings['goals'];
};

export function DashboardGoals({ goals, setActiveView, setSelectedGoal, settings }: DashboardGoalsProps) {
  const [selectedPeriod, setSelectedPeriod] = useLocalState('goal-selected-period', '3months');

  const filterGoalsByPeriod = (goals: GoalWithStats[]) => {
    const today = DateUtils.getCurrentDateString();

    return goals.filter((goal) => {
      if (goal.status === 'paused' || goal.status === 'completed') return false;

      if (!goal.deadline) return false;

      const daysDiff = DateUtils.calculateDaysBetween(today, DateUtils.formatDate(goal.deadline));
      if (daysDiff < 0) return false;

      const monthsDiff = daysDiff / 30;

      switch (selectedPeriod) {
        case '3months':
          return monthsDiff <= 3;
        case '6months':
          return monthsDiff <= 6;
        case '9months':
          return monthsDiff <= 9;
        case '1year':
          return monthsDiff <= 12;
        case 'more':
          return monthsDiff > 12;
      }
    });
  };

  function handleGoalSelect(goal: GoalWithStats) {
    setActiveView('goals');
    setSelectedGoal(goal);
  }

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const completedCount = completedGoals.length;
  const filteredGoals = filterGoalsByPeriod(activeGoals);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Target className="size-6 text-primary" />
            Active Goals
            {completedCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({completedCount} Completed)</span>
            )}
          </CardTitle>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Time Period</SelectLabel>
              <SelectItem value="3months">Next 3 Months</SelectItem>
              <SelectItem value="6months">Next 6 Months</SelectItem>
              <SelectItem value="9months">Next 9 Months</SelectItem>
              <SelectItem value="1year">Next 1 Year</SelectItem>
              <SelectItem value="more">More than 1 Year</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="size-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No active goals</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Start by creating your first goal to track your progress and achieve your objectives.
            </p>
          </div>
        ) : filteredGoals.length > 0 ? (
          filteredGoals.map((goal) => (
            <GoalListItem
              key={goal.id}
              goal={goal}
              showProgressPercentage={settings.showProgressPercentage}
              onClick={() => handleGoalSelect(goal)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="size-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No goals in this period</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              There are no active goals with deadlines in the selected time period. Try selecting a different period or create new
              goals.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
