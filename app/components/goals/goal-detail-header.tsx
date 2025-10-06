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
  onEdit: () => void;
  onStatusChange: (action: GoalStatus) => void;
  onDelete: () => void;
}

export function GoalDetailHeader({ goal, onEdit, onStatusChange, onDelete }: GoalDetailHeaderProps) {
  const Icon = UIUtils.getIconComponent(goal.icon);

  return (
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: goal.color }}
          >
            <Icon className="size-8" />
          </div>
          <div className="max-w-130">
            <CardTitle className="text-2xl">{goal.title}</CardTitle>
            <CardDescription className="text-foreground/80 text-sm mt-1 break-words overflow-hidden">
              {goal.description}
            </CardDescription>
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
            <DropdownMenuSeparator />
            {goal.status !== 'completed' && (
              <DropdownMenuItem onClick={() => onStatusChange('completed')}>
                <CheckCircle2 className="size-4" /> Mark as Completed
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
