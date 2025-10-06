import { Badge } from '@/components/ui/badge';
import type { GoalWithStats } from '@/lib/types';

interface GoalMetadataGridProps {
  goal: GoalWithStats;
}

export function GoalMetadataGrid({ goal }: GoalMetadataGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <div className="text-muted-foreground">Category</div>
        <div className="font-medium capitalize">{goal.category}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Priority</div>
        <Badge variant="outline" className="capitalize">
          {goal.priority}
        </Badge>
      </div>
      <div>
        <div className="text-muted-foreground">Status</div>
        <Badge variant={goal.isCompleted ? 'default' : 'secondary'}>{goal.isCompleted ? 'Completed' : goal.status}</Badge>
      </div>
      {goal.deadline && (
        <div>
          <div className="text-muted-foreground">Deadline</div>
          <div className="font-medium">
            {Math.abs(goal.daysUntilDeadline || 0)}d {(goal.daysUntilDeadline || 0) >= 0 ? 'left' : 'overdue'}
          </div>
        </div>
      )}
    </div>
  );
}
