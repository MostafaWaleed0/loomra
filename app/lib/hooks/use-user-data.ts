import { useCallback, useEffect, useState } from 'react';
import { SYSTEM_CONSTANTS, VALIDATION_MESSAGES } from '../core/constants';
import { commands } from '../tauri-api';
import type { UserData } from '../types';

export const ValidationHelpers = {
  username: (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return { valid: false, error: VALIDATION_MESSAGES.USERNAME.REQUIRED };
    }

    if (trimmed.length < SYSTEM_CONSTANTS.VALIDATION.MIN_USERNAME_LENGTH) {
      return { valid: false, error: VALIDATION_MESSAGES.USERNAME.MIN_LENGTH };
    }

    if (trimmed.length > SYSTEM_CONSTANTS.VALIDATION.MAX_USERNAME_LENGTH) {
      return { valid: false, error: VALIDATION_MESSAGES.USERNAME.MAX_LENGTH };
    }

    return { valid: true, value: trimmed };
  },

  password: (value: string, confirmValue?: string) => {
    if (!value) {
      return { valid: false, error: VALIDATION_MESSAGES.PASSWORD.REQUIRED };
    }

    if (value.length < SYSTEM_CONSTANTS.VALIDATION.MIN_PASSWORD_LENGTH) {
      return { valid: false, error: VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH };
    }

    if (value.length > SYSTEM_CONSTANTS.VALIDATION.MAX_PASSWORD_LENGTH) {
      return { valid: false, error: VALIDATION_MESSAGES.PASSWORD.MAX_LENGTH };
    }

    if (confirmValue !== undefined && value !== confirmValue) {
      return { valid: false, error: VALIDATION_MESSAGES.PASSWORD.MISMATCH };
    }

    return { valid: true };
  },

  currentPassword: (value: string) => {
    if (!value) {
      return { valid: false, error: VALIDATION_MESSAGES.PASSWORD.CURRENT_REQUIRED };
    }
    return { valid: true };
  },

  newPassword: (currentValue: string, newValue: string, confirmValue: string) => {
    const errors: Record<string, string> = {};

    if (!currentValue) {
      errors.current = VALIDATION_MESSAGES.PASSWORD.CURRENT_REQUIRED;
    }

    if (!newValue) {
      errors.new = VALIDATION_MESSAGES.PASSWORD.NEW_REQUIRED;
    } else {
      if (newValue.length < SYSTEM_CONSTANTS.VALIDATION.MIN_PASSWORD_LENGTH) {
        errors.new = VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH;
      } else if (newValue.length > SYSTEM_CONSTANTS.VALIDATION.MAX_PASSWORD_LENGTH) {
        errors.new = VALIDATION_MESSAGES.PASSWORD.MAX_LENGTH;
      } else if (currentValue && newValue === currentValue) {
        errors.new = VALIDATION_MESSAGES.PASSWORD.SAME_AS_OLD;
      }
    }

    if (!confirmValue) {
      errors.confirm = VALIDATION_MESSAGES.PASSWORD.CONFIRM_REQUIRED;
    } else if (newValue && confirmValue !== newValue) {
      errors.confirm = VALIDATION_MESSAGES.PASSWORD.MISMATCH;
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
};

// Helper to map useUserData errors to user-friendly messages
export const mapUserDataError = (error: string | undefined): string => {
  if (!error) return VALIDATION_MESSAGES.ERROR.GENERIC;

  const errorMap: Record<string, string> = {
    'No user data found': VALIDATION_MESSAGES.USER_DATA.NO_USER_DATA,
    'Current password is incorrect': VALIDATION_MESSAGES.PASSWORD.CURRENT_INCORRECT,
    'Failed to change password': VALIDATION_MESSAGES.AUTH.PASSWORD_CHANGE_ERROR,
    'Failed to update user data': VALIDATION_MESSAGES.USER_DATA.UPDATE_ERROR,
    'Failed to save user data': VALIDATION_MESSAGES.USER_DATA.SAVE_ERROR
  };

  return errorMap[error] || error;
};

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const data = await commands.userData.get();
        setUserData(data);
        // User exists but not authenticated yet
        setIsAuthenticated(false);
        setError(null);
      } catch (err) {
        console.error('Failed to load user data:', err);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  // Save complete user data (for initial setup with password)
  const saveUserData = useCallback(async (data: UserData & { password: string }) => {
    try {
      const { password, ...userInfo } = data;

      // Hash password in main process
      const hashedPassword = await commands.auth.hashPassword(password);

      const dataWithTimestamp = {
        ...userInfo,
        passwordHash: hashedPassword,
        createdAt: data.createdAt || new Date().toISOString()
      };

      await commands.userData.save(dataWithTimestamp);
      setUserData(dataWithTimestamp);
      setIsAuthenticated(true);
      setError(null);
      return { success: true };
    } catch (err) {
      console.error('Failed to save user data:', err);
      setError('Failed to save user data');
      return { success: false };
    }
  }, []);

  // Verify password for login
  const verifyPassword = useCallback(
    async (password: string): Promise<boolean> => {
      try {
        if (!userData?.passwordHash) {
          return false;
        }

        const isValid = await commands.auth.verifyPassword(password, userData.passwordHash);

        if (isValid) {
          setIsAuthenticated(true);
        }

        return isValid;
      } catch (err) {
        console.error('Failed to verify password:', err);
        return false;
      }
    },
    [userData]
  );

  // Change password (requires current password)
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        if (!userData?.passwordHash) {
          return { success: false, error: 'No user data found' };
        }

        // Verify current password
        const isValid = await commands.auth.verifyPassword(currentPassword, userData.passwordHash);

        if (!isValid) {
          return { success: false, error: 'Current password is incorrect' };
        }

        // Hash new password
        const newHashedPassword = await commands.auth.hashPassword(newPassword);

        // Update user data
        await commands.userData.update('passwordHash', newHashedPassword);
        setUserData((prev) => (prev ? { ...prev, passwordHash: newHashedPassword } : null));
        setError(null);

        return { success: true };
      } catch (err) {
        console.error('Failed to change password:', err);
        setError('Failed to change password');
        return { success: false, error: 'Failed to change password' };
      }
    },
    [userData]
  );

  // Update specific field (excluding password)
  const updateUserData = useCallback(async (field: keyof Omit<UserData, 'passwordHash'>, value: any) => {
    try {
      await commands.userData.update(field, value);
      setUserData((prev) => (prev ? { ...prev, [field]: value } : null));
      setError(null);
      return { success: true };
    } catch (err) {
      console.error('Failed to update user data:', err);
      setError('Failed to update user data');
      return { success: false };
    }
  }, []);

  // Logout (clear authentication state)
  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  // Delete user data (logout/reset)
  const deleteUserData = useCallback(async () => {
    try {
      await commands.userData.delete();
      setUserData(null);
      setIsAuthenticated(false);
      setError(null);
      return { success: true };
    } catch (err) {
      console.error('Failed to delete user data:', err);
      setError('Failed to delete user data');
      return { success: false };
    }
  }, []);

  return {
    userData,
    isLoading,
    error,
    isAuthenticated,
    hasUserData: userData !== null,
    saveUserData,
    verifyPassword,
    changePassword,
    updateUserData,
    deleteUserData,
    logout
  };
}
