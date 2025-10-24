import { useCallback, useEffect, useState } from 'react';
import type { UserData } from '../types';
import { commands } from '../tauri-api';

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
