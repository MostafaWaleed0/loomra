export class FormatUtils {
  static formatPlural(count: number, singular: string, options?: { showNumber?: boolean; plural?: string }): string {
    const { showNumber = true, plural = `${singular}s` } = options || {};
    const word = count === 1 ? singular : plural;
    return showNumber ? `${count} ${word}` : word;
  }

  static formatProgress(completed: number, total: number, options?: { showPercentage?: boolean; precision?: number }): string {
    const { showPercentage = true, precision = 0 } = options || {};
    const percentage = total > 0 ? ((completed / total) * 100).toFixed(precision) : '0';

    if (showPercentage) {
      return `${completed}/${total} (${percentage}%)`;
    }
    return `${completed}/${total} Completed`;
  }

  static formatPercentage(value: number, total: number, precision = 0): string {
    if (total === 0) return '0%';
    const percentage = ((value / total) * 100).toFixed(precision);
    return `${percentage}%`;
  }

  static formatSelectionBadge(count: number, itemType = 'item'): string {
    const plural = itemType === 'day' ? 'days' : itemType.endsWith('y') ? itemType.slice(0, -1) + 'ies' : `${itemType}s`;
    return `${count} ${count === 1 ? itemType : plural} selected`;
  }

  static truncateText(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  static formatList(items: string[], options?: { conjunction?: 'and' | 'or'; maxItems?: number; moreText?: string }): string {
    const { conjunction = 'and', maxItems, moreText = 'more' } = options || {};

    if (items.length === 0) return '';
    if (items.length === 1) return items[0];

    let displayItems = items;
    let hasMore = false;

    if (maxItems && items.length > maxItems) {
      displayItems = items.slice(0, maxItems);
      hasMore = true;
    }

    if (displayItems.length === 2) {
      const result = `${displayItems[0]} ${conjunction} ${displayItems[1]}`;
      return hasMore ? `${result} ${conjunction} ${items.length - maxItems!} ${moreText}` : result;
    }

    const lastItem = displayItems.pop()!;
    const result = `${displayItems.join(', ')} ${conjunction} ${lastItem}`;
    return hasMore ? `${result} ${conjunction} ${items.length - maxItems!} ${moreText}` : result;
  }
}
