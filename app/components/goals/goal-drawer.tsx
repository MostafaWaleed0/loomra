import { ColorPicker } from '@/components/form/color-picker';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DateUtils, GOAL_CONFIG, SYSTEM_CONSTANTS, UI_CONFIG } from '@/lib/core';
import type { Goal, GoalFormData } from '@/lib/types';
import { DatePicker } from '../form/date-picker';
import { IconSelector } from '../form/dynamic-icon-selector';
import { ValidatedInput } from '../form/validated-input';
import { ValidatedSelect } from '../form/validated-select';
import { ValidatedTextarea } from '../form/validated-textarea';

interface ValidationErrorsProps {
  errors: Record<string, string>;
}

function ValidationErrors({ errors }: ValidationErrorsProps) {
  return (
    <div>
      <p className="text-sm font-medium text-destructive mb-2">
        Please fix the following errors:
        {Object.keys(errors).length}
      </p>
    </div>
  );
}

export interface GoalEditorDrawerProps {
  selectedGoal: Goal | null;
  open: boolean;
  onClose: () => void;
  onSave: (goalId: string | undefined, updates: Partial<Goal>) => boolean | void;
  formData: GoalFormData;
  validationErrors: Record<string, string>;
  hasErrors: boolean;
  updateField: (field: keyof GoalFormData) => (value: any) => void;
}
export function GoalEditorDrawer({
  selectedGoal,
  open,
  onClose,
  onSave,
  formData,
  validationErrors,
  hasErrors,
  updateField
}: GoalEditorDrawerProps) {
  function handleSave() {
    const success = onSave(selectedGoal?.id, formData);
    if (success !== false) {
      onClose();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="min-w-md max-w-md p-0 flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between border-b p-6 shrink-0">
          <div className="flex flex-col gap-1">
            <SheetTitle>Edit Goal</SheetTitle>
          </div>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <ValidatedInput
            id="goal-title"
            label="Goal Title"
            value={formData.title || ''}
            onChange={updateField('title')}
            placeholder="Enter goal title"
            maxLength={SYSTEM_CONSTANTS.VALIDATION.MAX_NAME_LENGTH}
            error={validationErrors.title}
            required
          />
          <ValidatedTextarea
            id="goal-description"
            label="Description"
            value={formData.description || ''}
            onChange={updateField('description')}
            placeholder="Enter goal description"
            maxLength={SYSTEM_CONSTANTS.VALIDATION.MAX_DESCRIPTION_LENGTH}
            error={validationErrors.description}
          />
          <div className="grid grid-cols-2 gap-4">
            <ValidatedSelect
              id="goal-priority"
              label="Priority"
              value={formData.priority ?? ''}
              onValueChange={(value) => updateField('priority')(value)}
              placeholder="Select priority"
              options={GOAL_CONFIG.PRIORITIES}
              error={validationErrors.priority}
            />
            <ValidatedSelect
              id="goal-category"
              label="Category"
              value={formData.category ?? ''}
              onValueChange={updateField('category')}
              placeholder="Select category"
              options={GOAL_CONFIG.CATEGORIES}
              error={validationErrors.category}
            />
          </div>
          <DatePicker
            id="goal-deadline"
            label="Deadline"
            date={formData.deadline ? new Date(formData.deadline) : undefined}
            onSelect={(date) => updateField('deadline')(DateUtils.formatDate(date || ''))}
            placeholder="Select deadline"
            error={validationErrors.deadline}
            mode="full"
          />
          <IconSelector selectedIcon={formData.icon} onIconSelect={updateField('icon')} />
          <ColorPicker
            id="goal"
            colors={UI_CONFIG.COLORS.ALL}
            currentColor={formData.color}
            handleColorSelect={updateField('color')}
            error={validationErrors.color}
          />
        </div>
        <SheetFooter className="flex flex-row items-center justify-end border-t p-6 shrink-0">
          {hasErrors && <ValidationErrors errors={validationErrors} />}
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={hasErrors} className="min-w-20">
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
