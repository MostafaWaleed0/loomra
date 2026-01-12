import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ColorUtils, DateUtils, UIUtils } from '@/lib/core';
import type { GoalWithStats } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle2, Edit2, Pause, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface GoalListItemProps {
  goal: GoalWithStats;
  onClick?: () => void;
  onEdit?: () => void;
  showProgressPercentage?: boolean;
}

export function GoalListItem({ goal, onClick, onEdit, showProgressPercentage }: GoalListItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = UIUtils.getIconComponent(goal.icon);

  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit?.();
  }

  return (
    <div
      className="group relative flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated border effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${goal.color}40, ${goal.color}10)`,
          padding: '1px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude'
        }}
      />

      {/* Icon with animation */}
      <div className="relative shrink-0">
        <div
          className="size-14 rounded-xl flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: goal.color,
            boxShadow: isHovered ? `0 8px 16px ${goal.color}40` : 'none'
          }}
        >
          <Icon className="size-7" />
        </div>

        {/* Status badge overlay */}
        {goal.status === 'completed' && (
          <div className="absolute -top-1 -right-1 size-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-background">
            <CheckCircle2 className="size-3 text-white" />
          </div>
        )}
        {goal.status === 'paused' && (
          <div className="absolute -top-1 -right-1 size-5 bg-yellow-500 rounded-full flex items-center justify-center ring-2 ring-background">
            <Pause className="size-3 text-white" />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Title and description */}
        <div>
          <div className="flex items-start gap-2">
            <h3
              className={`text-base font-semibold line-clamp-1 transition-colors ${
                goal.status === 'completed' ? 'text-muted-foreground line-through' : ''
              }`}
            >
              {goal.title}
            </h3>
          </div>
          {goal.description && <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{goal.description}</p>}
        </div>

        {/* Metadata badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={ColorUtils.getPriorityColor(goal.priority)}>{goal.priority} priority</Badge>

          <Badge variant="secondary" className="gap-1">
            {goal.category}
          </Badge>

          {goal.deadline && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="size-3" />
              {DateUtils.formatDateForDisplay(goal.deadline, { format: 'short' })}
            </Badge>
          )}
        </div>
      </div>
      {showProgressPercentage && (
        <>
          {/* Progress section */}
          <div className="shrink-0 w-48 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Progress</span>
              </div>
              {showProgressPercentage && <span className="text-xs text-muted-foreground">{goal.progress}%</span>}
            </div>

            <div className="relative">
              <Progress value={goal.progress} className="h-2 bg-secondary" />
              <div
                className="absolute inset-0 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${goal.progress}%`,
                  backgroundColor: goal.color,
                  opacity: 0.2,
                  filter: 'blur(4px)'
                }}
              />
            </div>

            {/* Additional stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  {goal.completedTaskCount}/{goal.taskCount}
                </span>
                Tasks Completed
              </span>
            </div>
          </div>
        </>
      )}
      {/* Action buttons  */}
      {onEdit && (
        <div
          className={cn(
            'shrink-0 flex items-center gap-1 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEditClick}
            className="size-9 transition-all duration-300 opacity-100 translate-x-0"
          >
            <Edit2 className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
