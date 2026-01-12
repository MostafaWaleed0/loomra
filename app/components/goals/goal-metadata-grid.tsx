import { Badge } from '@/components/ui/badge';
import { ColorUtils } from '@/lib/core';
import type { GoalWithStats } from '@/lib/types';
import { Calendar, Flag, Folder, Activity } from 'lucide-react';

interface GoalMetadataGridProps {
  goal: GoalWithStats;
  deadlineWarning: number;
}

export function GoalMetadataGrid({ goal, deadlineWarning }: GoalMetadataGridProps) {
  const daysUntilDeadline = goal.daysUntilDeadline ?? 0;

  const deadlineState = daysUntilDeadline < 0 ? 'overdue' : daysUntilDeadline <= deadlineWarning ? 'soon' : 'ok';

  const deadlineStyles = {
    overdue: 'text-red-600',
    soon: 'text-orange-500',
    ok: 'text-muted-foreground'
  };

  const deadlineLabel =
    deadlineState === 'overdue' ? `${Math.abs(daysUntilDeadline)} days overdue` : `${daysUntilDeadline} days left`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
      {/* Category */}
      <MetadataItem icon={Folder} label="Category">
        <span className="capitalize font-medium">{goal.category}</span>
      </MetadataItem>

      {/* Priority */}
      <MetadataItem icon={Flag} label="Priority">
        <Badge variant="outline" className={ColorUtils.getPriorityColor(goal.priority)}>
          {goal.priority}
        </Badge>
      </MetadataItem>

      {/* Status */}
      <MetadataItem icon={Activity} label="Status">
        <Badge variant="outline" className={ColorUtils.getStatusColor(goal.status)}>
          {goal.isCompleted ? 'Completed' : goal.status}
        </Badge>
      </MetadataItem>

      {/* Deadline */}
      {goal.deadline && (
        <MetadataItem icon={Calendar} label="Deadline">
          <span className={`font-semibold ${deadlineStyles[deadlineState]}`}>{deadlineLabel}</span>
        </MetadataItem>
      )}
    </div>
  );
}

function MetadataItem({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}
