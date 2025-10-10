'use client';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardView } from './components/dashboard/dashboard-view';
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
import { useLocalState } from './lib/hooks/use-local-state';
import { useTasks } from './lib/hooks/use-tasks';

export default function GoalsTrackerApp() {
  const [activeView, setActiveView] = useLocalState('active-view', 'goals');
  const [open, setOpen] = useLocalState<boolean>('left-sidebar-open', true);
  const [isInitializing, setIsInitializing] = useState(true);

  const habitsCtx = useHabits();
  const tasksCtx = useTasks();
  const goalsCtx = useGoals(tasksCtx.tasks, tasksCtx.refreshTasks, habitsCtx.refreshHabits);

  useEffect(() => {
    if (!habitsCtx.isLoading && !tasksCtx.isLoading && !goalsCtx.isLoading) {
      setIsInitializing(false);
    }
  }, [habitsCtx.isLoading, tasksCtx.isLoading, goalsCtx.isLoading]);

  if (isInitializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary size-20" />
      </div>
    );
  }

  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)'
        } as React.CSSProperties
      }
    >
      <LeftSidebar variant="inset" activeView={activeView} setActiveView={setActiveView} />
      <SidebarInset>
        <SiteHeader activeView={activeView} />
        <UpdateNotification />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 p-6">
            {activeView === 'dashboard' && (
              <DashboardView
                goals={goalsCtx.goals}
                goalsStats={goalsCtx.stats}
                habitsStats={habitsCtx.stats}
                getHabitsWithMetadata={habitsCtx.getHabitsWithMetadata}
                completions={habitsCtx.completions}
                onSetHabitCompletion={habitsCtx.setHabitCompletion}
                tasks={tasksCtx.tasks}
                tasksStats={tasksCtx.stats}
                onCreateTask={tasksCtx.handleCreateTask}
                onEditTask={tasksCtx.handleEditTask}
                onToggleTask={tasksCtx.handleToggleTask}
                onDeleteTask={tasksCtx.handleDeleteTask}
              />
            )}
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
