import { UI_CONFIG } from './constants';

export class UIUtils {
  static getIconComponent(iconName: string) {
    return UI_CONFIG.ICONS.MAP[iconName as keyof typeof UI_CONFIG.ICONS.MAP] || null;
  }

  static getRandomItem(items: any) {
    const randomIndex = Math.floor(Math.random() * items.length);
    return items[randomIndex];
  }

  static generateComponentKey(base: string, ...identifiers: (string | number | undefined)[]): string {
    const validIds = identifiers.filter((id) => id !== undefined && id !== null);
    return `${base}-${validIds.join('-')}`;
  }
}
