import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function HabitHeader({ onCreateHabit }: any) {
  return (
    <div className="flex items-start justify-between gap-6 mb-6">
      <header>
        <h1 className="text-3xl sm:text-4xl font-extrabold ">Habit Tracker</h1>
        <p className="mt-1 text-secondary-foreground">Plan, track and celebrate progress.</p>
      </header>

      <div className="flex items-center gap-3">
        <div>
          <Button aria-label="Create habit" title="New habit" onClick={onCreateHabit}>
            <Plus className="size-4" />
            New habit
          </Button>
          {/* <Button aria-haspopup="true" aria-label="More actions" title="More" variant="secondary" size="icon">
            <MoreHorizontal />
          </Button> */}
        </div>
      </div>
    </div>
  );
}
