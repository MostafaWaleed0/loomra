import { HABIT_CONFIG, GOAL_CONFIG, UI_CONFIG, WEEK_DAYS, TASK_CONFIG } from './core/constants';

export interface UserData {
  name: string;
  passwordHash?: string;
  createdAt?: string;
  lastLogin?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    language?: string;
  };
}

export interface UserSetupData {
  name: string;
  password: string;
  confirmPassword?: string;
}

// ============================================================================
// BASE TYPES
// ============================================================================

export type Timestamp = string; // ISO 8601 format
export type DateString = string; // YYYY-MM-DD format
export type TimeString = string; // HH:MM format

// ============================================================================
// ENUM-LIKE TYPES FROM CONSTANTS
// ============================================================================

export type HabitFrequencyType = (typeof HABIT_CONFIG.FREQUENCIES)[keyof typeof HABIT_CONFIG.FREQUENCIES];
export type HabitPriority = (typeof HABIT_CONFIG.PRIORITIES)[number];
export type HabitCategory = (typeof HABIT_CONFIG.CATEGORIES)[number];
export type HabitUnit = (typeof HABIT_CONFIG.UNITS)[number];
export type HabitStatus = (typeof HABIT_CONFIG.STATUS)[keyof typeof HABIT_CONFIG.STATUS];
export type HabitPeriod = (typeof HABIT_CONFIG.PERIODS)[number];

export type GoalStatus = (typeof GOAL_CONFIG.STATUS)[keyof typeof GOAL_CONFIG.STATUS];
export type GoalPriority = (typeof GOAL_CONFIG.PRIORITIES)[number];
export type GoalCategory = (typeof GOAL_CONFIG.CATEGORIES)[number];

export type TaskPriority = (typeof TASK_CONFIG.PRIORITIES)[number];

export type WeekDay = (typeof WEEK_DAYS)[number]['key'];
export type IconName = (typeof UI_CONFIG.ICONS.AVAILABLE)[number];
export type ColorPalette = (typeof UI_CONFIG.COLORS.ALL)[number];

export type MoodValue = (typeof UI_CONFIG.STATUS_OPTIONS.MOOD)[number]['value'];
export type DifficultyValue = (typeof UI_CONFIG.STATUS_OPTIONS.DIFFICULTY)[number]['value'];
export type DeleteStrategy = 'unlink' | 'cascade';
export type GoalSortBy = 'title' | 'deadline' | 'priority' | 'createdAt';

// ============================================================================
// FREQUENCY TYPES
// ============================================================================

export interface DailyFrequencyValue {
  type: 'daily';
  value: WeekDay[];
}

export interface IntervalFrequencyValue {
  type: 'interval';
  value: {
    interval: number;
  };
}

export interface XTimesPerPeriodFrequencyValue {
  type: 'x_times_per_period';
  value: {
    repetitionsPerPeriod: number;
    period: HabitPeriod;
  };
}

export interface SpecificDatesFrequencyValue {
  type: 'specific_dates';
  value: number[]; // Days of month (1-31)
}

export type HabitFrequency =
  | DailyFrequencyValue
  | IntervalFrequencyValue
  | XTimesPerPeriodFrequencyValue
  | SpecificDatesFrequencyValue;

export type HabitFrequencyWithSummary = HabitFrequency & {
  summary?: string;
};

// ============================================================================
// REMINDER TYPE
// ============================================================================

export interface HabitReminder {
  enabled: boolean;
  time: TimeString;
}

// ============================================================================
// Notification TYPE
// ============================================================================

export interface NotificationSchedule {
  habitId: string;
  habitName: string;
  scheduledTime: string;
  notificationType: string;
  isRecurring: boolean;
}

export interface NotificationPayload {
  id: string;
  habitId: string;
  title: string;
  body: string;
  type: 'reminder' | 'streak' | 'milestone' | 'daily_summary' | 'goal_deadline';
  scheduledFor: DateString;
  icon?: string;
  actions?: NotificationAction[];
  data?: Record<string, any>;
}

export interface NotificationAction {
  action: string;
  title: string;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // HH:MM format
  streakReminders: boolean;
  milestoneReminders: boolean;
  dailySummary: boolean;
  dailySummaryTime: string;
  goalDeadlines?: boolean;
}

