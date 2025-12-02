'use client';
import type { DateString, NotificationSettings } from '@/lib/types';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardView } from './components/dashboard/dashboard-view';
import { GoalView } from './components/goals/goal-view';
import { HabitView } from './components/habits/habit-view';
import { LeftSidebar } from './components/layout/left-sidebar';
import { SidebarRight } from './components/layout/right-sidebar';
import { SiteHeader } from './components/layout/site-header';
import { NotificationProvider } from './components/notifications/notification-provider';
import { SettingView } from './components/setting/setting-view';
import { TaskView } from './components/tasks/task-view';
import { SidebarInset, SidebarProvider } from './components/ui/sidebar';
import { useSettings } from './lib/context/settings-context';
import { useGoals } from './lib/hooks/use-goals';
import { useHabits } from './lib/hooks/use-habits';
import { useLocalState } from './lib/hooks/use-local-state';
import { useTasks } from './lib/hooks/use-tasks';
import { useUserData } from './lib/hooks/use-user-data';
import { commands } from './lib/tauri-api';
import { PasswordVerifyScreen } from './password-verify-screen';
import { SetupScreen } from './setup-screen';

// Constants
const SPLASH_SCREEN_DURATION = 2000;
const SIDEBAR_WIDTH = 'calc(var(--spacing) * 72)';
const HEADER_HEIGHT = 'calc(var(--spacing) * 12)';

// Loading/Splash Screen Component
function SplashScreen({ version }: { version: string | null }) {
  if (!version) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
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
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width={120}
            height={120}
            viewBox="0 0 1024 1024"
            preserveAspectRatio="xMidYMid meet"
            aria-label="Application logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.34, 1.56, 0.64, 1]
            }}
          >
            <motion.rect
              width="1024"
              height="1024"
              rx="128"
              fill="white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.4,
                ease: [0.34, 1.56, 0.64, 1]
              }}
            />
            <motion.g
              transform="translate(0,1024) scale(0.1,-0.1)"
              fill="#e60076"
              stroke="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: [0.65, 0, 0.35, 1]
              }}
            >
              <path
                d="M1034 10224 c-382 -64 -724 -317 -899 -664 -46 -90 -87 -210 -112
    -322 -17 -80 -18 -253 -18 -4118 0 -3902 1 -4038 19 -4120 115 -523 510 -907
    1015 -986 84 -13 581 -14 4121 -11 3776 3 4029 4 4095 20 516 128 838 451 961
    967 18 72 19 262 21 4088 3 4444 8 4109 -62 4319 -65 195 -164 353 -311 497
    -160 157 -338 254 -594 323 -61 17 -286 18 -4110 19 -3371 2 -4058 0 -4126
    -12z m4556 -1888 c0 -118 -3 -217 -7 -219 -5 -3 -216 -31 -471 -63 -255 -32
    -467 -61 -471 -64 -8 -5 -16 -636 -28 -2205 -6 -860 10 -3263 23 -3432 l6 -73
    1012 1 c558 0 1022 2 1033 5 16 5 30 54 97 352 42 191 110 491 149 667 l72
    320 425 0 424 0 -2 -55 c-2 -30 -11 -192 -22 -360 -11 -168 -31 -485 -45 -705
    -14 -220 -31 -485 -38 -590 l-12 -190 -2667 -3 -2668 -2 0 235 0 235 23 4 c12
    3 159 21 327 40 168 20 366 44 441 53 l137 16 8 826 c8 800 8 3779 0 3951 -2
    47 -4 272 -5 501 l-1 415 -247 33 c-137 18 -336 43 -443 57 -107 14 -205 27
    -217 30 -23 4 -23 5 -23 219 l0 215 1595 0 1595 0 0 -214z"
              />
            </motion.g>
          </motion.svg>
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
          className="font-bold text-xl tracking-wide text-muted-foreground"
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
    </div>
  );
}

