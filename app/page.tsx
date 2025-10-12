'use client';
import { motion } from 'framer-motion';
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
  const [version, setVersion] = useState<string | null>(null);

  const habitsCtx = useHabits();
  const tasksCtx = useTasks();
  const goalsCtx = useGoals(tasksCtx.tasks, tasksCtx.refreshTasks, habitsCtx.refreshHabits);

  useEffect(() => {
    window.electronAPI.updater
      .getAppVersion()
      .then(setVersion)
      .catch((error) => {
        console.error('Failed to fetch app version:', error);
        setVersion('Unknown');
      });
  }, []);

  useEffect(() => {
    if (!habitsCtx.isLoading && !tasksCtx.isLoading && !goalsCtx.isLoading && version) {
      const timer = setTimeout(() => setIsInitializing(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [habitsCtx.isLoading, tasksCtx.isLoading, goalsCtx.isLoading, version]);

  if (isInitializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        {version ? (
          <motion.div
            className="flex flex-col gap-4 items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1],
              opacity: { duration: 0.4 }
            }}
          >
            <div className="relative">
              <svg
                width={80}
                height={80}
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-primary"
              >
                <motion.path
                  d="M21.801 10A10 10 0 1 1 17 3.335"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 1.2,
                    ease: [0.65, 0, 0.35, 1],
                    opacity: { duration: 0.3 }
                  }}
                />
                <motion.path
                  d="m9 11 3 3L22 4"
                  initial={{ pathLength: 0, opacity: 0, scale: 0.5 }}
                  animate={{ pathLength: 1, opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.9,
                    ease: [0.34, 1.56, 0.64, 1],
                    pathLength: { ease: [0.65, 0, 0.35, 1] }
                  }}
                  style={{ transformOrigin: '14px 11px' }}
                />
              </svg>
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 1.2],
                  opacity: [0, 0.6, 0.4]
                }}
                transition={{
                  duration: 1.4,
                  ease: [0.34, 1.56, 0.64, 1],
                  times: [0, 0.6, 1]
                }}
              />
            </div>
            <motion.div
              className="font-bold text-xl tracking-wide"
              initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.7,
                delay: 1.2,
                ease: [0.34, 1.56, 0.64, 1]
              }}
            >
              {version}
            </motion.div>
          </motion.div>
        ) : null}
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
