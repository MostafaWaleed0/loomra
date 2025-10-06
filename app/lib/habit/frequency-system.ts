import { HABIT_CONFIG, WEEK_DAYS } from '../core/constants';
import { DateUtils, ValidationUtils, FormatUtils } from '@/lib/core';
import type {
  HabitFrequency,
  HabitFrequencyType,
  HabitPeriod,
  WeekDay,
  DateString,
  FrequencyConfig,
  DailyFrequencyValue,
  IntervalFrequencyValue,
  XTimesPerPeriodFrequencyValue,
  SpecificDatesFrequencyValue,
  HabitFrequencyWithSummary
} from '@/lib/types';

export class HabitFrequencyManager {
  // ---- Descriptions ----
  static describeDaily(days: WeekDay[]): string {
    if (!days || days.length === 0) return 'No days selected';
    if (days.length === 7) return 'Every day';

    const weekdays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const weekends: WeekDay[] = ['saturday', 'sunday'];

    const isWeekdaysOnly =
      weekdays.every((day) => days.includes(day)) && weekends.every((day) => !days.includes(day)) && days.length === 5;

    const isWeekendsOnly =
      weekends.every((day) => days.includes(day)) && weekdays.every((day) => !days.includes(day)) && days.length === 2;

    if (isWeekdaysOnly) return 'Weekdays (Mon-Fri)';
    if (isWeekendsOnly) return 'Weekends (Sat-Sun)';

    if (days.length <= 3) {
      const dayNames = days.map((day) => day.charAt(0).toUpperCase() + day.slice(1, 3));
      return `${dayNames.join(', ')} each week`;
    }

    return `${days.length} days per week`;
  }

  static describeXTimesPerPeriod({
    repetitionsPerPeriod = 1,
    period = 'week'
  }: {
    repetitionsPerPeriod: number;
    period: HabitPeriod;
  }): string {
    return `${repetitionsPerPeriod} ${repetitionsPerPeriod === 1 ? 'time' : 'times'} per ${period}`;
  }

  static describeSpecificDates(dates: number[]): string {
    if (!dates || dates.length === 0) return 'No dates selected';
    if (dates.length === 1) return `Day ${dates[0]} of each month`;

    const sortedDates = [...dates].sort((a, b) => a - b);
    if (dates.length <= 3) {
      const lastDate = sortedDates.pop()!;
      const datesStr = sortedDates.length > 0 ? `${sortedDates.join(', ')} and ${lastDate}` : lastDate.toString();
      return `Days ${datesStr} of each month`;
    }

    return `${dates.length} specific days per month`;
  }

  static describeInterval({ interval }: { interval: number }): string {
    return `Every ${FormatUtils.formatPlural(interval, 'day')}`;
  }

  // ---- Core frequency operations ----
  static describe(frequency: HabitFrequency | null | undefined): string {
    if (!frequency) return 'No frequency set';

    switch (frequency.type) {
      case HABIT_CONFIG.FREQUENCIES.DAILY:
        return this.describeDaily(frequency.value || []);
      case HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD:
        return this.describeXTimesPerPeriod(frequency.value || { repetitionsPerPeriod: 1, period: 'week' });
      case HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES:
        return this.describeSpecificDates(frequency.value || []);
      case HABIT_CONFIG.FREQUENCIES.INTERVAL:
        return this.describeInterval(frequency.value || { interval: 1 });
      default:
        return 'Unknown frequency';
    }
  }

  static shouldCompleteOnDate(frequency: HabitFrequency, dateString: DateString, habitStartDate?: DateString): boolean {
    if (!frequency || (habitStartDate && !DateUtils.isDateAfterOrEqual(dateString, habitStartDate))) {
      return false;
    }

    switch (frequency.type) {
      case HABIT_CONFIG.FREQUENCIES.DAILY: {
        const dayOfWeek = DateUtils.getDateWeekday(dateString);
        return Array.isArray(frequency.value) && frequency.value.includes(dayOfWeek);
      }

      case HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES: {
        if (!Array.isArray(frequency.value)) return false;
        const dayOfMonth = parseInt(dateString.split('-')[2]);
        return frequency.value.includes(dayOfMonth);
      }

      case HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD:
        return true;

      case HABIT_CONFIG.FREQUENCIES.INTERVAL: {
        if (!frequency.value?.interval || !habitStartDate) return false;
        const daysSinceStart = DateUtils.calculateDaysBetween(habitStartDate, dateString);
        return daysSinceStart >= 0 && daysSinceStart % frequency.value.interval === 0;
      }

      default:
        return false;
    }
  }