// Main App Component
export default function GoalsTrackerApp() {
  const { settings } = useSettings();
  const [activeView, setActiveView] = useLocalState('active-view', 'goals');
  const [isSettingVisible, setSettingVisible] = useState(false);
  const [open, setOpen] = useLocalState<boolean>('left-sidebar-open', true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [version, setVersion] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showPasswordVerify, setShowPasswordVerify] = useState(false);

  // Data Hooks
  const {
    userData,
    isLoading: isUserDataLoading,
    saveUserData,
    verifyPassword,
    changePassword,
    updateUserData,
    isAuthenticated
  } = useUserData();
  const habitsCtx = useHabits();
  const tasksCtx = useTasks();
  const goalsCtx = useGoals(tasksCtx.tasks, tasksCtx.refreshTasks, habitsCtx.refreshHabits, settings.goals);

  // Create notification settings from app settings
  const notificationSettings: NotificationSettings = {
    habitReminders: settings.notifications.habitReminders,
    streakReminders: settings.notifications.streakReminders,
    goalDeadlines: settings.notifications.goalDeadlines
  };

  // Handler for completing habit from notification
  const handleCompleteHabitFromNotification = async (habitId: string, date: DateString) => {
    await habitsCtx.setHabitCompletion(habitId, date, true, {
      actualAmount: 1,
      note: '',
      mood: null,
      difficulty: null,
      skipped: false
    });
  };

  // Handler for skipping habit from notification
  const handleSkipHabitFromNotification = async (habitId: string, date: DateString) => {
    await habitsCtx.setHabitCompletion(habitId, date, false, {
      actualAmount: 0,
      note: '',
      mood: null,
      difficulty: null,
      skipped: true
    });
  };

  // Check if all data is loaded
  const isDataLoaded = useMemo(() => {
    return !habitsCtx.isLoading && !tasksCtx.isLoading && !goalsCtx.isLoading && !isUserDataLoading && version !== null;
  }, [habitsCtx.isLoading, tasksCtx.isLoading, goalsCtx.isLoading, isUserDataLoading, version]);

  // Fetch app version on mount
  useEffect(() => {
    commands.updater
      .getAppVersion()
      .then(setVersion)
      .catch((error) => {
        console.error('Failed to fetch app version:', error);
        setVersion('Unknown');
      });
  }, []);

  // Handle initialization and determine which screen to show
  useEffect(() => {
    if (!isDataLoaded) return;

    const timer = setTimeout(() => {
      setIsInitializing(false);

      // Determine which screen to show based on user state
      if (!userData?.name) {
        // New user - show setup
        setShowSetup(true);
        setShowPasswordVerify(false);
      } else if (!isAuthenticated) {
        // Existing user not authenticated - show password verification
        setShowSetup(false);
        setShowPasswordVerify(true);
      } else {
        // Authenticated user - show main app
        setShowSetup(false);
        setShowPasswordVerify(false);
      }
    }, SPLASH_SCREEN_DURATION);

    return () => clearTimeout(timer);
  }, [isDataLoaded, userData?.name, isAuthenticated]);

  // Handlers
  const handleSetupComplete = useCallback(() => {
    setShowSetup(false);
    // After setup, user should be authenticated automatically
  }, []);

  const handlePasswordVerify = useCallback(
    async (password: string): Promise<boolean> => {
      const isValid = await verifyPassword(password);
      if (isValid) {
        setShowPasswordVerify(false);
      }
      return isValid;
    },
    [verifyPassword]
  );

  // Sidebar style configuration
  const sidebarStyle = useMemo(
    () =>
      ({
        '--sidebar-width': SIDEBAR_WIDTH,
        '--header-height': HEADER_HEIGHT
      } as React.CSSProperties),
    []
  );

  // Render password verification screen
  if (showPasswordVerify && userData?.name) {
    return <PasswordVerifyScreen onVerify={handlePasswordVerify} userName={userData.name} />;
  }

  // Render setup screen for new users
  if (showSetup) {
    return <SetupScreen onComplete={handleSetupComplete} saveUserData={saveUserData} />;
  }

  // Render loading/splash screen
  if (isInitializing) {
    return <SplashScreen version={version} />;
  }

  return (
    <NotificationProvider
      habits={habitsCtx.habits}
      completions={habitsCtx.completions}
      onComplete={handleCompleteHabitFromNotification}
      onSkip={handleSkipHabitFromNotification}
      settings={notificationSettings}
    >
      <SidebarProvider open={open} onOpenChange={setOpen} style={sidebarStyle}>
        <LeftSidebar
          variant="inset"
          setSettingVisible={setSettingVisible}
          userData={userData}
          activeView={activeView}
          setActiveView={setActiveView}
        />
        <SidebarInset>
          <SiteHeader activeView={activeView} />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2 p-6">
              {activeView === 'dashboard' && (
                <DashboardView
                  goals={goalsCtx.goals}
                  goalsStats={goalsCtx.stats}
                  habitsStats={habitsCtx.stats}
                  getHabitsWithMetadata={habitsCtx.getHabitsWithMetadata}
                  getGoalByTaskId={goalsCtx.getGoalByTaskId}
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
                  settings={settings.goals}
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
              {activeView === 'tasks' && <TaskView {...tasksCtx} getGoalByTaskId={goalsCtx.getGoalByTaskId} />}
            </div>
          </div>
        </SidebarInset>
        {activeView === 'habits' && <SidebarRight {...habitsCtx} />}
        <SettingView
          isSettingVisible={isSettingVisible}
          setSettingVisible={setSettingVisible}
          userData={userData}
          onUpdateUserData={updateUserData}
          onChangePassword={changePassword}
        />
      </SidebarProvider>
    </NotificationProvider>
  );
}
