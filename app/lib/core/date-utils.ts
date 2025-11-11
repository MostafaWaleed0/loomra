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
  /**
   * Get current date as YYYY-MM-DD string in local timezone
   */
  static getCurrentDateString(): DateString {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * SYSTEM_CONSTANTS.TIME.MILLISECONDS_IN_MINUTE)
      .toISOString()
      .split('T')[0];
  }

  /**
   * Convert Date object to YYYY-MM-DD string, or return string as-is
   */
  static formatDate(date: Date | DateString): DateString {
    if (typeof date === 'string') return date;
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * SYSTEM_CONSTANTS.TIME.MILLISECONDS_IN_MINUTE);
    return localDate.toISOString().split('T')[0];
  }

  /**
   * Create Date object from YYYY-MM-DD string at midnight local time
   */
  static createDateFromString(dateString: DateString): Date {
    return new Date(dateString + 'T00:00:00');
  }

  /**
   * Format date for display with various options
   */
  static formatDateForDisplay(dateInput: Date | DateString | null | undefined, options: DateFormatOptions = {}): string {
    if (!dateInput) return 'Select date';

    const { showToday = true, format = 'long', includeWeekday = false } = options;
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    if (isNaN(date.getTime())) return 'Invalid date';

    const dateStr = this.formatDate(date);
    const today = this.getCurrentDateString();

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

  /**
   * Calculate days between two dates (positive = startDate is before endDate)
   */
  static calculateDaysBetween(startDate: DateString, endDate: DateString = this.getCurrentDateString()): number {
    const start = this.createDateFromString(startDate);
    const end = this.createDateFromString(endDate);
    return Math.floor((end.getTime() - start.getTime()) / SYSTEM_CONSTANTS.TIME.MILLISECONDS_IN_DAY);
  }

  /**
   * Add days to a date string
   */
  static addDays(dateString: DateString, days: number): DateString {
    const date = this.createDateFromString(dateString);
    date.setDate(date.getDate() + days);
    return this.formatDate(date);
  }

  /**
   * Check if date is before reference date
   */
  static isDateBefore(dateString: DateString, referenceDate: DateString): boolean {
    return this.createDateFromString(dateString) < this.createDateFromString(referenceDate);
  }

  /**
   * Check if date is in the future
   */
  static isFutureDate(dateString: DateString): boolean {
    return this.isDateBefore(this.getCurrentDateString(), dateString);
  }

  /**
   * Check if date is after or equal to reference date
   */
  static isDateAfterOrEqual(dateString: DateString, referenceDate: DateString): boolean {
    return this.createDateFromString(dateString) >= this.createDateFromString(referenceDate);
  }

  /**
   * Check if two Date objects are the same day
   */
  static isSameDay(a: Date, b: Date): boolean {
    return a.toDateString() === b.toDateString();
  }

  /**
   * Check if date string is today
   */
  static isToday(dateString: DateString): boolean {
    return dateString === this.getCurrentDateString();
  }

  /**
   * Get weekday name from date string
   */
  static getDateWeekday(dateString: DateString): WeekDay {
    return this.createDateFromString(dateString).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as WeekDay;
  }

  /**
   * Get start of week for a given date
   * @param date - Date to get week start for
   * @param sundayStart - If true, week starts on Sunday; if false, starts on Monday
   */
  static getWeekStart(date: Date = new Date(), sundayStart = false): DateString {
    const start = new Date(date);
    const day = start.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    let diff: number;
    if (sundayStart) {
      // Week starts on Sunday
      diff = -day;
    } else {
      // Week starts on Monday
      // If Sunday (day = 0), go back 6 days to Monday
      // Otherwise, go back (day - 1) days to Monday
      diff = day === 0 ? -6 : -(day - 1);
    }

    start.setDate(start.getDate() + diff);
    return this.formatDate(start);
  }

  /**
   * Get end of week for a given date
   */
  static getWeekEnd(date: Date = new Date(), sundayStart = false): DateString {
    const start = this.createDateFromString(this.getWeekStart(date, sundayStart));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return this.formatDate(end);
  }

  /**
   * Get first day of month
   */
  static getMonthStart(date: Date = new Date()): DateString {
    const start = new Date(date);
    start.setDate(1);
    return this.formatDate(start);
  }

  /**
   * Get last day of month
   */
  static getMonthEnd(date: Date = new Date()): DateString {
    const end = new Date(date);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    return this.formatDate(end);
  }

  /**
   * Get month range as Date objects
   */
  static getMonthRange(date: Date = new Date()): { startOfMonth: Date; endOfMonth: Date } {
    return {
      startOfMonth: this.createDateFromString(this.getMonthStart(date)),
      endOfMonth: this.createDateFromString(this.getMonthEnd(date))
    };
  }

  /**
   * Get array of date strings between start and end (inclusive)
   * Returns empty array if startDate > endDate
   */
  static getDateRange(startDate: DateString, endDate: DateString): DateString[] {
    const dates: DateString[] = [];
    const start = this.createDateFromString(startDate);
    const end = this.createDateFromString(endDate);

    // Validate date order
    if (start > end) {
      console.warn('getDateRange: startDate is after endDate, returning empty array');
      return dates;
    }

    // Use a new Date object for iteration to avoid modifying the input
    const currentDate = new Date(start);

    while (currentDate <= end) {
      dates.push(this.formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  /**
   * Generate array of month days for calendar display
   */
  static generateMonthDays(maxDays: number = SYSTEM_CONSTANTS.CALENDAR.MAX_DAYS_IN_MONTH): Array<{ day: number; date: number }> {
    return Array.from({ length: maxDays }, (_, i) => {
      const day = i + 1;
      return { day, date: day };
    });
  }

  /**
   * Parse time string in HH:MM format
   */
  static parseTime(timeString: string): TimeParseResult | null {
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    return { hours, minutes };
  }

  /**
   * Get number of days in a specific month
   */
  static getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Check if a year is a leap year
   */
  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Get week number of the year (ISO 8601)
   */
  static getWeekNumber(date: Date = new Date()): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
