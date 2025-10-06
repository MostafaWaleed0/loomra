import { Goal, Habit, Task, HabitCompletion, DateString, DeleteStrategy } from '../lib/types';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
  releaseName?: string;
  releaseNotesUrl?: string;
}

interface DownloadProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

interface UpdateStatus {
  status:
    | 'checking-for-update'
    | 'update-available'
    | 'update-not-available'
    | 'downloading-update'
    | 'update-downloaded'
    | 'update-error';
  data?: UpdateInfo | DownloadProgress | Error | null;
}

interface CheckUpdateResult {
  available: boolean;
  info?: UpdateInfo;
  message?: string;
  error?: string;
}

interface GoalsAPI {
  getAllGoals: () => Promise<Goal[]>;
  getGoalById: (id: string) => Promise<Goal | null>;
  createGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Goal>;
  updateGoal: (goal: Goal) => Promise<Goal>;
  deleteGoal: (id: string, deleteStrategy?: DeleteStrategy) => Promise<boolean>;
}

interface TasksAPI {
  getAllTasks: () => Promise<TaskWithStats[]>;
  createTask: (task: Task) => Promise<Task>;
  updateTask: (task: Task) => Promise<Task>;
  deleteTask: (taskId: EntityId) => Promise<boolean>;
  getTaskById: (taskId: EntityId) => Promise<Task | null>;
  getTasksByGoalId: (goalId: EntityId) => Promise<Task[]>;
}

interface HabitsAPI {
  getAllHabits: () => Promise<Habit[]>;
  getHabitById: (id: string) => Promise<Habit | null>;
  createHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Habit>;
  updateHabit: (habit: Habit) => Promise<Habit>;
  deleteHabit: (id: string) => Promise<void>;
}

interface HabitCompletionsAPI {
  getHabitCompletions: (habitId: string, startDate: DateString | null, endDate: DateString | null) => Promise<HabitCompletion[]>;
  createHabitCompletion: (completion: Omit<HabitCompletion, 'id' | 'createdAt' | 'updatedAt'>) => Promise<HabitCompletion>;
  updateHabitCompletion: (completion: HabitCompletion) => Promise<HabitCompletion>;
  deleteHabitCompletion: (id: string) => Promise<void>;
}

interface UpdatersAPI {
  checkForUpdates: () => Promise<CheckUpdateResult>;
  downloadUpdate: () => Promise<{ success: boolean; message?: string }>;
  installUpdate: () => Promise<{ success: boolean; message?: string }>;
  getAppVersion: () => Promise<string>;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void;
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void;
}

interface ElectronAPI {
  goals: GoalsAPI;
  tasks: TasksAPI;
  habits: HabitsAPI;
  habitCompletions: HabitCompletionsAPI;
  updater: UpdatersAPI;
  setTheme: (theme: 'light' | 'dark') => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
