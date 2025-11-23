import type {
  DateString,
  FormValidationResult,
  Habit,
  HabitCategory,
  HabitFormData,
  HabitFrequency,
  HabitFrequencyType,
  HabitPriority,
  HabitReminder,
  HabitUnit,
  IconName,
  ValidationResult
} from '@/lib/types';
import { HABIT_CONFIG, SYSTEM_CONSTANTS, UI_CONFIG } from '../core/constants';
import { DateUtils } from '../core/date-utils';
import { generateId } from '../core/id-generator';
import { ValidationUtils } from '../core/validation-utils';
import type { AppSettings } from '../tauri-api';
import { HabitFrequencyManager } from './frequency-system';

export class HabitFactory {
  private static getDefaultReminder(settings?: AppSettings['habits']): HabitReminder {
    if (settings) {
      return {
        enabled: settings.defaultReminder,
        time: settings.defaultReminderTime
      };
    }
    return {
      enabled: false,
      time: HABIT_CONFIG.DEFAULTS.REMINDER.time
    };
  }

  private static getDefaultPriority(settings?: AppSettings['habits']): HabitPriority {
    if (settings?.defaultPriority) {
      return settings.defaultPriority as HabitPriority;
    }
    return HABIT_CONFIG.PRIORITIES[1];
  }

