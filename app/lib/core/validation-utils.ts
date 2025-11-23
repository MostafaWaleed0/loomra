import { UI_CONFIG } from './constants';

export class ValidationUtils {
  static sanitizeString(str: string): string {
    if (typeof str !== 'string') return '';
    return str.replace(/\s+/g, ' ');
  }

  static sanitizeNotes(str: string): string {
    if (typeof str !== 'string') return '';

    return str
      .trim()
      .replace(/<[^>]*>/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      .replace(/[\u2028\u2029]/g, '')
      .replace(/[^\S\r\n]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      .trim();
  }

  static validateArray<T = unknown>(arr: unknown): T[] {
    return Array.isArray(arr) ? arr : [];
  }

  static validateColor(color: string): string | null {
    if (!color) return null;
    return UI_CONFIG.COLORS.ALL.some((c) => c.value === color) ? color : null;
  }

  static isValidInputMax(value: string, max: number): boolean {
    const inputLength = value.length;
    return !isNaN(inputLength) && inputLength <= max;
  }

  static validateNumberInput(value: string | number, min = 1, max?: number, defaultValue?: number): number {
    const num = typeof value === 'string' ? parseInt(value) : value;
    const validated = Math.max(min, num || defaultValue || min);
    return max ? Math.min(max, validated) : validated;
  }

  static validateNumber(value: unknown, defaultValue = 0, min = 0): number {
    const num = Number(value);
    return isNaN(num) ? defaultValue : Math.max(min, num);
  }

  static validateRequired(data: Record<string, unknown>, fields: string[]): boolean {
    return fields.every((field) => data[field] !== undefined && data[field] !== null && data[field] !== '');
  }
}
