import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ColorUtils, DateUtils, UIUtils } from '@/lib/core';
import type { GoalWithStats } from '@/lib/types';
import { Calendar, TrendingUp } from 'lucide-react';

interface GoalListItemProps {
  goal: GoalWithStats;
}

export function GoalListItem({ goal }: GoalListItemProps) {
  const Icon = UIUtils.getIconComponent(goal.icon);

  return (
    <div className="group relative flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-300">
      {/* Hover border effect */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${goal.color}60, ${goal.color}10)`,
          padding: '1px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude'
        }}
      />

      {/* Icon */}
      <div
        className="size-12 shrink-0 rounded-lg flex items-center justify-center text-white"
        style={{ backgroundColor: goal.color }}
      >
        <Icon className="size-6" />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="mb-1">
          <h3 className="text-base font-semibold break-all line-clamp-1">{goal.title}</h3>
          {goal.description && <p className="text-sm text-muted-foreground line-clamp-1 break-all">{goal.description}</p>}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={ColorUtils.getPriorityColor(goal.priority)} variant="outline">
            {goal.priority}
          </Badge>
          <Badge variant="secondary">{goal.category}</Badge>
          {goal.deadline && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              {DateUtils.formatDateForDisplay(goal.deadline, { format: 'short' })}
            </span>
          )}
        </div>
      </div>

      {/* Progress section */}
      <div className="shrink-0 w-48 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <TrendingUp className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Progress</span>
          </div>
          <span className="font-medium">{goal.progress}%</span>
        </div>
        <Progress value={goal.progress} className="h-1.5" />
        <span className="text-xs text-muted-foreground">
          {goal.completedTaskCount}/{goal.taskCount} tasks
        </span>
      </div>
    </div>
  );
}
