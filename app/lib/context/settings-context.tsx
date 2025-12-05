'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AppSettings } from '@/lib/tauri-api';
import { commands } from '@/lib/tauri-api';

// ============================================================================
// TYPES
// ============================================================================

interface SettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  updateSettings: (updates: AppSettings) => Promise<boolean>;
  updateAppearance: (updates: Partial<AppSettings['appearance']>) => Promise<boolean>;
  updateHabits: (updates: Partial<AppSettings['habits']>) => Promise<boolean>;
  updateGoals: (updates: Partial<AppSettings['goals']>) => Promise<boolean>;
  updateNotifications: (updates: Partial<AppSettings['notifications']>) => Promise<boolean>;
  updateData: (updates: Partial<AppSettings['data']>) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
  exportAllData: () => Promise<void>;
  importAllData: (file: File) => Promise<boolean>;
  exportSettings: () => void;
  importSettings: (file: File) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

// ============================================================================
// DEFAULT SETTINGS - Single source of truth
// ============================================================================

const DEFAULT_SETTINGS: AppSettings = {
  appearance: {
    theme: 'system',
    weekStartsOn: 'sunday',
    timezone: 'auto'
  },
  habits: {
    defaultPriority: 'medium',
    defaultReminder: false,
    defaultReminderTime: '09:00'
  },
  goals: {
    defaultCategory: 'Productivity',
    showProgressPercentage: true,
    deadlineWarningDays: 30
  },
  notifications: {
    habitReminders: true,
    goalDeadlines: true,
    streakReminders: true
  },
  data: {
    autoBackup: true,
    backupFrequency: 'weekly'
  }
};

// ============================================================================
// CONTEXT
// ============================================================================

