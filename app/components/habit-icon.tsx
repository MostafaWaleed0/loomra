import { UIUtils } from '@/lib/core';
import type { Habit, HabitFormData } from '@/lib/types';
import { cn } from '@/lib/utils';

interface HabitIconProps extends React.HTMLAttributes<HTMLDivElement> {
  habit: Habit | HabitFormData;
  size?: string;
  className?: string;
}

export function HabitIcon({ habit, size = 'size-11', className, ...props }: HabitIconProps) {
  const IconComponent = UIUtils.getIconComponent(habit.icon);

  return (
    <div
      className={cn('grid place-content-center rounded-full', size, className)}
      style={{
        background: `linear-gradient(135deg, ${habit.color}20, ${habit.color}10)`,
        border: `1px solid ${habit.color}20`
      }}
      {...props}
    >
      <IconComponent className="size-5 drop-shadow-sm" style={{ color: habit.color }} />
    </div>
  );
}
