import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle, CalendarIcon, ChevronDown, X } from 'lucide-react';
import React from 'react';
import { Calendar } from '../ui/calendar';
import { DateUtils, FORM_STYLES } from '@/lib/core';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  id?: string;
  label?: string;
  date?: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  showIcon?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showActions?: boolean;
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';
  mode?: 'full' | 'icon';
}

export const DatePicker: React.FC<DatePickerProps> = ({
  id,
  label,
  date,
  onSelect,
  placeholder = 'Select date',
  disabled = false,
  error,
  className,
  align = 'start',
  side = 'bottom',
  showIcon = true,
  variant = 'outline',
  size = 'default',
  showActions = true,
  captionLayout = 'dropdown',
  mode = 'full'
}) => {
  const [month, setMonth] = React.useState<Date>(date || new Date());

  const handleClearDate = () => {
    onSelect(undefined);
  };

  const handleTodayClick = () => {
    const today = new Date();
    setMonth(today);
    onSelect(today);
  };

  const isIconMode = mode === 'icon';

  const triggerButton = isIconMode ? (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled}
      className={cn('justify-start text-left font-normal', !date && 'text-muted-foreground', className)}
      aria-label="Pick a date"
    >
      <CalendarIcon className="size-4" />
    </Button>
  ) : (
    <Button
      id={id}
      type="button"
      variant={variant}
      disabled={disabled}
      className={cn('w-full justify-between font-normal', !date && 'text-muted-foreground', error && 'border-destructive')}
      aria-label={label || 'Pick a date'}
    >
      <span className="flex items-center gap-2">
        {showIcon && <CalendarIcon className="size-4" />}
        {date ? DateUtils.formatDateForDisplay(date, { format: 'relative' }) : placeholder}
      </span>
      <ChevronDown className="size-4 opacity-50" />
    </Button>
  );

  const content = (
    <Popover>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align} side={side}>
        <Card>
          {showActions && (
            <CardHeader className="flex justify-center p-0">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleTodayClick}>
                  Today
                </Button>
                <Button size="sm" variant="destructive" onClick={handleClearDate}>
                  <X className="size-4 mr-1" />
                  Clear
                </Button>
              </div>
            </CardHeader>
          )}
          <CardContent>
            <Calendar
              mode="single"
              month={month}
              selected={date}
              onMonthChange={setMonth}
              onSelect={onSelect}
              disabled={disabled}
              captionLayout={captionLayout}
            />
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );

  if (isIconMode) {
    return content;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label htmlFor={id}>{label}</Label>}
      {content}
      {error && (
        <div className={FORM_STYLES.error}>
          <AlertCircle className="size-3" />
          {error}
        </div>
      )}
    </div>
  );
};