export interface ScheduledNotification {
  id: string;
  habitId: string;
  scheduledTime: string;
  payload: NotificationPayload;
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: string;
}

export interface NotificationHistory {
  id: string;
  habitId: string;
  sentAt: string;
  type: string;
  opened: boolean;
  actionTaken?: string;
}

// ============================================================================
// HABIT TYPES
// ============================================================================

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  icon: IconName;
  color: string;
  targetAmount: number;
  unit: HabitUnit;
  frequency: HabitFrequency;
  priority: HabitPriority;
  notes: string;
  linkedGoals: string[];
  startDate: DateString;
  reminder: HabitReminder;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HabitFormData {
  name: string;
  category: HabitCategory;
  icon: IconName;
  color: string;
  targetAmount: number | string;
  unit: HabitUnit;
  frequency: Partial<HabitFrequency> | HabitFrequency;
  priority: HabitPriority;
  notes: string;
  linkedGoals: string[];
  startDate: DateString;
  reminder: HabitReminder;
}

export interface HabitWithMetadata extends Habit {
  frequencySummary: string;
  actualAmount: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  totalCompletions: number;
  lastCompletedAt: DateString | null;
  completionsThisWeek: number;
  completionsThisMonth: number;
}

export interface HabitWithStatus extends Habit {
  isScheduled: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  actualAmount: number;
  canComplete: boolean;
}

// ============================================================================
// COMPLETION TYPES
// ============================================================================

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: DateString;
  completed: boolean;
  actualAmount: number;
  targetAmount: number;
  completedAt: Timestamp | null;
  note: string;
  mood: MoodValue | null;
  difficulty: DifficultyValue | null;
  skipped: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompletionRecord {
  completed: boolean;
  actualAmount: number;
  targetAmount: number;
  completedAt: Timestamp | null;
  note: string;
  mood: MoodValue | null;
  difficulty: DifficultyValue | null;
  skipped: boolean;
}

export interface CompletionUpdateData extends Partial<CompletionRecord> {
  completed: boolean;
}

// ============================================================================
// GOAL TYPES
// ============================================================================

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  priority: GoalPriority;
  status: GoalStatus;
  deadline: DateString | undefined;
  icon: IconName;
  notes: string;
  color: string;
  linkedHabits: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GoalFormData {
  title: string;
  description: string;
  category: GoalCategory;
  priority: GoalPriority;
  status: GoalStatus;
  deadline: DateString | undefined;
  icon: IconName;
  notes: string;
  color: string;
}

export interface GoalWithStats extends Goal {
  progress: number;
  taskCount: number;
  completedTaskCount: number;
  isCompleted: boolean;
  isOverdue: boolean;
  daysUntilDeadline: number | null;
}

export interface GoalStats {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  pausedGoals: number;
  overdueGoals: number;
  avgProgress: number;
  totalTasks: number;
  completedTasks: number;
  goalsWithDeadlines: number;
  upcomingDeadlines: GoalWithStats[];
}