  static validators = {
    name: (value: any): ValidationResult<string> => {
      try {
        const sanitized = ValidationUtils.sanitizeString(value) || '';
        if (sanitized.length < SYSTEM_CONSTANTS.VALIDATION.MIN_NAME_LENGTH) {
          return {
            value: 'Untitled habit',
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
      const min = SYSTEM_CONSTANTS.VALIDATION.MIN_TARGET_AMOUNT;
      const max = SYSTEM_CONSTANTS.VALIDATION.MAX_TARGET_AMOUNT;
      const defaultValue = HABIT_CONFIG.DEFAULTS.TARGET_AMOUNT;

      const stringValue = typeof value === 'number' ? value.toString() : value;
      const parsed = parseInt(stringValue);

      const isInvalid = isNaN(parsed);

      const result = ValidationUtils.validateNumberInput(stringValue, min, max, defaultValue);

      if (isInvalid) {
        return {
          value: defaultValue,
          isValid: false,
          error: `Target amount must be between ${min} and ${max}`
        };
      }

      return { value: result, isValid: true };
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

    priority: (value: any, settings?: AppSettings['habits']): ValidationResult<HabitPriority> => {
      const isValid = HABIT_CONFIG.PRIORITIES.includes(value);
      const defaultPriority = HabitFactory.getDefaultPriority(settings);
      return {
        value: isValid ? value : defaultPriority,
        isValid,
        error: isValid ? undefined : `Invalid priority. Using default: ${defaultPriority}`
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
          isValid: Boolean(date),
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

    reminder: (value: any, settings?: AppSettings['habits']): ValidationResult<HabitReminder> => {
      const defaultReminder = HabitFactory.getDefaultReminder(settings);

      if (!value) {
        return { value: defaultReminder, isValid: true };
      }
      try {
        const enabled = Boolean(value.enabled);
        const timeValidation = DateUtils.parseTime(value.time || '');
        const time = timeValidation ? value.time : defaultReminder.time;
        return {
          value: { enabled, time },
          isValid: Boolean(timeValidation),
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
      const defaultFrequency = HabitFrequencyManager.createDefaultFrequency();

      try {
        if (!value || typeof value !== 'object') {
          return { value: defaultFrequency, isValid: false };
        }

        if (!value.type || value.value === undefined) {
          return { value: defaultFrequency, isValid: false };
        }

        const fullValidation = HabitFactory.validateFrequencyObject(value);
        if (fullValidation.isValid) {
          return fullValidation;
        }

        const type: HabitFrequencyType = value.type;
        const freqValue = value.value;

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

            return {
              value: HabitFrequencyManager.buildFromConfig(type, { intervalDays }),
              isValid: true
            };
          }

          case HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD: {
            const repetitionsPerPeriod = freqValue?.repetitionsPerPeriod || 1;
            const period = freqValue?.period || 'week';

            return {
              value: HabitFrequencyManager.buildFromConfig(type, { repetitionsPerPeriod, period }),
              isValid: true
            };
          }

          case HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES: {
            const specificDates = Array.isArray(freqValue)
              ? freqValue.filter((date: any) => typeof date === 'number' && date >= 1 && date <= 31)
              : [1];

            return {
              value: HabitFrequencyManager.buildFromConfig(type, { specificDates }),
              isValid: true
            };
          }

          default:
            return { value: defaultFrequency, isValid: false };
        }
      } catch {
        return { value: defaultFrequency, isValid: false };
      }
    }
  };

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

  static validate = {
    name: (value: any, _settings?: AppSettings['habits']): string => HabitFactory.validators.name(value).value,
    targetAmount: (value: any, _settings?: AppSettings['habits']): number => HabitFactory.validators.targetAmount(value).value,
    category: (value: any, _settings?: AppSettings['habits']): HabitCategory => HabitFactory.validators.category(value).value,
    unit: (value: any, _settings?: AppSettings['habits']): HabitUnit => HabitFactory.validators.unit(value).value,
    priority: (value: any, settings?: AppSettings['habits']): HabitPriority =>
      HabitFactory.validators.priority(value, settings).value,
    notes: (value: any, _settings?: AppSettings['habits']): string => HabitFactory.validators.notes(value).value,
    icon: (value: any, _settings?: AppSettings['habits']): IconName => HabitFactory.validators.icon(value).value,
    color: (value: any, _settings?: AppSettings['habits']): string => HabitFactory.validators.color(value).value,
    startDate: (value: any, _settings?: AppSettings['habits']): DateString => HabitFactory.validators.startDate(value).value,
    reminder: (value: any, settings?: AppSettings['habits']): HabitReminder =>
      HabitFactory.validators.reminder(value, settings).value,
    linkedGoals: (value: any, _settings?: AppSettings['habits']): string[] => HabitFactory.validators.linkedGoals(value).value,
    frequency: (value: any, _settings?: AppSettings['habits']): HabitFrequency => HabitFactory.validators.frequency(value).value
  };

  static validateForm(data: Partial<HabitFormData>, settings?: AppSettings['habits']): FormValidationResult<Habit> {
    const results = {
      name: HabitFactory.validators.name(data.name || ''),
      targetAmount: HabitFactory.validators.targetAmount(data.targetAmount || ''),
      category: HabitFactory.validators.category(data.category || ''),
      unit: HabitFactory.validators.unit(data.unit || ''),
      priority: HabitFactory.validators.priority(data.priority || '', settings),
      notes: HabitFactory.validators.notes(data.notes || ''),
      icon: HabitFactory.validators.icon(data.icon || ''),
      color: HabitFactory.validators.color(data.color || ''),
      startDate: HabitFactory.validators.startDate(data.startDate || ''),
      reminder: HabitFactory.validators.reminder(data.reminder || { enabled: false, time: '' }, settings),
      linkedGoals: HabitFactory.validators.linkedGoals(data.linkedGoals || []),
      frequency: HabitFactory.validators.frequency(data.frequency || {})
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

  static create(data?: Partial<HabitFormData>, existing?: Habit, settings?: AppSettings['habits']): Habit | null {
    try {
      const now = new Date().toISOString();

      return {
        id: existing?.id ?? generateId('habit'),
        name: HabitFactory.validate.name(data?.name, settings),
        category: HabitFactory.validate.category(data?.category, settings),
        icon: HabitFactory.validate.icon(data?.icon, settings),
        color: HabitFactory.validate.color(data?.color, settings),
        targetAmount: HabitFactory.validate.targetAmount(data?.targetAmount, settings),
        unit: HabitFactory.validate.unit(data?.unit, settings),
        frequency: HabitFactory.validate.frequency(data?.frequency, settings),
        priority: HabitFactory.validate.priority(data?.priority, settings),
        notes: HabitFactory.validate.notes(data?.notes, settings),
        linkedGoals: HabitFactory.validate.linkedGoals(data?.linkedGoals, settings),
        startDate: HabitFactory.validate.startDate(data?.startDate, settings),
        reminder: HabitFactory.validate.reminder(data?.reminder, settings),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
    } catch (error) {
      console.error('Failed to create habit:', error);
      return null;
    }
  }

  static update(existing: Habit, updates: Partial<HabitFormData>, settings?: AppSettings['habits']): Habit | null {
    return HabitFactory.create(updates, existing, settings);
  }
}
