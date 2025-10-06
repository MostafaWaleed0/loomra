import { HABIT_CONFIG, UI_CONFIG, SYSTEM_CONSTANTS } from '../core/constants';
import { DateUtils } from '../core/date-utils';
import { generateId } from '../core/id-generator';
import { ValidationUtils } from '../core/validation-utils';
import { HabitFrequencyManager } from './frequency-system';
import type {
  Habit,
  HabitFormData,
  HabitFrequency,
  HabitCategory,
  HabitUnit,
  HabitPriority,
  IconName,
  HabitReminder,
  ValidationResult,
  FormValidationResult,
  DateString,
  HabitFrequencyType
} from '@/lib/types';

export class HabitFactory {
  // Core Field Validators
  static validators = {
    name: (value: any): ValidationResult<string> => {
      try {
        const sanitized = ValidationUtils.sanitizeString(value) || '';
        if (sanitized.length < SYSTEM_CONSTANTS.VALIDATION.MIN_NAME_LENGTH) {
          return {
            value: '',
            isValid: false,
            error: `Name must be at least ${SYSTEM_CONSTANTS.VALIDATION.MIN_NAME_LENGTH} characters`
          };
        }
        if (sanitized.length > SYSTEM_CONSTANTS.VALIDATION.MAX_NAME_LENGTH) {
          return {
            value: sanitized.substring(0, SYSTEM_CONSTANTS.VALIDATION.MAX_NAME_LENGTH),
            isValid: false,
            error: `Name truncated to ${SYSTEM_CONSTANTS.VALIDATION.MAX_NAME_LENGTH} characters`
          };
        }
        return { value: sanitized, isValid: true };
      } catch {
        return {
          value: 'Untitled habit',
          isValid: false,
          error: 'Invalid name format'
        };
      }
    },

    targetAmount: (value: any): ValidationResult<number> => {
      try {
        const stringValue = typeof value === 'number' ? value.toString() : value;
        const result = ValidationUtils.validateNumberInput(
          stringValue,
          SYSTEM_CONSTANTS.VALIDATION.MIN_TARGET_AMOUNT,
          SYSTEM_CONSTANTS.VALIDATION.MAX_TARGET_AMOUNT,
          HABIT_CONFIG.DEFAULTS.TARGET_AMOUNT
        );
        return { value: result, isValid: true };
      } catch {
        return {
          value: HABIT_CONFIG.DEFAULTS.TARGET_AMOUNT,
          isValid: false,
          error: `Target amount must be between ${SYSTEM_CONSTANTS.VALIDATION.MIN_TARGET_AMOUNT} and ${SYSTEM_CONSTANTS.VALIDATION.MAX_TARGET_AMOUNT}`
        };
      }
    },

    category: (value: any): ValidationResult<HabitCategory> => {
      const sanitized = ValidationUtils.sanitizeString(value) || HABIT_CONFIG.CATEGORIES[0];
      const isValid = HABIT_CONFIG.CATEGORIES.includes(sanitized as HabitCategory);
      return {
        value: isValid ? (sanitized as HabitCategory) : HABIT_CONFIG.CATEGORIES[0],
        isValid,
        error: isValid ? undefined : `Invalid category. Using default: ${HABIT_CONFIG.CATEGORIES[0]}`
      };
    },

    unit: (value: any): ValidationResult<HabitUnit> => {
      const isValid = HABIT_CONFIG.UNITS.includes(value);
      return {
        value: isValid ? value : HABIT_CONFIG.UNITS[0],
        isValid,
        error: isValid ? undefined : `Invalid unit. Using default: ${HABIT_CONFIG.UNITS[0]}`
      };
    },

    priority: (value: any): ValidationResult<HabitPriority> => {
      const isValid = HABIT_CONFIG.PRIORITIES.includes(value);
      return {
        value: isValid ? value : HABIT_CONFIG.PRIORITIES[1],
        isValid,
        error: isValid ? undefined : `Invalid priority. Using default: ${HABIT_CONFIG.PRIORITIES[1]}`
      };
    },

    notes: (value: any): ValidationResult<string> => {
      try {
        const sanitized = ValidationUtils.sanitizeNotes(value) || String(value || '').trim();
        const maxLength = SYSTEM_CONSTANTS.VALIDATION.MAX_NOTE_LENGTH;

        if (sanitized.length > maxLength) {
          return {
            value: sanitized.substring(0, maxLength),
            isValid: false,
            error: `Notes truncated to ${maxLength} characters`
          };
        }

        return { value: sanitized, isValid: true };
      } catch {
        return { value: '', isValid: true };
      }
    },

    icon: (value: any): ValidationResult<IconName> => {
      const isValid = UI_CONFIG.ICONS.AVAILABLE.includes(value);
      return {
        value: isValid ? value : UI_CONFIG.ICONS.AVAILABLE[0],
        isValid,
        error: isValid ? undefined : `Invalid icon. Using default: ${UI_CONFIG.ICONS.AVAILABLE[0]}`
      };
    },

    color: (value: any): ValidationResult<string> => {
      const isValid = UI_CONFIG.COLORS.ALL.some((color) => color.value === value);
      return {
        value: isValid ? value : UI_CONFIG.COLORS.ALL[0].value,
        isValid,
        error: isValid ? undefined : 'Invalid color. Using default color'
      };
    },

    startDate: (value: any): ValidationResult<DateString> => {
      if (!value) {
        return { value: DateUtils.getCurrentDateString(), isValid: true };
      }
      try {
        const date = DateUtils.createDateFromString(value);
        const dateString = date ? DateUtils.formatDate(date) : DateUtils.getCurrentDateString();
        return {
          value: dateString,
          isValid: !!date,
          error: date ? undefined : 'Invalid date format. Using current date'
        };
      } catch {
        return {
          value: DateUtils.getCurrentDateString(),
          isValid: false,
          error: 'Invalid date format. Using current date'
        };
      }
    },

    reminder: (value: any): ValidationResult<HabitReminder> => {
      const defaultReminder: HabitReminder = { enabled: false, time: HABIT_CONFIG.DEFAULTS.REMINDER.time };
      if (!value) {
        return { value: defaultReminder, isValid: true };
      }
      try {
        const enabled = Boolean(value.enabled);
        const timeValidation = DateUtils.parseTime(value.time || '');
        const time = timeValidation ? value.time : HABIT_CONFIG.DEFAULTS.REMINDER.time;
        return {
          value: { enabled, time },
          isValid: !!timeValidation,
          error: timeValidation ? undefined : 'Invalid reminder time format. Using default time'
        };
      } catch {
        return {
          value: defaultReminder,
          isValid: false,
          error: 'Invalid reminder format. Using default reminder'
        };
      }
    },

    linkedGoals: (value: any): ValidationResult<string[]> => {
      try {
        const result = ValidationUtils.validateArray<string>(value);
        return { value: result, isValid: true };
      } catch {
        return {
          value: [],
          isValid: false,
          error: 'Invalid goals array. Using empty array'
        };
      }
    },

    frequency: (value: any): ValidationResult<HabitFrequency> => {
      try {
        if (value && typeof value === 'object' && value.type && value.value !== undefined) {
          const validationResult = HabitFactory.validateFrequencyObject(value);
          if (validationResult.isValid) {
            return validationResult;
          }
        }

        const type: HabitFrequencyType = value?.type || HABIT_CONFIG.FREQUENCIES.DAILY;
        const freqValue = value?.value;

        switch (type) {
          case HABIT_CONFIG.FREQUENCIES.DAILY: {
            const selectedDays =
              Array.isArray(freqValue) && freqValue.length > 0
                ? freqValue
                : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            return { value: HabitFrequencyManager.buildFromConfig(type, { selectedDays }), isValid: true };
          }

          case HABIT_CONFIG.FREQUENCIES.INTERVAL: {
            const intervalDays =
              typeof freqValue?.interval === 'number' ? freqValue.interval : typeof freqValue === 'number' ? freqValue : 1;
            const frequency = HabitFrequencyManager.buildFromConfig(type, { intervalDays });
            return { value: frequency, isValid: true };
          }

          case HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD: {
            const repetitionsPerPeriod = freqValue?.repetitionsPerPeriod || 1;
            const period = freqValue?.period || 'week';
            const frequency = HabitFrequencyManager.buildFromConfig(type, { repetitionsPerPeriod, period });
            return { value: frequency, isValid: true };
          }

          case HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES: {
            const specificDates = Array.isArray(freqValue)
              ? freqValue.filter((date: any) => typeof date === 'number' && date >= 1 && date <= 31)
              : [1];
            const frequency = HabitFrequencyManager.buildFromConfig(type, { specificDates });
            return { value: frequency, isValid: true };
          }

          default:
            return { value: HabitFrequencyManager.createDefaultFrequency(), isValid: false };
        }
      } catch {
        return { value: HabitFrequencyManager.createDefaultFrequency(), isValid: false };
      }
    }
  };

