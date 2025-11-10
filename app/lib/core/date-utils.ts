import { SYSTEM_CONSTANTS } from './constants';
import type { DateString, WeekDay } from '@/lib/types';

interface TimeParseResult {
  hours: number;
  minutes: number;
}

interface DateFormatOptions {
  showToday?: boolean;
  format?: 'short' | 'long' | 'relative';
  includeWeekday?: boolean;
}

export class DateUtils {
  static getCurrentDateString(): DateString {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * SYSTEM_CONSTANTS.TIME.MILLISECONDS_IN_MINUTE)
      .toISOString()
      .split('T')[0];
  }

  static formatDate(date: Date | DateString): DateString {
    if (typeof date === 'string') return date;
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * SYSTEM_CONSTANTS.TIME.MILLISECONDS_IN_MINUTE);
    return localDate.toISOString().split('T')[0];
  }

  static createDateFromString(dateString: DateString): Date {
    return new Date(dateString + 'T00:00:00');
  }

  static formatDateForDisplay(dateInput: Date | DateString | null | undefined, options: DateFormatOptions = {}): string {
    if (!dateInput) return 'Select date';

    const { showToday = true, format = 'long', includeWeekday = false } = options;
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Invalid date';

    const dateStr = this.formatDate(date);
    const today = this.formatDate(new Date());

    if (showToday && dateStr === today) return 'Today';

    if (format === 'relative') {
      const daysDiff = this.calculateDaysBetween(dateStr, today);
      if (daysDiff === 0) return 'Today';
      if (daysDiff === 1) return 'Yesterday';
      if (daysDiff === -1) return 'Tomorrow';
      if (daysDiff > 0 && daysDiff <= 7) return `${daysDiff} days ago`;
      if (daysDiff < 0 && daysDiff >= -7) return `In ${Math.abs(daysDiff)} days`;
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: format === 'short' ? 'short' : 'long',
      day: 'numeric',
      weekday: includeWeekday || format === 'long' ? (format === 'short' ? 'short' : 'long') : undefined
    };

    return date.toLocaleDateString('en-US', formatOptions);
  }

  static calculateDaysBetween(startDate: DateString, endDate: DateString = this.getCurrentDateString()): number {
    const start = this.createDateFromString(startDate);
    const end = this.createDateFromString(endDate);
    return Math.floor((end.getTime() - start.getTime()) / SYSTEM_CONSTANTS.TIME.MILLISECONDS_IN_DAY);
  }

  static addDays(dateString: DateString, days: number): DateString {
    const date = this.createDateFromString(dateString);
    date.setDate(date.getDate() + days);
    return this.formatDate(date);
  }

  static isDateBefore(dateString: DateString, referenceDate: DateString): boolean {
    return this.createDateFromString(dateString) < this.createDateFromString(referenceDate);
  }

  static isFutureDate(dateString: DateString): boolean {
    return !this.isDateAfterOrEqual(this.getCurrentDateString(), dateString);
  }

  static isDateAfterOrEqual(dateString: DateString, referenceDate: DateString): boolean {
    return this.createDateFromString(dateString) >= this.createDateFromString(referenceDate);
  }

  static isSameDay(a: Date, b: Date): boolean {
    return a.toDateString() === b.toDateString();
  }

  static isToday(dateString: DateString): boolean {
    return dateString === this.getCurrentDateString();
  }

  static getDateWeekday(dateString: DateString): WeekDay {
    return this.createDateFromString(dateString).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as WeekDay;
  }

  static getWeekStart(date: Date = new Date(), sundayStart = false): DateString {
    const start = new Date(date);
    const day = start.getDay();
    const diff = sundayStart ? -day : day === 0 ? -6 : -(day - 1);
    start.setDate(start.getDate() + diff);
    return this.formatDate(start);
  }

  static getWeekEnd(date: Date = new Date(), sundayStart = false): DateString {
    const start = this.createDateFromString(this.getWeekStart(date, sundayStart));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return this.formatDate(end);
  }

  static getMonthStart(date: Date = new Date()): DateString {
    const start = new Date(date);
    start.setDate(1);
    return this.formatDate(start);
  }

  static getMonthEnd(date: Date = new Date()): DateString {
    const end = new Date(date);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    return this.formatDate(end);
  }

  static getMonthRange(date: Date = new Date()): { startOfMonth: Date; endOfMonth: Date } {
    return {
      startOfMonth: new Date(this.getMonthStart(date)),
      endOfMonth: new Date(this.getMonthEnd(date))
    };
  }

  static getDateRange(startDate: DateString, endDate: DateString): DateString[] {
    const dates: DateString[] = [];
    const start = this.createDateFromString(startDate);
    const end = this.createDateFromString(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(this.formatDate(date));
    }

    return dates;
  }

  static generateMonthDays(maxDays: number = SYSTEM_CONSTANTS.CALENDAR.MAX_DAYS_IN_MONTH): Array<{ day: number; date: number }> {
    return Array.from({ length: maxDays }, (_, i) => {
      const day = i + 1;
      return { day, date: day };
    });
  }

  static parseTime(timeString: string): TimeParseResult | null {
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    return { hours, minutes };
  }
}
