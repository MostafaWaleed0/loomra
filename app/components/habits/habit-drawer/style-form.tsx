import { ColorPicker } from '@/components/form/color-picker';
import { IconSelector } from '@/components/form/icon-selector';
import { HabitIcon } from '@/components/habit-icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FormatUtils } from '@/lib/core';
import { UI_CONFIG } from '@/lib/core/constants';
import { cn } from '@/lib/utils';
import { AlertCircle, Palette } from 'lucide-react';
import type { HabitFormSubComponentProps } from './type';

export function StyleForm({ habitForm, updateField, validationErrors }: HabitFormSubComponentProps) {
  function getColorName(colorValue: string): string {
    const colorObj = UI_CONFIG.COLORS.ALL.find((color) => color.value === colorValue);
    return colorObj ? colorObj.name : 'Custom Color';
  }

  function handleIconSelect(icon: string): void {
    updateField('icon')(icon);
  }

  return (
    <Card
      className={cn('border-0 shadow-none', 'bg-linear-to-br from-pink-50 to-rose-50', 'dark:from-pink-950 dark:to-rose-950')}
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="size-5 text-pink-500" aria-hidden="true" />
          Icon & Color
        </CardTitle>
        <div className="flex items-center gap-3 mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <HabitIcon habit={habitForm} size="size-10" />
          <div>
            <p className="text-sm font-medium">Preview</p>
            <p className="text-xs text-muted-foreground">
              {FormatUtils.truncateText(habitForm.icon, 15)} • {getColorName(habitForm.color)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <IconSelector selectedIcon={habitForm.icon} onIconSelect={handleIconSelect} />
        <Separator />
        <div>
          <div className="flex items-center justify-between mb-3">
            {validationErrors.color && (
              <div className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="size-3" />
                {validationErrors.color}
              </div>
            )}
          </div>
          <ColorPicker
            id="habit"
            colors={UI_CONFIG.COLORS.ALL}
            currentColor={habitForm.color}
            handleColorSelect={updateField('color')}
            error={validationErrors.color}
          />
        </div>
      </CardContent>
    </Card>
  );
}
