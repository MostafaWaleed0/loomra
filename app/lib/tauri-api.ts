import { invoke } from '@tauri-apps/api/core';
import type {
  UserData,
  Goal,
  Habit,
  HabitCompletion,
  Task,
  DateString,
  DeleteStrategy,
  NotificationPayload,
  NotificationHistory,
  NotificationSchedule
} from '../lib/types';

interface PasswordStrength {
  strength: string;
  score: number;
  feedback: string[];
}

interface AppInfo {
  version: string;
  name: string;
  authors: string;
}

// Settings Types
export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  weekStartsOn: 'sunday' | 'monday';
  timezone: string;
}

export interface HabitSettings {
  defaultReminder: boolean;
  defaultReminderTime: string;
  defaultPriority: 'low' | 'medium' | 'high';
}

export interface GoalSettings {
  deadlineWarningDays: number;
  defaultCategory: string;
  showProgressPercentage: boolean;
}

export interface NotificationSettings {
  habitReminders: boolean;
  goalDeadlines: boolean;
  streakMilestones: boolean;
  dailySummary: boolean;
  weeklySummary: boolean;
  motivationalQuotes: boolean;
}

export interface DataSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface AppSettings {
  appearance: AppearanceSettings;
  habits: HabitSettings;
  goals: GoalSettings;
  notifications: NotificationSettings;
  data: DataSettings;
}

export interface NotificationHistoryRecord {
  id: string;
  habitId: string;
  sentAt: string;
  notificationType: string;
  opened: boolean;
  actionTaken: string | null;
  payloadData: string;
}

interface AuthAPI {
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (password: string, hashedPassword: string) => Promise<boolean>;
  checkPasswordStrength: (password: string) => Promise<PasswordStrength>;
}

interface NotificationsAPI {
  sendSystemNotification: (payload: NotificationPayload) => Promise<void>;
  scheduleNotification: (schedule: NotificationSchedule) => Promise<NotificationSchedule>;
  getScheduledNotifications: () => Promise<NotificationSchedule[]>;
  getHabitNotifications: (habitId: string) => Promise<NotificationSchedule[]>;
  cancelNotification: (habitId: string) => Promise<boolean>;
  cancelAllNotifications: () => Promise<number>;
  recordNotification: (history: NotificationHistoryRecord) => Promise<NotificationHistoryRecord>;
  getNotificationHistory: (limit?: number) => Promise<NotificationHistory[]>;
  markNotificationOpened: (notificationId: string, actionTaken?: string) => Promise<void>;
  cleanNotificationHistory: (daysToKeep: number) => Promise<number>;
  checkNotificationPermission: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
}

interface GoalsAPI {
  getAllGoals: () => Promise<Goal[]>;
  getGoalById: (id: string) => Promise<Goal | null>;
  getGoalsByStatus: (status: string) => Promise<Goal[]>;
  createGoal: (goal: Goal) => Promise<Goal>;
  updateGoal: (goal: Goal) => Promise<Goal>;
  deleteGoal: (id: string, deleteStrategy?: DeleteStrategy) => Promise<boolean>;
}

interface TasksAPI {
  getAllTasks: () => Promise<Task[]>;
  getTaskById: (taskId: string) => Promise<Task | null>;
  getTasksByGoalId: (goalId: string) => Promise<Task[]>;
  getTasksByStatus: (done: boolean) => Promise<Task[]>;
  getSubtasks: (parentTaskId: string) => Promise<Task[]>;
  createTask: (task: Task) => Promise<Task>;
  updateTask: (task: Task) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<boolean>;
  toggleTaskStatus: (taskId: string) => Promise<boolean>;
}

interface HabitsAPI {
  getAllHabits: () => Promise<Habit[]>;
  getHabitById: (id: string) => Promise<Habit | null>;
  getHabitsByCategory: (category: string) => Promise<Habit[]>;
  createHabit: (habit: Habit) => Promise<Habit>;
  updateHabit: (habit: Habit) => Promise<Habit>;
  deleteHabit: (id: string) => Promise<boolean>;
}