const SettingsContext = createContext<SettingsContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // LOAD SETTINGS (with initialization on first run)
  // ============================================================================

  const refreshSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get settings from backend
      const loadedSettings = await commands.settings.getSettings();

      if (loadedSettings === null) {
        // First run - no settings exist yet
        console.log('First run detected - initializing settings with defaults');

        // Save default settings to backend
        const savedSettings = await commands.settings.saveSettings(DEFAULT_SETTINGS);
        setSettings(savedSettings);
      } else {
        // Settings exist - use them
        setSettings(loadedSettings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings');

      // On error, try to save defaults
      try {
        const savedSettings = await commands.settings.saveSettings(DEFAULT_SETTINGS);
        setSettings(savedSettings);
      } catch (saveErr) {
        console.error('Failed to save default settings:', saveErr);
        setSettings(DEFAULT_SETTINGS);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // ============================================================================
  // UPDATE FULL SETTINGS
  // ============================================================================

  const updateSettings = useCallback(
    async (updates: AppSettings): Promise<boolean> => {
      try {
        setIsSaving(true);
        setError(null);

        // Optimistically update local state
        setSettings(updates);

        // Save to backend
        const savedSettings = await commands.settings.saveSettings(updates);

        // Confirm with backend response
        setSettings(savedSettings);
        return true;
      } catch (err) {
        console.error('Failed to update settings:', err);
        setError('Failed to save settings');

        // Revert optimistic update
        await refreshSettings();
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [refreshSettings]
  );

  // ============================================================================
  // UPDATE APPEARANCE SETTINGS
  // ============================================================================

  const updateAppearance = useCallback(
    async (updates: Partial<AppSettings['appearance']>): Promise<boolean> => {
      try {
        setIsSaving(true);
        setError(null);

        const newAppearance = { ...settings.appearance, ...updates };

        // Optimistically update local state
        setSettings((prev) => ({ ...prev, appearance: newAppearance }));

        // Save using the specific API endpoint
        const savedSettings = await commands.settings.updateAppearanceSettings(newAppearance);

        setSettings(savedSettings);
        return true;
      } catch (err) {
        console.error('Failed to update appearance settings:', err);
        setError('Failed to save appearance settings');
        await refreshSettings();
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [settings.appearance, refreshSettings]
  );

  // ============================================================================
  // UPDATE HABITS SETTINGS
  // ============================================================================

  const updateHabits = useCallback(
    async (updates: Partial<AppSettings['habits']>): Promise<boolean> => {
      try {
        setIsSaving(true);
        setError(null);

        const newHabits = { ...settings.habits, ...updates };

        // Optimistically update local state
        setSettings((prev) => ({ ...prev, habits: newHabits }));

        // Save using the specific API endpoint
        const savedSettings = await commands.settings.updateHabitSettings(newHabits);

        setSettings(savedSettings);
        return true;
      } catch (err) {
        console.error('Failed to update habit settings:', err);
        setError('Failed to save habit settings');
        await refreshSettings();
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [settings.habits, refreshSettings]
  );

  // ============================================================================
  // UPDATE GOALS SETTINGS
  // ============================================================================

  const updateGoals = useCallback(
    async (updates: Partial<AppSettings['goals']>): Promise<boolean> => {
      try {
        setIsSaving(true);
        setError(null);

        const newGoals = { ...settings.goals, ...updates };

        // Optimistically update local state
        setSettings((prev) => ({ ...prev, goals: newGoals }));

        // Save using the specific API endpoint
        const savedSettings = await commands.settings.updateGoalSettings(newGoals);

        setSettings(savedSettings);
        return true;
      } catch (err) {
        console.error('Failed to update goal settings:', err);
        setError('Failed to save goal settings');
        await refreshSettings();
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [settings.goals, refreshSettings]
  );

  // ============================================================================
  // UPDATE NOTIFICATIONS SETTINGS
  // ============================================================================

  const updateNotifications = useCallback(
    async (updates: Partial<AppSettings['notifications']>): Promise<boolean> => {
      try {
        setIsSaving(true);
        setError(null);

        const newNotifications = { ...settings.notifications, ...updates };

        // Optimistically update local state
        setSettings((prev) => ({ ...prev, notifications: newNotifications }));

        // Save using the specific API endpoint
        const savedSettings = await commands.settings.updateNotificationSettings(newNotifications);

        setSettings(savedSettings);
        return true;
      } catch (err) {
        console.error('Failed to update notification settings:', err);
        setError('Failed to save notification settings');
        await refreshSettings();
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [settings.notifications, refreshSettings]
  );

  // ============================================================================
  // UPDATE DATA SETTINGS
  // ============================================================================

  const updateData = useCallback(
    async (updates: Partial<AppSettings['data']>): Promise<boolean> => {
      try {
        setIsSaving(true);
        setError(null);

        const newData = { ...settings.data, ...updates };

        // Optimistically update local state
        setSettings((prev) => ({ ...prev, data: newData }));

        // Save using the specific API endpoint
        const savedSettings = await commands.settings.updateDataSettings(newData);

        setSettings(savedSettings);
        return true;
      } catch (err) {
        console.error('Failed to update data settings:', err);
        setError('Failed to save data settings');
        await refreshSettings();
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [settings.data, refreshSettings]
  );

  // ============================================================================
  // RESET SETTINGS
  // ============================================================================

  const resetSettings = useCallback(async (): Promise<boolean> => {
    try {
      setIsSaving(true);
      setError(null);

      const resetSettings = await commands.settings.resetSettings({ defaultSettings: DEFAULT_SETTINGS });

      setSettings(resetSettings);
      return true;
    } catch (err) {
      console.error('Failed to reset settings:', err);
      setError('Failed to reset settings');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ============================================================================
  // EXPORT ALL DATA (SETTINGS + DATABASE)
  // ============================================================================

  const exportAllData = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Get complete data from backend
      const jsonData = await commands.settings.exportAllData();

      // Create blob and download
      const dataBlob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `loomra-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export all data:', err);
      setError('Failed to export data');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ============================================================================
  // IMPORT ALL DATA (SETTINGS + DATABASE)
  // ============================================================================

  const importAllData = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        setIsSaving(true);
        setError(null);

        // Read file content
        const text = await file.text();

        // Validate JSON
        try {
          JSON.parse(text);
        } catch {
          throw new Error('Invalid JSON format');
        }

        // Import using backend API
        const result = await commands.settings.importAllData(text);

        if (result) {
          // Refresh settings after import
          await refreshSettings();

          // Trigger full app refresh to reload all data
          window.location.reload();

          return true;
        }

        return false;
      } catch (err) {
        console.error('Failed to import all data:', err);
        setError('Failed to import data. Please check the file format.');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [refreshSettings]
  );

  // ============================================================================
  // EXPORT SETTINGS ONLY (Legacy)
  // ============================================================================

  const exportSettings = useCallback(async () => {
    try {
      // Get JSON string from backend
      const jsonData = await commands.settings.exportSettings();

      // Create blob and download
      const dataBlob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `loomra-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export settings:', err);
      setError('Failed to export settings');
    }
  }, []);

  // ============================================================================
  // IMPORT SETTINGS ONLY (Legacy)
  // ============================================================================

  const importSettings = useCallback(async (file: File): Promise<boolean> => {
    try {
      setIsSaving(true);
      setError(null);

      // Read file content
      const text = await file.text();

      // Validate JSON
      try {
        JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON format');
      }

      // Import using backend API
      const importedSettings = await commands.settings.importSettings(text);

      setSettings(importedSettings);
      return true;
    } catch (err) {
      console.error('Failed to import settings:', err);
      setError('Failed to import settings. Please check the file format.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: SettingsContextValue = {
    settings,
    isLoading,
    isSaving,
    error,
    updateSettings,
    updateAppearance,
    updateHabits,
    updateGoals,
    updateNotifications,
    updateData,
    resetSettings,
    exportAllData,
    importAllData,
    exportSettings,
    importSettings,
    refreshSettings
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// ============================================================================
// SETTINGS-AWARE HOOKS
// ============================================================================

/**
 * Hook that returns habit default values from settings
 */
export function useHabitDefaults() {
  const { settings } = useSettings();

  return {
    defaultPriority: settings.habits.defaultPriority,
    defaultReminder: settings.habits.defaultReminder,
    defaultReminderTime: settings.habits.defaultReminderTime
  };
}

/**
 * Hook that returns goal default values from settings
 */
export function useGoalDefaults() {
  const { settings } = useSettings();

  return {
    defaultCategory: settings.goals.defaultCategory,
    showProgressPercentage: settings.goals.showProgressPercentage,
    deadlineWarningDays: settings.goals.deadlineWarningDays
  };
}

/**
 * Hook that returns appearance settings
 */
export function useAppearanceSettings() {
  const { settings } = useSettings();

  return {
    theme: settings.appearance.theme,
    weekStartsOn: settings.appearance.weekStartsOn,
    timezone: settings.appearance.timezone
  };
}

/**
 * Hook that returns notification settings
 */
export function useNotificationSettings() {
  const { settings } = useSettings();

  return settings.notifications;
}

/**
 * Hook that returns data settings
 */
export function useDataSettings() {
  const { settings } = useSettings();

  return settings.data;
}
