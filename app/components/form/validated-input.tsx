import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FORM_STYLES } from '@/lib/core/constants';

interface ValidatedInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength: number;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password';
  className?: string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  maxLength,
  error,
  required = false,
  type = 'text',
  className = ''
}) => {
  const charCount = value?.length ?? 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value ?? ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 text-base"
        maxLength={maxLength}
        required={required}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <div className="fle justify-between items-center">
        <div className={FORM_STYLES.charCount}>
          {charCount}/{maxLength} characters
        </div>
        {error && (
          <div id={`${id}-error`} className={FORM_STYLES.error}>
            <AlertCircle className="size-3" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
