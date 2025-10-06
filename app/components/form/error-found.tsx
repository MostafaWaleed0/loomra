import { FORM_STYLES, FormatUtils } from '@/lib/core';
import { AlertCircle } from 'lucide-react';

export function ErrorFound({ errorCount, hasErrors }: { errorCount: number; hasErrors: boolean }) {
  return hasErrors ? (
    <div className={FORM_STYLES.error}>
      <AlertCircle className="size-4" />
      {errorCount} validation {FormatUtils.formatPlural(errorCount, 'issue', { showNumber: false })} found
    </div>
  ) : null;
}
