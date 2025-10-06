import { Label } from '@/components/ui/label';
import { FORM_STYLES, UIUtils } from '@/lib/core';
import type { ColorOption } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface ColorPickerProps {
  id: string;
  colors: readonly ColorOption[];
  currentColor: string;
  handleColorSelect: (color: string) => void;
  error?: string;
}

export function ColorPicker({ id, colors, currentColor, handleColorSelect, error }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-color-selection`}>Choose Color</Label>
      <div
        id={`${id}-color-selection`}
        aria-describedby={error ? `${id}-color-error` : undefined}
        role="radiogroup"
        className="grid grid-cols-8 gap-3"
        aria-label="Color selection"
      >
        {colors.map((colorObj) => {
          const selected = currentColor === colorObj.value;
          return (
            <button
              key={UIUtils.generateComponentKey(`${id}-color`, colorObj.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Select ${colorObj.name} color`}
              onClick={() => handleColorSelect(colorObj.value)}
              className={cn(
                'size-8 rounded-full border-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none relative',
                selected
                  ? 'scale-110 shadow-lg border-white ring-2 ring-gray-300 dark:ring-gray-600'
                  : 'border-transparent hover:scale-105 hover:shadow-md'
              )}
              style={{ backgroundColor: colorObj.value }}
            >
              {selected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="size-2 bg-white rounded-full shadow-sm" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-2">{colors.length} colors available</p>
      {error && (
        <div id={`${id}-color-error`} className={FORM_STYLES.error}>
          <AlertCircle className="size-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