  // Frequency Object Validation
  static validateFrequencyObject(frequency: any): ValidationResult<HabitFrequency> {
    if (!frequency || typeof frequency !== 'object') {
      return { value: HabitFrequencyManager.createDefaultFrequency(), isValid: false };
    }
    const { type, value: freqValue } = frequency;

    switch (type) {
      case HABIT_CONFIG.FREQUENCIES.DAILY:
        return { value: frequency, isValid: Array.isArray(freqValue) && freqValue.length > 0 };

      case HABIT_CONFIG.FREQUENCIES.INTERVAL:
        return { value: frequency, isValid: typeof freqValue?.interval === 'number' };

      case HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD:
        return { value: frequency, isValid: typeof freqValue?.repetitionsPerPeriod === 'number' };

      case HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES:
        return { value: frequency, isValid: Array.isArray(freqValue) };

      default:
        return { value: HabitFrequencyManager.createDefaultFrequency(), isValid: false };
    }
  }

  // Clean Public API
  static validate = {
    name: (value: any): string => this.validators.name(value).value,
    targetAmount: (value: any): number => this.validators.targetAmount(value).value,
    category: (value: any): HabitCategory => this.validators.category(value).value,
    unit: (value: any): HabitUnit => this.validators.unit(value).value,
    priority: (value: any): HabitPriority => this.validators.priority(value).value,
    notes: (value: any): string => this.validators.notes(value).value,
    icon: (value: any): IconName => this.validators.icon(value).value,
    color: (value: any): string => this.validators.color(value).value,
    startDate: (value: any): DateString => this.validators.startDate(value).value,
    reminder: (value: any): HabitReminder => this.validators.reminder(value).value,
    linkedGoals: (value: any): string[] => this.validators.linkedGoals(value).value,
    frequency: (value: any): HabitFrequency => this.validators.frequency(value).value
  };

