import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ColorUtils, UIUtils } from '@/lib/core';
import type { GoalWithStats } from '@/lib/types';
import { Edit2 } from 'lucide-react';

interface GoalCardProps {
  goal: GoalWithStats;
  onClick: () => void;
  onEdit: () => void;
}

export function GoalCard({ goal, onClick, onEdit }: GoalCardProps) {
  const Icon = UIUtils.getIconComponent(goal.icon);

  function handleEditClick() {
    onEdit();
  }

  return (
    <Card onClick={onClick} className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="size-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: goal.color }}>
          <Icon className="size-6" />
        </div>
        <Button variant="ghost" size="icon" onClick={handleEditClick} className="size-9">
          <Edit2 />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="text-lg font-semibold break-all line-clamp-1">{goal.title}</CardTitle>
          {goal.description && <p className="text-sm text-muted-foreground line-clamp-2 break-all">{goal.description}</p>}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between pt-1">
          <Badge className={ColorUtils.getPriorityColor(goal.priority)}>{goal.priority} priority</Badge>
          <span className="text-xs text-muted-foreground font-medium">{goal.category}</span>
        </div>
      </CardContent>
    </Card>
  );
}