  // ---- Builders ----
  static buildDaily(config: FrequencyConfig): DailyFrequencyValue {
    return {
      type: HABIT_CONFIG.FREQUENCIES.DAILY,
      value: config.selectedDays || WEEK_DAYS.map((d) => d.key)
    };
  }

  static buildInterval(config: FrequencyConfig): IntervalFrequencyValue {
    return {
      type: HABIT_CONFIG.FREQUENCIES.INTERVAL,
      value: {
        interval: Math.max(1, Number(config.intervalDays || 2))
      }
    };
  }

  static buildXTimesPerPeriod(config: FrequencyConfig): XTimesPerPeriodFrequencyValue {
    return {
      type: HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD,
      value: {
        repetitionsPerPeriod: Math.max(1, Number(config.repetitionsPerPeriod || 3)),
        period: config.period || 'week'
      }
    };
  }

  static buildSpecificDates(config: FrequencyConfig): SpecificDatesFrequencyValue {
    return {
      type: HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES,
      value: ValidationUtils.validateArray(config.specificDates)
    };
  }

  static buildFromConfig(type: HabitFrequencyType, config: FrequencyConfig): HabitFrequency {
    const builders: Record<HabitFrequencyType, () => HabitFrequency> = {
      [HABIT_CONFIG.FREQUENCIES.DAILY]: () => this.buildDaily(config),
      [HABIT_CONFIG.FREQUENCIES.INTERVAL]: () => this.buildInterval(config),
      [HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD]: () => this.buildXTimesPerPeriod(config),
      [HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES]: () => this.buildSpecificDates(config)
    };

    try {
      return builders[type]?.() ?? this.createDefaultFrequency();
    } catch {
      return this.createDefaultFrequency();
    }
  }

  // ---- Validation ----
  static isValid(frequency: HabitFrequency | null | undefined): boolean {
    if (!frequency?.type) return false;

    switch (frequency.type) {
      case HABIT_CONFIG.FREQUENCIES.DAILY:
        return Array.isArray(frequency.value) && frequency.value.length > 0;

      case HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD:
        return (
          frequency.value && typeof frequency.value.repetitionsPerPeriod === 'number' && frequency.value.repetitionsPerPeriod > 0
        );

      case HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES:
        return Array.isArray(frequency.value);

      case HABIT_CONFIG.FREQUENCIES.INTERVAL:
        return frequency.value && typeof frequency.value.interval === 'number' && frequency.value.interval > 0;

      default:
        return false;
    }
  }

  // ---- Defaults ----
  static createDefaultFrequency(): HabitFrequencyWithSummary {
    const frequency: HabitFrequency = {
      type: HABIT_CONFIG.FREQUENCIES.DAILY,
      value: WEEK_DAYS.map((d) => d.key)
    };

    return {
      ...frequency,
      summary: this.describe(frequency)
    };
  }

  // ---- Convenience Creators ----
  static createDaily(days: WeekDay[]): HabitFrequency {
    return this.buildFromConfig(HABIT_CONFIG.FREQUENCIES.DAILY, { selectedDays: days });
  }

  static createInterval(intervalDays: number): HabitFrequency {
    return this.buildFromConfig(HABIT_CONFIG.FREQUENCIES.INTERVAL, { intervalDays });
  }

  static createXTimesPerPeriod(repetitions: number, period: HabitPeriod = 'week'): HabitFrequency {
    return this.buildFromConfig(HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD, {
      repetitionsPerPeriod: repetitions,
      period
    });
  }

  static createSpecificDates(dates: number[]): HabitFrequency {
    return this.buildFromConfig(HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES, { specificDates: dates });
  }
}