  // Validate form with errors
  static validateForm(data: Partial<HabitFormData>): FormValidationResult<Habit> {
    const results = {
      name: this.validators.name(data.name || ''),
      targetAmount: this.validators.targetAmount(data.targetAmount || ''),
      category: this.validators.category(data.category || ''),
      unit: this.validators.unit(data.unit || ''),
      priority: this.validators.priority(data.priority || ''),
      notes: this.validators.notes(data.notes || ''),
      icon: this.validators.icon(data.icon || ''),
      color: this.validators.color(data.color || ''),
      startDate: this.validators.startDate(data.startDate || ''),
      reminder: this.validators.reminder(data.reminder || { enabled: false, time: '' }),
      linkedGoals: this.validators.linkedGoals(data.linkedGoals || []),
      frequency: this.validators.frequency(data.frequency || {})
    };

    const errors = Object.entries(results)
      .filter(([_, result]) => !result.isValid && result.error)
      .map(([field, result]) => ({ field, error: result.error! }));

    const validated = Object.entries(results).reduce((acc, [field, result]) => {
      (acc as any)[field] = result.value;
      return acc;
    }, {} as any);

    return {
      isValid: errors.length === 0,
      errors,
      validated
    };
  }

  static create(data: Partial<HabitFormData>, existing?: Habit): Habit | null {
    try {
      const now = new Date().toISOString();
      return {
        id: existing?.id ?? generateId('habit'),
        name: this.validate.name(data.name),
        category: this.validate.category(data.category),
        icon: this.validate.icon(data.icon),
        color: this.validate.color(data.color),
        targetAmount: this.validate.targetAmount(data.targetAmount),
        unit: this.validate.unit(data.unit),
        frequency: this.validate.frequency(data.frequency),
        priority: this.validate.priority(data.priority),
        notes: this.validate.notes(data.notes),
        linkedGoals: this.validate.linkedGoals(data.linkedGoals),
        startDate: this.validate.startDate(data.startDate),
        reminder: this.validate.reminder(data.reminder),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
    } catch {
      return null;
    }
  }

  static update(existing: Habit, updates: Partial<HabitFormData>): Habit | null {
    return this.create(updates, existing);
  }
}
