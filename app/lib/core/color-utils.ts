import { UI_CONFIG } from './constants';

export class ColorUtils {
  static getCompletionColor(percentage: number): string {
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return 'text-gray-700 dark:text-gray-300';
    }
    if (percentage >= 90) return 'text-emerald-700 dark:text-emerald-400';
    if (percentage >= 70) return 'text-green-700 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-700 dark:text-yellow-400';
    if (percentage >= 30) return 'text-orange-700 dark:text-orange-400';
    return 'text-red-700 dark:text-red-400';
  }

  static getStatusColor(status: string): string {
    const baseClasses = 'border-2 capitalize font-medium bg-transparent rounded-full';
    const statusColors = UI_CONFIG.COLORS.STATUS;
    return `${baseClasses} ${statusColors[status.toLowerCase() as keyof typeof statusColors] || 'text-gray-600 border-gray-200'}`;
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
