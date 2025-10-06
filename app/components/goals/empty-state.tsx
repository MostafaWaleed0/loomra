import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Icon className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-sm mb-4">{description}</p>
        {action && (
          <Button onClick={action.onClick}>
            {ActionIcon && <ActionIcon className="size-4 mr-2" />}
            {action.label}
          </Button>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
