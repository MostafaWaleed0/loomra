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
import type { Habit } from '@/lib/types';

interface HabitDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit;
  onDelete: (habitId: string) => void;
}

export function HabitDeleteDialog({ open, onOpenChange, habit, onDelete }: HabitDeleteDialogProps) {
  function handleDelete() {
    onDelete(habit.id);
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Habit: {habit.name}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this habit? This action cannot be undone and will remove all associated completion
            history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Delete Habit
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
