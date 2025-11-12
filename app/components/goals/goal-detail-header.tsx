import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UIUtils } from '@/lib/core';
import type { Goal, GoalStatus } from '@/lib/types';
import { CheckCircle2, Edit3, EllipsisVertical, Pause, Target, Trash2 } from 'lucide-react';

interface GoalDetailHeaderProps {
  goal: Goal;
  taskCount: number;
  onEdit: () => void;
  onStatusChange: (action: GoalStatus) => void;
  onDelete: () => void;
  onCompleteWithTasks?: () => void;
}

export function GoalDetailHeader({
  goal,
  taskCount,
  onEdit,
  onStatusChange,
  onDelete,
  onCompleteWithTasks
}: GoalDetailHeaderProps) {
  const Icon = UIUtils.getIconComponent(goal.icon);

  const hasTasksToComplete = taskCount > 0;

  function handleComplete() {
    if (hasTasksToComplete && onCompleteWithTasks) {
      onCompleteWithTasks();
    } else {
      onStatusChange('completed');
    }
  }

  return (
    <CardHeader>
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/10 transition-transform hover:scale-105"
            style={{ backgroundColor: goal.color }}
          >
            <Icon className="size-7" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-semibold mb-1 break-all overflow-hidden">{goal.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground line-clamp-2 break-all">{goal.description}</CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon">
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit3 className="size-4" /> Edit Goal
            </DropdownMenuItem>

            {((goal.status !== 'completed' && hasTasksToComplete) || goal.status === 'paused' || goal.status === 'active') && (
              <DropdownMenuSeparator />
            )}

            {goal.status !== 'completed' && hasTasksToComplete && (
              <DropdownMenuItem onClick={handleComplete}>
                <CheckCircle2 className="size-4" /> Mark as Completed
                <span className="ml-auto text-xs text-muted-foreground">
                  ({taskCount} {taskCount === 1 ? 'task' : 'tasks'})
                </span>
              </DropdownMenuItem>
            )}
            {goal.status === 'paused' && (
              <DropdownMenuItem onClick={() => onStatusChange('active')}>
                <Target className="size-4" /> Activate Goal
              </DropdownMenuItem>
            )}
            {goal.status === 'active' && (
              <DropdownMenuItem onClick={() => onStatusChange('paused')}>
                <Pause className="size-4" /> Pause Goal
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" /> Delete Goal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
  );
}
