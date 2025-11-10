import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FORM_STYLES } from '@/lib/core/constants';
import { AlertCircle } from 'lucide-react';
import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

export interface ValidatedSelectProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: readonly (string | SelectOption)[];
  error?: string;
  className?: string;
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  id,
  label,
  icon = '',
  value,
  onValueChange,
  placeholder = 'Select option',
  options,
  error,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="flex items-center gap-2" htmlFor={id}>
        {icon}
        {label}
      </Label>
      <Select value={value ?? ''} onValueChange={onValueChange}>
        <SelectTrigger
          id={id}
          className="h-12 capitalize"
          aria-label={label}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const optValue = typeof option === 'string' ? option : option.value;
            const optLabel = typeof option === 'string' ? option : option.label;
            return (
              <SelectItem key={optValue} value={optValue} className="text-sm capitalize">
                {optLabel}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {error && (
        <div id={`${id}-error`} className={FORM_STYLES.error}>
          <AlertCircle className="size-3" />
          {error}
        </div>
      )}
    </div>
  );
};