interface HabitCompletionsAPI {
  getHabitCompletions: (
    habitId: string,
    startDate: DateString | null,
    endDate: DateString | null,
    limit?: number
  ) => Promise<HabitCompletion[]>;
  getCompletionByDate: (habitId: string, date: DateString) => Promise<HabitCompletion | null>;
  getHabitStreak: (habitId: string) => Promise<number>;
  createHabitCompletion: (completion: HabitCompletion) => Promise<HabitCompletion>;
  updateHabitCompletion: (completion: HabitCompletion) => Promise<HabitCompletion>;
  deleteHabitCompletion: (id: string) => Promise<boolean>;
}

interface SettingsAPI {
  getSettings: () => Promise<AppSettings | null>;
  saveSettings: (settings: AppSettings) => Promise<AppSettings>;
  updateAppearanceSettings: (appearance: AppearanceSettings) => Promise<AppSettings>;
  updateHabitSettings: (habits: HabitSettings) => Promise<AppSettings>;
  updateGoalSettings: (goals: GoalSettings) => Promise<AppSettings>;
  updateNotificationSettings: (notifications: NotificationSettings) => Promise<AppSettings>;
  updateDataSettings: (data: DataSettings) => Promise<AppSettings>;
  resetSettings: (args: { defaultSettings: AppSettings }) => Promise<AppSettings>;
  exportAllData: () => Promise<string>;
  importAllData: (jsonData: string) => Promise<string>;
  exportSettings: () => Promise<string>;
  importSettings: (jsonData: string) => Promise<AppSettings>;
}

interface UpdatersAPI {
  getAppVersion: () => Promise<string>;
  getAppInfo: () => Promise<AppInfo>;
  getAppDataDir: () => Promise<string>;
  getAppLogDir: () => Promise<string>;
  isDevMode: () => Promise<boolean>;
}

interface UserDataAPI {
  get: () => Promise<UserData | null>;
  save: (userData: UserData) => Promise<void>;
  update: (field: string, value: any) => Promise<void>;
  updateBatch: (updates: Record<string, any>) => Promise<void>;
  getField: (field: string) => Promise<any>;
  delete: () => Promise<void>;
  exists: () => Promise<boolean>;
}

interface TauriAPI {
  auth: AuthAPI;
  userData: UserDataAPI;
  goals: GoalsAPI;
  tasks: TasksAPI;
  habits: HabitsAPI;
  habitCompletions: HabitCompletionsAPI;
  settings: SettingsAPI;
  updater: UpdatersAPI;
  notifications: NotificationsAPI;
}

