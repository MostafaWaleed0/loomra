import { FORM_STYLES } from '@/lib/core/constants';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface ValidatedTextareaProps {
  id: string;
  label: string | React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  required?: boolean;
  rows?: number;
  className?: string;
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  maxLength,
  error,
  required = false,
  rows = 4,
  className = ''
}) => {
  const charCount = value?.length ?? 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value ?? ''}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(error && 'border-destructive', 'h-30 whitespace-pre-wrap break-words resize-y')}
      />
      {maxLength && (
        <div className="flex justify-between items-center">
          <div className={cn(FORM_STYLES.charCount, 'text-xs')}>
            {charCount}/{maxLength} characters
          </div>
          {error && (
            <div id={`${id}-error`} className={FORM_STYLES.error}>
              <AlertCircle className="size-3" />
              {error}
            </div>
          )}
        </div>
      )}
      {!maxLength && error && (
        <div id={`${id}-error`} className={FORM_STYLES.error}>
          <AlertCircle className="size-3" />
          {error}
        </div>
      )}
    </div>
  );
};
