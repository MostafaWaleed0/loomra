'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { GoalView } from './components/goals/goal-view';
import { HabitView } from './components/habits/habit-view';
import { LeftSidebar } from './components/layout/left-sidebar';
import { SidebarRight } from './components/layout/right-sidebar';
import { SiteHeader } from './components/layout/site-header';
import { UpdateNotification } from './components/layout/update-notification';
import { TaskView } from './components/tasks/task-view';
import { SidebarInset, SidebarProvider } from './components/ui/sidebar';
import { useGoals } from './lib/hooks/use-goals';
import { useHabits } from './lib/hooks/use-habits';
import { useTasks } from './lib/hooks/use-Tasks';

export default function GoalsTrackerApp() {
  const [activeView, setActiveView] = useState<'goals' | 'tasks' | 'habits'>('habits');

  const habitsCtx = useHabits();
  const tasksCtx = useTasks();
  const goalsCtx = useGoals(tasksCtx.tasks, tasksCtx.refreshTasks, habitsCtx.refreshHabits);

  const stats = [habitsCtx.stats, tasksCtx.stats, goalsCtx.stats];
  const isInitialLoading = habitsCtx.isLoading || tasksCtx.isLoading || goalsCtx.isLoading;

  if (isInitialLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)'
        } as React.CSSProperties
      }
    >
      <LeftSidebar variant="inset" activeView={activeView} setActiveView={setActiveView} stats={stats} />

      <SidebarInset>
        <SiteHeader activeView={activeView} />
        <UpdateNotification />
        <div className="flex flex-1 flex-col p-6">
          <div className="@container/main flex flex-1 flex-col gap-2 max-w-[85rem] w-full mx-auto">
            {activeView === 'goals' && (
              <GoalView
                getHabitsByGoalId={habitsCtx.getHabitsByGoalId}
                onCreateTask={tasksCtx.handleCreateTask}
                onEditTask={tasksCtx.handleEditTask}
                onToggleTask={tasksCtx.handleToggleTask}
                onDeleteTask={tasksCtx.handleDeleteTask}
                tasks={tasksCtx.tasks}
                {...goalsCtx}
              />
            )}
            {activeView === 'habits' && <HabitView {...habitsCtx} goals={goalsCtx.goals} />}
            {activeView === 'tasks' && <TaskView {...tasksCtx} />}
          </div>
        </div>
      </SidebarInset>
      {activeView === 'habits' && <SidebarRight {...habitsCtx} />}
    </SidebarProvider>
  );
}

function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary size-20" aria-label="Loading" />
      </div>
    </div>
  );
}
