import {
  Activity,
  Dumbbell,
  Heart,
  Leaf,
  Sunrise,
  Moon,
  Droplet,
  Apple,
  Brain,
  Book,
  Code,
  Timer,
  CheckCircle,
  Target,
  Calendar,
  ClipboardList,
  AlarmClock,
  Coffee,
  Utensils,
  ShoppingCart,
  Bed,
  Car,
  Home,
  Phone,
  Glasses,
  Music,
  Palette,
  PenTool,
  Film,
  Camera,
  Gamepad,
  Mic,
  Theater,
  Briefcase,
  DollarSign,
  CreditCard,
  BarChart3,
  PieChart,
  Laptop,
  Building,
  Globe,
  Plane,
  Map,
  Compass,
  Mountain,
  Tent,
  Ship,
  Sparkles,
  Star,
  Smile,
  Lightbulb,
  Feather,
  Flower2,
  Circle,
  Repeat,
  CalendarDays
} from 'lucide-react';

// ==================== SYSTEM CONSTANTS ====================

export const SYSTEM_CONSTANTS = {
  TIME: {
    MILLISECONDS_IN_DAY: 86400000,
    MILLISECONDS_IN_HOUR: 3600000,
    MILLISECONDS_IN_MINUTE: 60000,
    DAYS_IN_WEEK: 7,
    HOURS_IN_DAY: 24,
    MINUTES_IN_HOUR: 60,
    SECONDS_IN_MINUTE: 60
  },

  CALENDAR: {
    DAYS_IN_CALENDAR_GRID: 42,
    MAX_DAYS_IN_MONTH: 31,
    BUFFER_DAYS_FOR_MONTH_RANGE: 60,
    WEEK_START_SUNDAY: 0,
    WEEK_START_MONDAY: 1
  },

  VALIDATION: {
    MIN_NAME_LENGTH: 1,
    MAX_NAME_LENGTH: 50,
    MAX_NOTE_LENGTH: 250,
    MAX_DESCRIPTION_LENGTH: 120,
    MIN_TARGET_AMOUNT: 1,
    MAX_TARGET_AMOUNT: 10000,
    TIME_PATTERN: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
    COLOR_PATTERN: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  }
} as const;

export const WEEK_DAYS = [
  { key: 'sunday', label: 'Sun', full: 'Sunday', index: 0 },
  { key: 'monday', label: 'Mon', full: 'Monday', index: 1 },
  { key: 'tuesday', label: 'Tue', full: 'Tuesday', index: 2 },
  { key: 'wednesday', label: 'Wed', full: 'Wednesday', index: 3 },
  { key: 'thursday', label: 'Thu', full: 'Thursday', index: 4 },
  { key: 'friday', label: 'Fri', full: 'Friday', index: 5 },
  { key: 'saturday', label: 'Sat', full: 'Saturday', index: 6 }
] as const;
// ==================== SHARED CATEGORIES & PRIORITIES ====================

export const SHARED_CONFIG = {
  PRIORITIES: ['low', 'medium', 'high'],
  CATEGORIES: [
    'Mindfulness',
    'Learning',
    'Health',
    'Productivity',
    'Creative',
    'Fitness',
    'Nutrition',
    'Finance',
    'Social',
    'Spirituality',
    'Self-care',
    'Environment',
    'Work',
    'Hobbies',
    'Sleep'
  ]
} as const;

// ==================== GOAL CONFIGURATION ====================

export const GOAL_CONFIG = {
  PRIORITIES: SHARED_CONFIG.PRIORITIES,
  CATEGORIES: SHARED_CONFIG.CATEGORIES,

  STATUS: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    PAUSED: 'paused'
  },

  DEFAULTS: {
    STATUS: 'active',
    PRIORITY: 'medium',
    CATEGORY: 'Learning',
    ICON: 'Activity',
    COLOR: '#3b82f6',
    PROGRESS: 0
  }
} as const;

