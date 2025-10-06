export const generateId = (prefix = 'item'): string => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
