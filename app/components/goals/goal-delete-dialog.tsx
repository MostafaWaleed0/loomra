import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { DeleteStrategy, Goal } from '@/lib/types';

interface GoalDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
  taskCount: number;
  onDelete: (strategy: DeleteStrategy) => void;
}

export function GoalDeleteDialog({ open, onOpenChange, goal, taskCount, onDelete }: GoalDeleteDialogProps) {
  function handleDelete(strategy: DeleteStrategy) {
    onDelete(strategy);
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Goal: {goal.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {taskCount > 0 ? (
              <>
                This goal has {taskCount} associated task{taskCount !== 1 ? 's' : ''}. What would you like to do?
              </>
            ) : (
              'Are you sure you want to delete this goal? This action cannot be undone.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {taskCount > 0 ? (
            <>
              <Button variant="secondary" onClick={() => handleDelete('unlink')}>
                Keep Tasks (Unlink)
              </Button>
              <Button variant="destructive" onClick={() => handleDelete('cascade')}>
                Delete Goal & Tasks
              </Button>
            </>
          ) : (
            <Button
              variant="destructive"
              onClick={() => handleDelete('unlink')}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Goal
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
