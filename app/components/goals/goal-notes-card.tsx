import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SYSTEM_CONSTANTS } from '@/lib/core/constants';
import { CheckCircle2, Edit3 } from 'lucide-react';
import { useState } from 'react';
import { ValidatedTextarea } from '../form/validated-textarea';

interface GoalNotesCardProps {
  notes: string;
  onSave: (notes: string) => void;
  validationError?: string;
}

export function GoalNotesCard({ notes, onSave, validationError }: GoalNotesCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);

  function handleSave() {
    if (isEditing) {
      onSave(localNotes);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }

  function handleCancel() {
    setLocalNotes(notes);
    setIsEditing(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notes</CardTitle>
        <div className="flex gap-2">
          {isEditing && (
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleSave}>
            {isEditing ? (
              <>
                <CheckCircle2 className="size-4 mr-1" /> Save
              </>
            ) : (
              <>
                <Edit3 className="size-4 mr-1" /> Edit
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="">
        {isEditing ? (
          <ValidatedTextarea
            id="goal-note"
            label=""
            value={localNotes || ''}
            onChange={setLocalNotes}
            placeholder="Enter goal note..."
            maxLength={SYSTEM_CONSTANTS.VALIDATION.MAX_NOTE_LENGTH}
            error={validationError}
          />
        ) : (
          <div className="whitespace-pre-wrap wrap-break-word min-h-[200px] max-h-[600px] overflow-y-auto p-4 leading-relaxed">
            {notes || 'No notes added yet.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
