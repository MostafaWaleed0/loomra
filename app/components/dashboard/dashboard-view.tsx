'use client';
import { useUserData } from '@/lib/hooks/use-user-data';
import type {
  GoalStats,
  GoalWithStats,
  HabitCompletion,
  HabitStats,
  TaskStats,
  TaskWithStats,
  UseHabitsReturn,
  UseTasksReturn
} from '@/lib/types';
import { CheckSquare, Flame, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SectionHeader } from '../layout/section-header';
import { Card, CardContent } from '../ui/card';
import { DashboardGoals } from './dashboard-goals';
import { DashboardHabits } from './dashboard-habits';
import { DashboardTasks } from './dashboard-tasks';

interface DashboardViewProps {
  goals: GoalWithStats[];
  tasks: TaskWithStats[];
  tasksStats: TaskStats;
  habitsStats: HabitStats;
  getHabitsWithMetadata: UseHabitsReturn['getHabitsWithMetadata'];
  completions: HabitCompletion[];
  onSetHabitCompletion: UseHabitsReturn['setHabitCompletion'];
  goalsStats: GoalStats;
  onCreateTask: UseTasksReturn['handleCreateTask'];
  onToggleTask: UseTasksReturn['handleToggleTask'];
  onEditTask: UseTasksReturn['handleEditTask'];
  onDeleteTask: UseTasksReturn['handleDeleteTask'];
}

export function DashboardView({
  goals,
  tasks,
  tasksStats,
  habitsStats,
  getHabitsWithMetadata,
  completions,
  onSetHabitCompletion,
  goalsStats,
  onCreateTask,
  onToggleTask,
  onEditTask,
  onDeleteTask
}: DashboardViewProps) {
  const [timeOfDay, setTimeOfDay] = useState('morning');

  const { userData } = useUserData();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  const stats = {
    totalGoals: goalsStats.totalGoals,
    activeGoals: goalsStats.activeGoals,
    avgProgressGoals: goalsStats.avgProgress,
    completedGoals: goalsStats.completedGoals,
    totalTasks: tasksStats.totalTasks,
    completedTaskCount: tasksStats.completedTasks,
    overdueTasks: tasksStats.overdueTasks,
    totalHabits: habitsStats.totalTodayHabit,
    completedHabits: habitsStats.completed,
    longestStreak: habitsStats.bestStreak,
    avgCompletionRate: habitsStats.avgCompletion
  };

  const getGreeting = () => {
    const name = userData?.name?.trim() || 'there';
    switch (timeOfDay) {
      case 'morning':
        return `Good Morning, ${name}! ☀️`;
      case 'afternoon':
        return `Good Afternoon, ${name}! 👋`;
      case 'evening':
        return `Good Evening, ${name}! 🌙`;
      default:
        return `Hello, ${name}!`;
    }
  };

  return (
    <div>
      <SectionHeader title={getGreeting()} description="Here's what's happening with your goals today" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 size-32 bg-blue-100 dark:bg-blue-400 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 size-24 bg-blue-100 dark:bg-blue-400 rounded-full -ml-12 -mb-12" />
          <CardContent className="px-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="size-14 rounded-xl bg-blue-500 flex items-center justify-center">
                <Target className="size-7 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold mb-2">{stats.activeGoals}</h3>
            <p className="text-muted-foreground text-sm font-medium">Active Goals</p>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>Total: {stats.totalGoals}</span>
                <span className="font-semibold">{stats.avgProgressGoals}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Completed Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 size-32 bg-green-100 dark:bg-green-400 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 size-24 bg-green-100 dark:bg-green-400 rounded-full -ml-12 -mb-12" />
          <CardContent className="px-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="size-14 rounded-xl bg-green-500 flex items-center justify-center">
                <CheckSquare className="size-7 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold mb-2 ">
              {stats.completedTaskCount}/{stats.totalTasks}
            </h3>
            <p className="text-muted-foreground text-sm font-medium">Tasks Completed</p>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>Overdue: {stats.overdueTasks}</span>
                <span className="font-semibold">{Math.round((stats.completedTaskCount / stats.totalTasks) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak Record Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 size-32 bg-orange-100 dark:bg-orange-400 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 size-24 bg-orange-100 dark:bg-orange-400 rounded-full -ml-12 -mb-12" />
          <CardContent className="px-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="size-14 rounded-xl bg-orange-500 flex items-center justify-center">
                <Flame className="size-7 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-bold mb-2">{stats.longestStreak}</h3>
            <p className="text-muted-foreground text-sm font-medium">Day Streak Record</p>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>
                  Today: {stats.completedHabits}/{stats.totalHabits}
                </span>
                <span className="font-semibold">{stats.avgCompletionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="col-span-3 space-y-6">
          <DashboardGoals goals={goals} />
          <DashboardTasks
            tasks={tasks}
            onCreateTask={onCreateTask}
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
            onEditTask={onEditTask}
          />
        </div>
        <div className="col-span-2 space-y-6">
          <DashboardHabits
            completions={completions}
            onSetHabitCompletion={onSetHabitCompletion}
            getHabitsWithMetadata={getHabitsWithMetadata}
          />
        </div>
      </div>
    </div>
  );
}
