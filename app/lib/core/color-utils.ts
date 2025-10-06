import { UI_CONFIG } from './constants';

export class ColorUtils {
  static getCompletionColor(percentage: number): string {
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return 'text-gray-700';
    }
    if (percentage >= 90) return 'text-emerald-700';
    if (percentage >= 70) return 'text-green-700';
    if (percentage >= 50) return 'text-yellow-700';
    if (percentage >= 30) return 'text-orange-700';
    return 'text-red-700';
  }

  static getPriorityColor(priority: string): string {
    const baseClasses = 'border-2 capitalize font-medium bg-transparent rounded-full';
    const priorityColors = UI_CONFIG.COLORS.PRIORITY;
    return `${baseClasses} ${
      priorityColors[priority.toLowerCase() as keyof typeof priorityColors] || 'text-gray-600 border-gray-200'
    }`;
  }

  static getProgressColor(percentage: number): string {
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return 'text-gray-600';
    }
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  }
}
