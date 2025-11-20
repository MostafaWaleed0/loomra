import type {
  DateString,
  FormValidationResult,
  Goal,
  GoalCategory,
  GoalFormData,
  GoalPriority,
  GoalStatus,
  IconName,
  ValidationResult
} from '@/lib/types';
import { GOAL_CONFIG, SYSTEM_CONSTANTS, UI_CONFIG } from '../core/constants';
import { DateUtils } from '../core/date-utils';
import { generateId } from '../core/id-generator';
import { ValidationUtils } from '../core/validation-utils';
import type { AppSettings } from '../tauri-api';

interface GoalValidationResult extends FormValidationResult<Goal> {
  hasWarnings: boolean;
  errorsByField: Record<string, string>;
}

export class GoalFactory {
  private static getDefaultCategory(settings?: AppSettings['goals']): GoalCategory {
    if (settings?.defaultCategory) {
      return settings.defaultCategory as GoalCategory;
    }
    return GOAL_CONFIG.CATEGORIES[0];
  }

  // Core Field Validators
  static validators = {
    title: (value: any): ValidationResult<string> => {
      try {
        const sanitized = ValidationUtils.sanitizeString(value) || String(value || '').trim();
        const minLength = SYSTEM_CONSTANTS.VALIDATION.MIN_NAME_LENGTH;
        const maxLength = SYSTEM_CONSTANTS.VALIDATION.MAX_NAME_LENGTH;

        if (sanitized.length < minLength) {
          return {
            value: '',
            isValid: false,
            error: `Title must be at least ${minLength} character${minLength > 1 ? 's' : ''}`
          };
        }

        if (sanitized.length > maxLength) {
          return {
            value: sanitized.substring(0, maxLength),
            isValid: false,
            error: `Title truncated to ${maxLength} characters`
          };
        }

        return { value: sanitized, isValid: true };
      } catch {
        return { value: 'Untitled Goal', isValid: false, error: 'Invalid title format' };
      }
    },

    description: (value: any): ValidationResult<string> => {
      try {
        const sanitized = ValidationUtils.sanitizeString(value) || String(value || '').trim();
        const maxLength = SYSTEM_CONSTANTS.VALIDATION.MAX_DESCRIPTION_LENGTH;
        if (sanitized.length > maxLength) {
          return {
            value: sanitized.substring(0, maxLength),
            isValid: false,
            error: `Description truncated to ${maxLength} characters`
          };
        }
        return { value: sanitized, isValid: true };
      } catch {
        return { value: '', isValid: true };
      }
    },

    category: (value: any, settings?: AppSettings['goals']): ValidationResult<GoalCategory> => {
      try {
        const categories = Array.from(GOAL_CONFIG.CATEGORIES ?? []);
        const defaultCategory = GoalFactory.getDefaultCategory(settings);
        const isValid = categories.includes(value);
        return {
          value: isValid ? value : defaultCategory,
          isValid,
          error: isValid ? undefined : `Invalid category. Using default: ${defaultCategory}`
        };
      } catch {
        const defaultCategory = GoalFactory.getDefaultCategory(settings);
        return {
          value: defaultCategory,
          isValid: false,
          error: `Error validating category. Using default: ${defaultCategory}`
        };
      }
    },

    priority: (value: any): ValidationResult<GoalPriority> => {
      try {
        const priorities = Array.from(GOAL_CONFIG.PRIORITIES ?? []);
        const defaultPriority = GOAL_CONFIG.DEFAULTS.PRIORITY || 'medium';
        const isValid = priorities.includes(value);
        return {
          value: isValid ? value : defaultPriority,
          isValid,
          error: isValid ? undefined : `Invalid priority. Using default: ${defaultPriority}`
        };
      } catch {
        return { value: 'medium', isValid: false, error: 'Error validating priority. Using default: medium' };
      }
    },

    status: (value: any): ValidationResult<GoalStatus> => {
      try {
        const statuses = Object.values(GOAL_CONFIG.STATUS || {});
        const defaultStatus = GOAL_CONFIG.DEFAULTS.STATUS || 'active';
        const isValid = statuses.includes(value);
        return {
          value: isValid ? value : defaultStatus,
          isValid,
          error: isValid ? undefined : `Invalid status. Using default: ${defaultStatus}`
        };
      } catch {
        return { value: 'active', isValid: false, error: 'Error validating status. Using default: active' };
      }
    },

    icon: (value: any): ValidationResult<IconName> => {
      try {
        const icons: IconName[] = Array.from(UI_CONFIG.ICONS.AVAILABLE ?? []);
        const defaultIcon: IconName = icons[0] ?? 'Activity';
        const isValid = icons.includes(value as IconName);
        return {
          value: isValid ? value : defaultIcon,
          isValid,
          error: isValid ? undefined : `Invalid icon. Using default: ${defaultIcon}`
        };
      } catch {
        return { value: 'Activity', isValid: false, error: 'Error validating icon. Using default: Activity' };
      }
    },

    notes: (value: any): ValidationResult<string> => {
      try {
        const sanitized = ValidationUtils.sanitizeNotes(value) || String(value || '').trim();
        const maxLength = SYSTEM_CONSTANTS.VALIDATION.MAX_NOTE_LENGTH;
        if (sanitized.length > maxLength) {
          return {
            value: sanitized.substring(0, maxLength) ?? '',
            isValid: false,
            error: `Notes truncated to ${maxLength} characters`
          };
        }
        return { value: sanitized, isValid: true };
      } catch (error) {
        return { value: '', isValid: true, error: 'Invalid notes format' };
      }
    },

    color: (value: any): ValidationResult<string> => {
      const fallback = '#3b82f6';
      try {
        const colors = UI_CONFIG.COLORS.ALL ?? [];
        const defaultColor = colors[0]?.value || fallback;
        const match = colors.find((c) => c.value === value);
        const isValid = Boolean(match);
        return {
          value: isValid ? value : defaultColor,
          isValid,
          error: isValid ? undefined : 'Invalid color. Using default color'
        };
      } catch {
        return { value: fallback, isValid: false, error: 'Error validating color. Using default color' };
      }
    },

    deadline: (value: any): ValidationResult<DateString | undefined> => {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return { value: undefined, isValid: true };
      }
      try {
        const date = DateUtils.createDateFromString(value) || new Date(value);
        if (!date || isNaN(date.getTime())) {
          return { value: undefined, isValid: false, error: 'Invalid date format. Target date removed' };
        }
        const dateString = DateUtils.formatDate(date) || date.toISOString().split('T')[0];
        return { value: dateString, isValid: true };
      } catch {
        return { value: undefined, isValid: false, error: 'Invalid date format. Target date removed' };
      }
    },

