import { Progress } from '@/components/ui/progress';
import type { GoalWithStats } from '@/lib/types';

interface GoalProgressSectionProps {
  goal: GoalWithStats;
}

export function GoalProgressSection({ goal }: GoalProgressSectionProps) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span>Progress</span>
        <span className="font-medium">{goal.progress}%</span>
      </div>
      <Progress value={Number(goal.progress)} className="h-3" />
    </div>
  );
}
