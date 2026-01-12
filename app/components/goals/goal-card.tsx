import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ColorUtils, DateUtils, UIUtils } from '@/lib/core';
import type { GoalWithStats } from '@/lib/types';
import { Calendar, Edit2, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface GoalCardProps {
  goal: GoalWithStats;
  onClick: () => void;
  onEdit: () => void;
  showProgressPercentage: boolean;
}

export function GoalCard({ goal, onClick, onEdit, showProgressPercentage }: GoalCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = UIUtils.getIconComponent(goal.icon);

  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit();
  }

  return (
    <Card
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="gap-10 group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-lg"
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${goal.color}60, ${goal.color}10)`,
          padding: '2px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude'
        }}
      />

      <CardHeader className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div
            className="size-14 aspect-square rounded-xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: goal.color }}
          >
            <Icon className="size-7" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold break-all line-clamp-1">{goal.title}</CardTitle>
            {goal.description && <p className="text-sm text-muted-foreground line-clamp-2 break-all">{goal.description}</p>}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Badge className={ColorUtils.getPriorityColor(goal.priority)}>{goal.priority} priority</Badge>
              <Badge variant="secondary">{goal.category}</Badge>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleEditClick}
          className={`size-9 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}
        >
          <Edit2 className="size-4" />
        </Button>
      </CardHeader>

      <CardContent className="mt-auto">
        <div className="space-y-1 pb-1 border-b text-sm">
          {showProgressPercentage && (
            <>
              <div className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-1">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  Progress
                </div>
                <span>{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </>
          )}
          <span className="text-muted-foreground capitalize text-xs font-medium">
            {goal.completedTaskCount}/{goal.taskCount} tasks completed
          </span>
        </div>
        <div className="flex items-center justify-between pt-2">
          {goal.deadline && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="size-3" />
              {DateUtils.formatDateForDisplay(goal.deadline, { format: 'short' })}
            </span>
          )}
          <Badge className={ColorUtils.getStatusColor(goal.status)}>{goal.status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