    linkedHabits: (value: any): ValidationResult<string[]> => {
      try {
        const result = ValidationUtils.validateArray<string>(value);
        return { value: result, isValid: true };
      } catch {
        return { value: [], isValid: false, error: 'Invalid habits array. Using empty array' };
      }
    }
  };

  // Clean Public API
  static validate = {
    title: (value: any): string => this.validators.title(value).value,
    description: (value: any): string => this.validators.description(value).value,
    category: (value: any, settings?: AppSettings['goals']): GoalCategory => this.validators.category(value, settings).value,
    priority: (value: any): GoalPriority => this.validators.priority(value).value,
    status: (value: any): GoalStatus => this.validators.status(value).value,
    icon: (value: any): IconName => this.validators.icon(value).value,
    color: (value: any): string => this.validators.color(value).value,
    deadline: (value: any): DateString | undefined => this.validators.deadline(value).value,
    notes: (value: any): string => this.validators.notes(value).value,
    linkedHabits: (value: any): string[] => this.validators.linkedHabits(value).value
  };

  // Enhanced Form Validation
  static validateForm(data: Partial<GoalFormData> = {}, settings?: AppSettings['goals']): GoalValidationResult {
    const results = {
      title: this.validators.title(data.title || ''),
      description: this.validators.description(data.description || ''),
      notes: this.validators.notes(data.notes || ''),
      category: this.validators.category(data.category || '', settings),
      priority: this.validators.priority(data.priority || ''),
      status: this.validators.status(data.status || ''),
      icon: this.validators.icon(data.icon || ''),
      color: this.validators.color(data.color || ''),
      deadline: this.validators.deadline(data.deadline || '')
    };

    const errors = Object.entries(results)
      .filter(([_, result]) => !result.isValid && result.error)
      .map(([field, result]) => ({ field, error: result.error! }));

    const validated: any = {};
    for (const [field, result] of Object.entries(results)) {
      validated[field] = result.value;
    }

    return {
      isValid: errors.length === 0,
      errors,
      validated,
      hasWarnings: errors.some((e) => e.error && (e.error.includes('Using default') || e.error.includes('truncated'))),
      errorsByField: errors.reduce((acc, { field, error }) => {
        acc[field] = error;
        return acc;
      }, {} as Record<string, string>)
    };
  }

  // Input validation
  static validateGoalInput(data: Partial<GoalFormData>): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid goal data: data must be an object');
    }
    const titleResult = this.validators.title(data.title || '');
    if (!titleResult.isValid || !titleResult.value) {
      throw new Error('Invalid goal data: title is required');
    }
  }

  // Goal Creation
  static create(data: Partial<GoalFormData>, existing: Goal | null = null, settings?: AppSettings['goals']): Goal | null {
    try {
      this.validateGoalInput(data);
      const now = new Date().toISOString();

      const goal: Goal = {
        id: existing?.id ?? generateId('goal'),
        title: this.validate.title(data.title),
        description: this.validate.description(data.description),
        category: this.validate.category(data.category, settings),
        priority: this.validate.priority(data.priority),
        status: this.validate.status(data.status),
        icon: this.validate.icon(data.icon),
        color: this.validate.color(data.color),
        deadline: this.validate.deadline(data.deadline),
        notes: this.validate.notes(data.notes),
        linkedHabits: this.validate.linkedHabits([]),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };

      return goal;
    } catch (error) {
      console.error('Goal creation failed:', error);
      return null;
    }
  }

  // Goal Update
  static update(existing: Goal | null, updates: Partial<GoalFormData>, settings?: AppSettings['goals']): Goal | null {
    try {
      if (!existing) {
        console.error('Cannot update: existing goal is null');
        return null;
      }
      return this.create({ ...existing, ...updates }, existing, settings);
    } catch (error) {
      console.error('Goal update failed:', error);
      return null;
    }
  }

  // Goal Validation
  static isValid(data: any): boolean {
    try {
      this.validateGoalInput(data);
      return true;
    } catch {
      return false;
    }
  }

  // Utility Methods
  static calculateProgress(completedTasks: number, totalTasks: number): number {
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  }

  static isOverdue(goal: Goal): boolean {
    if (!goal.deadline) return false;
    try {
      const deadline = new Date(goal.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deadline.setHours(0, 0, 0, 0);
      return deadline < today && goal.status !== 'completed';
    } catch {
      return false;
    }
  }

  static getDaysUntilDeadline(goal: Goal): number | null {
    if (!goal.deadline) return null;
    try {
      const deadline = new Date(goal.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deadline.setHours(0, 0, 0, 0);
      const diffTime = deadline.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }

  static getGoalsByCategory(goals: Goal[]): Record<GoalCategory, Goal[]> {
    if (!Array.isArray(goals)) return {} as Record<GoalCategory, Goal[]>;
    return goals.reduce((acc, goal) => {
      if (!acc[goal.category]) acc[goal.category] = [];
      acc[goal.category].push(goal);
      return acc;
    }, {} as Record<GoalCategory, Goal[]>);
  }

  static getGoalsByStatus(goals: Goal[]): Record<GoalStatus, Goal[]> {
    if (!Array.isArray(goals)) return {} as Record<GoalStatus, Goal[]>;
    return goals.reduce((acc, goal) => {
      if (!acc[goal.status]) acc[goal.status] = [];
      acc[goal.status].push(goal);
      return acc;
    }, {} as Record<GoalStatus, Goal[]>);
  }

  static sortGoals(
    goals: Goal[],
    sortBy: 'title' | 'deadline' | 'priority' | 'createdAt' = 'createdAt',
    ascending = false
  ): Goal[] {
    if (!Array.isArray(goals)) return [];

    const sorted = [...goals].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'priority': {
          const priorityOrder: Record<GoalPriority, number> = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        }
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return ascending ? sorted.reverse() : sorted;
  }
}
