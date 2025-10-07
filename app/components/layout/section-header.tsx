import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SectionHeaderProps = {
  title: string;
  description: string;
  onButtonClick?: () => void;
  buttonLabel?: string;
  showButton?: boolean;
};

export function SectionHeader({ title, description, onButtonClick, buttonLabel, showButton = true }: SectionHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 mb-6 ">
      <div>
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="mt-1 font-medium text-foreground/60">{description}</p>
      </div>

      {showButton && onButtonClick && buttonLabel && (
        <Button onClick={onButtonClick} aria-label={`Create ${buttonLabel}`}>
          <Plus className="size-4 mr-2" />
          {buttonLabel}
        </Button>
      )}
    </header>
  );
}