const tauriAPI: TauriAPI = {
  auth: {
    hashPassword: (password) => invoke('hash_password', { password }),
    verifyPassword: (password, hashedPassword) => invoke('verify_password', { password, hashedPassword }),
    checkPasswordStrength: (password) => invoke('check_password_strength', { password })
  },

  userData: {
    get: () => invoke('get_user_data'),
    save: (userData) => invoke('save_user_data', { userData }),
    update: (field, value) => invoke('update_user_data', { field, value }),
    updateBatch: (updates) => invoke('update_user_data_batch', { updates }),
    getField: (field) => invoke('get_user_data_field', { field }),
    delete: () => invoke('delete_user_data'),
    exists: () => invoke('user_data_exists')
  },

  goals: {
    createGoal: (goal) => invoke('create_goal', { goal }),
    updateGoal: (goal) => invoke('update_goal', { goal }),
    deleteGoal: (id, deleteStrategy) => invoke('delete_goal', { id, deleteStrategy }),
    getAllGoals: () => invoke('get_all_goals'),
    getGoalById: (id) => invoke('get_goal_by_id', { id }),
    getGoalsByStatus: (status) => invoke('get_goals_by_status', { status })
  },

  tasks: {
    createTask: (task) => invoke('create_task', { task }),
    updateTask: (task) => invoke('update_task', { task }),
    deleteTask: (id) => invoke('delete_task', { id }),
    getAllTasks: () => invoke('get_all_tasks'),
    getTaskById: (id) => invoke('get_task_by_id', { id }),
    getTasksByGoalId: (goalId) => invoke('get_tasks_by_goal_id', { goalId }),
    getTasksByStatus: (done) => invoke('get_tasks_by_status', { done }),
    getSubtasks: (parentTaskId) => invoke('get_subtasks', { parentTaskId }),
    toggleTaskStatus: (id) => invoke('toggle_task_status', { id })
  },

  habits: {
    createHabit: (habit) => invoke('create_habit', { habit }),
    updateHabit: (habit) => invoke('update_habit', { habit }),
    deleteHabit: (id) => invoke('delete_habit', { id }),
    getAllHabits: () => invoke('get_all_habits'),
    getHabitById: (id) => invoke('get_habit_by_id', { id }),
    getHabitsByCategory: (category) => invoke('get_habits_by_category', { category })
  },

  habitCompletions: {
    createHabitCompletion: (completion) => invoke('create_habit_completion', { completion }),
    updateHabitCompletion: (completion) => invoke('update_habit_completion', { completion }),
    deleteHabitCompletion: (id) => invoke('delete_habit_completion', { id }),
    getHabitCompletions: (habitId, startDate, endDate, limit) =>
      invoke('get_habit_completions', { habitId, startDate, endDate, limit }),
    getCompletionByDate: (habitId, date) => invoke('get_completion_by_date', { habitId, date }),
    getHabitStreak: (habitId) => invoke('get_habit_streak', { habitId })
  },

  settings: {
    getSettings: () => invoke('get_settings'),
    saveSettings: (settings) => invoke('save_settings', { settings }),
    updateAppearanceSettings: (appearance) => invoke('update_appearance_settings', { appearance }),
    updateHabitSettings: (habits) => invoke('update_habit_settings', { habits }),
    updateGoalSettings: (goals) => invoke('update_goal_settings', { goals }),
    updateNotificationSettings: (notifications) => invoke('update_notification_settings', { notifications }),
    updateDataSettings: (data) => invoke('update_data_settings', { data }),
    resetSettings: (args) => invoke('reset_settings', args),
    exportAllData: () => invoke('export_all_data'),
    importAllData: (jsonData) => invoke('import_all_data', { jsonData }),
    exportSettings: () => invoke('export_settings'),
    importSettings: (jsonData) => invoke('import_settings', { jsonData })
  },

  notifications: {
    sendSystemNotification: (payload) => invoke('send_system_notification', { payload }),
    scheduleNotification: (schedule) => invoke('schedule_notification', { schedule }),
    getScheduledNotifications: () => invoke('get_scheduled_notifications'),
    getHabitNotifications: (habitId) => invoke('get_habit_notifications', { habitId }),
    cancelNotification: (habitId) => invoke('cancel_notification', { habitId }),
    cancelAllNotifications: () => invoke('cancel_all_notifications'),
    recordNotification: (history) => invoke('record_notification', { history }),
    getNotificationHistory: (limit) => invoke('get_notification_history', { limit: limit ?? null }),
    markNotificationOpened: (notificationId, actionTaken) =>
      invoke('mark_notification_opened', { notificationId, actionTaken: actionTaken ?? null }),
    cleanNotificationHistory: (daysToKeep) => invoke('clean_notification_history', { daysToKeep }),
    checkNotificationPermission: () => invoke('check_notification_permission'),
    requestNotificationPermission: () => invoke('request_notification_permission')
  },

  updater: {
    getAppVersion: () => invoke('get_app_version'),
    getAppInfo: () => invoke('get_app_info'),
    getAppDataDir: () => invoke('get_app_data_dir'),
    getAppLogDir: () => invoke('get_app_log_dir'),
    isDevMode: () => invoke('is_dev_mode')
  }
};

export const isTauri = (): boolean => typeof window !== 'undefined' && '__TAURI__' in window;
export const appAPI = tauriAPI;
export const backend = tauriAPI;
export { tauriAPI as commands };
