import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UI_CONFIG, UIUtils } from '@/lib/core';
import type { IconName } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface IconSelectorProps {
  icons?: IconName[];
  selectedIcon?: IconName;
  onIconSelect: (icon: IconName) => void;
  error?: string;
  label?: string;
  columns?: number;
  showCount?: boolean;
}

export function IconSelector({
  icons = [...UI_CONFIG.ICONS.AVAILABLE] as IconName[],
  selectedIcon,
  onIconSelect,
  error,
  label = 'Choose Icon',
  columns = 7,
  showCount = true
}: IconSelectorProps) {
  const gridClass = cn('grid gap-3', {
    'grid-cols-5': columns === 5,
    'grid-cols-6': columns === 6,
    'grid-cols-7': columns === 7,
    'grid-cols-8': columns === 8
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Label htmlFor="icon-selection">{label}</Label>
        {error && (
          <div className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="size-3" />
            {error}
          </div>
        )}
      </div>

      <div id="icon-selection" role="radiogroup" className={gridClass} aria-label="Icon selection">
        {icons.map((icon) => {
          const IconComponent = UIUtils.getIconComponent(icon);
          const selected = selectedIcon === icon;

          const buttonClass = cn(
            'size-10 rounded-lg transition-all duration-200',
            selected
              ? 'border-primary bg-primary/10 ring-2 ring-primary/30 scale-105'
              : 'hover:bg-accent hover:text-accent-foreground hover:scale-105'
          );

          return (
            <Button
              key={UIUtils.generateComponentKey('icon', icon)}
              type="button"
              variant="outline"
              size="lg"
              role="radio"
              aria-checked={selected}
              aria-label={`Select ${icon} icon`}
              onClick={() => onIconSelect(icon)}
              className={buttonClass}
            >
              <IconComponent className="size-4" />
            </Button>
          );
        })}
      </div>

      {showCount && <p className="text-xs text-muted-foreground mt-2">{icons.length} icons available</p>}
    </div>
  );
}