export interface GoalFilters {
  status?: GoalStatus;
  priority?: GoalPriority;
  category?: GoalCategory;
  completed?: boolean;
  overdue?: boolean;
  hasDeadline?: boolean;
  search?: string;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  goalId: string | null;
  parentTaskId?: string | null;
  dueDate?: string;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithStats extends Task {
  isOverdue: boolean;
  daysUntilDue: number | null;
  daysSinceCreated: number;
  subtasks?: TaskWithStats[];
  subtaskCount?: number;
  completedSubtaskCount?: number;
}

export interface TaskFormData extends Omit<Task, 'createdAt' | 'updatedAt'> {
  parentTaskId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskTimeFilter = 'all' | 'no-date' | 'today' | 'week' | 'overdue';

export type TaskFilter = 'all' | 'active' | 'completed';

// Task Updates
export type TaskUpdates = Partial<Omit<Task, 'id' | 'createdAt'>>;

// Task Filters
export interface TaskFilters {
  goalId?: string | null;
  done?: boolean;
  priority?: TaskPriority;
  overdue?: boolean;
  hasGoal?: boolean;
  hasDueDate?: boolean;
  search?: string;
  today?: boolean;
}

// Task Statistics
export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  tasksWithGoals: number;
  tasksWithoutGoals: number;
  tasksByPriority: {
    low: number;
    medium: number;
    high: number;
  };
  completionRate: number;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

export interface HabitStats {
  completed: number;
  total: number;
  dueToday: number;
  percentage: number;
  totalTodayHabit: number;
  totalStreak: number;
  bestStreak: number;
  avgCompletion: number;
  activeHabits: number;
  completedThisWeek: number;
  skippedToday: number;
}

export interface HabitStatsBreakdown extends HabitStats {
  breakdown: {
    totalHabits: number;
    scheduledToday: number;
    completedToday: number;
    pendingToday: number;
    skippedToday: number;
    notScheduledToday: number;
    completionRate: number;
    weeklyActiveRate: number;
  };
}

export interface DateStats {
  date: DateString;
  stats: HabitStats;
  isToday: boolean;
}

export interface StatusAnalysis {
  completed: number;
  missed: number;
  scheduled: number;
  skipped: number;
  notScheduled: number;
  periodCompleted: number;
  totalDays: number;
  totalScheduled: number;
  completionRate: number;
}

// ============================================================================
// SCHEDULER TYPES
// ============================================================================

export interface HabitStatusForDate {
  isScheduled: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  actualAmount: number;
  canComplete: boolean;
}

export interface GroupedHabits {
  scheduled: HabitWithStatus[];
  completed: HabitWithStatus[];
  skipped: HabitWithStatus[];
  notScheduled: HabitWithStatus[];
  stats: {
    total: number;
    scheduledCount: number;
    completedCount: number;
    skippedCount: number;
    pendingCount: number;
    completionRate: number;
  };
}

export interface UpcomingHabit {
  date: DateString;
  habits: Habit[];
  isToday: boolean;
}

// ============================================================================
// STATUS TYPES
// ============================================================================

export interface StatusMessage {
  title: string;
  description: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon?: string;
}

export interface CalendarModifiers {
  completed: Date[];
  missed: Date[];
  skipped: Date[];
  periodCompleted: Date[];
  scheduled?: Date[];
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult<T = any> {
  value: T;
  isValid: boolean;
  error?: string;
}

export interface FormValidationResult<T = any> {
  isValid: boolean;
  errors: Array<{ field: string; error: string }>;
  validated: T;
}

export interface FieldError {
  field: string;
  error: string;
}

// ============================================================================
// UI TYPES
// ============================================================================

export interface ColorOption {
  name: string;
  value: string;
  rgb: string;
}

export interface IconOption {
  name: IconName;
  component: React.ComponentType;
}

export interface MoodOption {
  value: MoodValue;
  label: string;
  color: string;
}

export interface DifficultyOption {
  value: DifficultyValue;
  label: string;
  stars: number;
}

export interface FrequencyTypeOption {
  value: HabitFrequencyType;
  label: string;
  icon: React.ComponentType;
  description: string;
}

export interface WeekDayOption {
  key: WeekDay;
  label: string;
  full: string;
  index: number;
}

// ============================================================================
// DATE RANGE TYPES
// ============================================================================

export interface DateRange {
  start: DateString;
  end: DateString;
}

export interface MonthRange {
  startOfMonth: Date;
  endOfMonth: Date;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseHabitsReturn {
  habits: Habit[];
  completions: HabitCompletion[];
  stats: HabitStats;
  selectedDate: DateString;
  selectedHabit: Habit | null;
  isLoading: boolean;
  refreshHabits: () => Promise<void>;
  handleSaveHabit: (habitData: HabitFormData | null, existingHabit?: Habit | null) => Promise<Habit>;
  handleDeleteHabit: (habitId: string) => Promise<void>;
  handleDateSelect: (date: Date | DateString) => void;
  getHabitsForDate: (date?: DateString) => Habit[];
  toggleHabitCompletion: (habitId: string, date?: DateString) => Promise<void>;
  setHabitCompletion: (
    habitId: string,
    date: DateString,
    completed: boolean,
    additionalData?: Partial<CompletionRecord>
  ) => Promise<void>;
  getHabitById: (habitId: string) => Habit | null;
  getHabitsByGoalId: (goalId: string) => Habit[];
  getHabitsWithMetadata: (date?: DateString, showAll?: boolean) => HabitWithMetadata[];
  isSkippedOnDate: (habit: Habit, date: DateString) => boolean;
  handleHabitSelect: (habitIdOrHabit: string | null) => void;
}

export interface UseGoalsReturn {
  goals: GoalWithStats[];
  selectedGoal: Goal | null;
  setSelectedGoal: (g: Goal | null) => void;
  validationErrors: Record<string, string>;
  stats: GoalStats;
  isLoading: boolean;
  handleCreateGoal: (payload?: Partial<Goal>) => Promise<Goal | null>;
  handleUpdateGoal: (goalId: string, updates: Partial<Goal>) => Promise<boolean>;
  handleDeleteGoal: (goalId: string, deleteStrategy?: DeleteStrategy) => Promise<boolean>;
  markAsCompleted: (goalId: string) => Promise<boolean>;
  markAsActive: (goalId: string) => Promise<boolean>;
  pauseGoal: (goalId: string) => Promise<boolean>;
  getFilteredGoals: (filters?: GoalFilters) => GoalWithStats[];
  getSortedGoals: (sortBy?: GoalSortBy, ascending?: boolean) => Goal[];
  getGoalsByCategory: () => Record<string, Goal[]>;
  getGoalsByStatus: () => Record<string, Goal[]>;
  getGoalById: (goalId: string) => Goal | null;
  getGoalByTaskId: (taskId: string) => GoalWithStats | null;
  calculateGoalProgress: (goalId: string) => number;
}

export interface UseTasksReturn {
  tasks: TaskWithStats[];
  stats: TaskStats;
  isLoading: boolean;
  refreshTasks: () => Promise<void>;
  handleCreateTask: (
    title: string,
    goalId?: string | null,
    dueDate?: string,
    priority?: TaskPriority,
    parentTaskId?: string | null
  ) => Promise<Task | undefined>;
  handleCreateSubtask: (
    title: string,
    parentTaskId: string,
    goalId?: string | null,
    dueDate?: string,
    priority?: TaskPriority
  ) => Promise<Task | undefined>;
  handleEditTask: (taskId: string, updates: TaskUpdates) => Promise<void>;
  handleToggleTask: (taskId: string) => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  handleUpdateTaskPriority: (taskId: string, priority: TaskPriority) => Promise<void>;
  handleLinkTaskToGoal: (taskId: string, goalId: string | null) => Promise<void>;
  getFilteredTasks: (filters?: TaskFilters) => TaskWithStats[];
  getTasksByGoal: (goalId: string) => TaskWithStats[];
  getTaskById: (taskId: string) => TaskWithStats | null;
  getUpcomingTasks: (days?: number) => TaskWithStats[];
  getSubtasks: (parentTaskId: string) => TaskWithStats[];
  getAllSubtasksFlat: (parentTaskId: string) => TaskWithStats[];
}
// ============================================================================
// FREQUENCY CONFIG TYPES
// ============================================================================

export interface FrequencyConfig {
  selectedDays?: WeekDay[];
  intervalDays?: number;
  repetitionsPerPeriod?: number;
  period?: HabitPeriod;
  specificDates?: number[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isHabit(value: any): value is Habit {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    value.frequency &&
    typeof value.frequency.type === 'string'
  );
}

export function isHabitCompletion(value: any): value is HabitCompletion {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.habitId === 'string' &&
    typeof value.date === 'string' &&
    typeof value.completed === 'boolean'
  );
}

export function isDailyFrequency(frequency: HabitFrequency): frequency is DailyFrequencyValue {
  return frequency.type === 'daily';
}

export function isIntervalFrequency(frequency: HabitFrequency): frequency is IntervalFrequencyValue {
  return frequency.type === 'interval';
}

export function isXTimesPerPeriodFrequency(frequency: HabitFrequency): frequency is XTimesPerPeriodFrequencyValue {
  return frequency.type === 'x_times_per_period';
}

export function isSpecificDatesFrequency(frequency: HabitFrequency): frequency is SpecificDatesFrequencyValue {
  return frequency.type === 'specific_dates';
}

export function isGoal(value: any): value is Goal {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.status === 'string'
  );
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