export const TASK_CONFIG = {
  PRIORITIES: SHARED_CONFIG.PRIORITIES,
  PRIORITY_OPTIONS: [
    { value: 'high', label: 'High', color: 'text-red-600', bgColor: 'bg-red-100' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { value: 'low', label: 'Low', color: 'text-green-600', bgColor: 'bg-green-100' }
  ],

  DEFAULTS: {
    PRIORITY: 'medium'
  }
} as const;
// ==================== HABIT CONFIGURATION ====================

export const HABIT_CONFIG = {
  FREQUENCIES: {
    DAILY: 'daily',
    INTERVAL: 'interval',
    X_TIMES_PER_PERIOD: 'x_times_per_period',
    SPECIFIC_DATES: 'specific_dates'
  },

  FREQUENCY_TYPES: [
    {
      value: 'daily',
      label: 'Daily',
      icon: Circle,
      description: 'Select which days to perform this habit'
    },
    {
      value: 'interval',
      label: 'Every X Days',
      icon: Repeat,
      description: 'Repeat every X days starting from a specific day'
    },
    {
      value: 'x_times_per_period',
      label: 'X Times Per Period',
      icon: Target,
      description: 'Set a target number for week/month'
    },
    {
      value: 'specific_dates',
      label: 'Specific Dates',
      icon: CalendarDays,
      description: 'Choose specific dates in the month'
    }
  ],

  PRIORITIES: SHARED_CONFIG.PRIORITIES,
  CATEGORIES: SHARED_CONFIG.CATEGORIES,

  PERIODS: ['week', 'month'],
  UNITS: ['times', 'minutes', 'hours', 'pages', 'reps', 'sets', 'km', 'miles', 'glasses'],

  DEFAULTS: {
    REMINDER: { enabled: false, time: '09:00' },
    TARGET_AMOUNT: 1,
    MIN_INTERVAL_DAYS: 1,
    MAX_INTERVAL_DAYS: 365,
    MIN_REPETITIONS: 1,
    MAX_REPETITIONS_WEEK: 7,
    MAX_REPETITIONS_MONTH: 31
  },

  STATUS: {
    COMPLETED: 'completed',
    MISSED: 'missed',
    SCHEDULED: 'scheduled',
    DEFAULT: 'default',
    LOCKED: 'locked',
    SKIPPED: 'skipped',
    NOT_SCHEDULED: 'not-scheduled',
    FUTURE_LOCKED: 'future-locked',
    PERIOD_COMPLETED: 'period-completed'
  }
} as const;

export const EDITABLE_STATUSES = [
  HABIT_CONFIG.STATUS.SCHEDULED,
  HABIT_CONFIG.STATUS.SKIPPED,
  HABIT_CONFIG.STATUS.COMPLETED,
  HABIT_CONFIG.STATUS.MISSED
] as const;

export const FORM_INITIALIZE_STATUSES = [HABIT_CONFIG.STATUS.SCHEDULED, HABIT_CONFIG.STATUS.COMPLETED] as const;
// ==================== UI CONFIGURATION ====================

export const UI_CONFIG = {
  SELECTION_STYLES: {
    SELECTED: 'border-blue-500 bg-blue-100 dark:bg-blue-950 shadow-md',
    UNSELECTED: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
    HOVER: 'hover:scale-105 transition-all duration-200'
  },

  CALENDAR_STYLES: {
    DEFAULT_BUTTON:
      '!rounded-full [&_button]:!rounded-full [&_button]:!text-inherit [&_button]:!bg-inherit [&_button:hover]:bg-inherit mx-px',
    MODIFIERS: {
      completed: 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200',
      missed: 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200',
      scheduled: 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100',
      skipped: 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200',
      periodCompleted: 'bg-green-50 text-green-800 border border-green-100 hover:bg-green-100 line-through decoration-2'
    }
  },

  COLORS: {
    ALL: [
      { name: 'Blue', value: '#3b82f6', rgb: '59, 130, 246' },
      { name: 'Green', value: '#22c55e', rgb: '34, 197, 94' },
      { name: 'Purple', value: '#8b5cf6', rgb: '139, 92, 246' },
      { name: 'Orange', value: '#f97316', rgb: '249, 115, 22' },
      { name: 'Pink', value: '#ec4899', rgb: '236, 72, 153' },
      { name: 'Red', value: '#ef4444', rgb: '239, 68, 68' },
      { name: 'Yellow', value: '#facc15', rgb: '250, 204, 21' },
      { name: 'Gray', value: '#6b7280', rgb: '107, 114, 128' }
    ],

    PRIORITY: {
      low: 'text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800',
      medium: 'text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800',
      high: 'text-rose-700 border-rose-300 bg-rose-50 dark:text-rose-400 dark:bg-rose-950 dark:border-rose-800'
    },
    STATUS: {
      active:
        'text-emerald-700 bg-emerald-50 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800',
      paused: 'text-slate-700 bg-slate-50 border-slate-300 dark:text-slate-400 dark:bg-slate-950 dark:border-slate-800',
      completed: 'text-green-700 bg-green-50 border-green-300 dark:text-green-400 dark:bg-green-950 dark:border-green-800'
    }
  },

  ICONS: {
    AVAILABLE: [
      'Activity',
      'Dumbbell',
      'Heart',
      'Leaf',
      'Sunrise',
      'Moon',
      'Droplet',
      'Apple',
      'Brain',
      'Book',
      'Code',
      'Timer',
      'CheckCircle',
      'Target',
      'Calendar',
      'ClipboardList',
      'AlarmClock',
      'Coffee',
      'Utensils',
      'ShoppingCart',
      'Bed',
      'Car',
      'Home',
      'Phone',
      'Glasses',
      'Music',
      'Palette',
      'PenTool',
      'Film',
      'Camera',
      'Gamepad',
      'Mic',
      'Theater',
      'Briefcase',
      'DollarSign',
      'CreditCard',
      'BarChart3',
      'PieChart',
      'Laptop',
      'Building',
      'Globe',
      'Plane',
      'Map',
      'Compass',
      'Mountain',
      'Tent',
      'Ship',
      'Sparkles',
      'Star',
      'Smile',
      'Lightbulb',
      'Feather',
      'Flower2'
    ] as const,

    MAP: {
      Activity,
      Dumbbell,
      Heart,
      Leaf,
      Sunrise,
      Moon,
      Droplet,
      Apple,
      Brain,
      Book,
      Code,
      Timer,
      CheckCircle,
      Target,
      Calendar,
      ClipboardList,
      AlarmClock,
      Coffee,
      Utensils,
      ShoppingCart,
      Bed,
      Car,
      Home,
      Phone,
      Glasses,
      Music,
      Palette,
      PenTool,
      Film,
      Camera,
      Gamepad,
      Mic,
      Theater,
      Briefcase,
      DollarSign,
      CreditCard,
      BarChart3,
      PieChart,
      Laptop,
      Building,
      Globe,
      Plane,
      Map,
      Compass,
      Mountain,
      Tent,
      Ship,
      Sparkles,
      Star,
      Smile,
      Lightbulb,
      Feather,
      Flower2
    }
  },

  STATUS_OPTIONS: {
    MOOD: [
      { value: 'excellent', label: '😄 Excellent', color: 'bg-green-100 text-green-800' },
      { value: 'good', label: '😊 Good', color: 'bg-blue-100 text-blue-800' },
      { value: 'okay', label: '😐 Okay', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'bad', label: '😟 Bad', color: 'bg-orange-100 text-orange-800' },
      { value: 'terrible', label: '😢 Terrible', color: 'bg-red-100 text-red-800' }
    ] as const,

    DIFFICULTY: [
      { value: 'very-easy', label: 'Very Easy', stars: 1 },
      { value: 'easy', label: 'Easy', stars: 2 },
      { value: 'medium', label: 'Medium', stars: 3 },
      { value: 'hard', label: 'Hard', stars: 4 },
      { value: 'very-hard', label: 'Very Hard', stars: 5 }
    ] as const
  }
} as const;

export const FORM_STYLES = {
  error: 'flex items-center gap-1.5 text-sm text-destructive font-medium',
  charCount: 'text-sm text-muted-foreground'
} as const;
