'use strict';

const { nativeTheme, ipcMain, app } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

// Get user data path
const getUserDataPath = () => {
  return path.join(app.getPath('userData'), 'user-config.json');
};

function setupIpcHandlers(dbManager) {
  // ============================================================================
  // AUTHENTICATION HANDLERS
  // ============================================================================

  // Hash password
  ipcMain.handle('auth:hash-password', async (event, password) => {
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw error;
    }
  });

  // Verify password
  ipcMain.handle('auth:verify-password', async (event, password, hashedPassword) => {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      return isValid;
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  });

  // ============================================================================
  // USER DATA HANDLERS
  // ============================================================================

  // Get user data
  ipcMain.handle('user-data:get', async () => {
    try {
      const filePath = getUserDataPath();
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, return null
      if (error.code === 'ENOENT') {
        return null;
      }
      console.error('Error reading user data:', error);
      throw error;
    }
  });

  // Save user data
  ipcMain.handle('user-data:save', async (event, userData) => {
    try {
      const filePath = getUserDataPath();
      const data = JSON.stringify(userData, null, 2);
      await fs.writeFile(filePath, data, 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  });

  // Update specific field
  ipcMain.handle('user-data:update', async (event, field, value) => {
    try {
      const filePath = getUserDataPath();
      let userData = {};

      // Read existing data
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        userData = JSON.parse(data);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }

      // Update field
      userData[field] = value;

      // Save
      await fs.writeFile(filePath, JSON.stringify(userData, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  });

  // Delete user data (for reset/logout)
  ipcMain.handle('user-data:delete', async () => {
    try {
      const filePath = getUserDataPath();
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true }; // Already deleted
      }
      console.error('Error deleting user data:', error);
      throw error;
    }
  });

  // ============================================================================
  // GOAL HANDLERS
  // ============================================================================

  ipcMain.handle('goal:create', async (event, goal) => {
    try {
      return await dbManager.createGoal(goal);
    } catch (error) {
      console.error('IPC goal:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('goal:update', async (event, goal) => {
    try {
      return await dbManager.updateGoal(goal);
    } catch (error) {
      console.error('IPC goal:update error:', error);
      throw error;
    }
  });

  ipcMain.handle('goal:delete', async (event, id, deleteStrategy = 'unlink') => {
    try {
      return await dbManager.deleteGoal(id, deleteStrategy);
    } catch (error) {
      console.error('IPC goal:delete error:', error);
      throw error;
    }
  });

  ipcMain.handle('goal:getAll', async () => {
    try {
      return await dbManager.getAllGoals();
    } catch (error) {
      console.error('IPC goal:getAll error:', error);
      throw error;
    }
  });

  ipcMain.handle('goal:getById', async (event, id) => {
    try {
      return await dbManager.getGoalById(id);
    } catch (error) {
      console.error('IPC goal:getById error:', error);
      throw error;
    }
  });

  // ============================================================================
  // TASK HANDLERS
  // ============================================================================

  ipcMain.handle('task:create', async (event, task) => {
    try {
      const createdTask = await dbManager.createTask(task);
      return createdTask;
    } catch (error) {
      console.error('IPC task:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('task:update', async (event, task) => {
    try {
      const updatedTask = await dbManager.updateTask(task);
      return updatedTask;
    } catch (error) {
      console.error('IPC task:update error:', error);
      throw error;
    }
  });

  ipcMain.handle('task:delete', async (event, id) => {
    try {
      const result = await dbManager.deleteTask(id);
      return result;
    } catch (error) {
      console.error('IPC task:delete error:', error);
      throw error;
    }
  });

  ipcMain.handle('task:getAll', async () => {
    try {
      return await dbManager.getAllTasks();
    } catch (error) {
      console.error('IPC task:getAll error:', error);
      throw error;
    }
  });

  ipcMain.handle('task:getById', async (event, id) => {
    try {
      return await dbManager.getTaskById(id);
    } catch (error) {
      console.error('IPC task:getById error:', error);
      throw error;
    }
  });

  ipcMain.handle('task:getByGoalId', async (event, goalId) => {
    try {
      return await dbManager.getTasksByGoalId(goalId);
    } catch (error) {
      console.error('IPC task:getByGoalId error:', error);
      throw error;
    }
  });

  // ============================================================================
  // HABIT HANDLERS
  // ============================================================================

  ipcMain.handle('habit:create', async (event, habit) => {
    try {
      return await dbManager.createHabit(habit);
    } catch (error) {
      console.error('IPC habit:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('habit:update', async (event, habit) => {
    try {
      return await dbManager.updateHabit(habit);
    } catch (error) {
      console.error('IPC habit:update error:', error);
      throw error;
    }
  });

  ipcMain.handle('habit:delete', async (event, id) => {
    try {
      return await dbManager.deleteHabit(id);
    } catch (error) {
      console.error('IPC habit:delete error:', error);
      throw error;
    }
  });

  ipcMain.handle('habit:getAll', async () => {
    try {
      return await dbManager.getAllHabits();
    } catch (error) {
      console.error('IPC habit:getAll error:', error);
      throw error;
    }
  });

  ipcMain.handle('habit:getById', async (event, id) => {
    try {
      return await dbManager.getHabitById(id);
    } catch (error) {
      console.error('IPC habit:getById error:', error);
      throw error;
    }
  });

  // ============================================================================
  // HABIT COMPLETION HANDLERS
  // ============================================================================

  ipcMain.handle('habitCompletion:create', async (event, completion) => {
    try {
      return await dbManager.createHabitCompletion(completion);
    } catch (error) {
      console.error('IPC habitCompletion:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('habitCompletion:update', async (event, completion) => {
    try {
      return await dbManager.updateHabitCompletion(completion);
    } catch (error) {
      console.error('IPC habitCompletion:update error:', error);
      throw error;
    }
  });

  ipcMain.handle('habitCompletion:delete', async (event, id) => {
    try {
      return await dbManager.deleteHabitCompletion(id);
    } catch (error) {
      console.error('IPC habitCompletion:delete error:', error);
      throw error;
    }
  });

  ipcMain.handle('habitCompletion:get', async (event, habitId, startDate, endDate) => {
    try {
      return await dbManager.getHabitCompletions(habitId, startDate, endDate);
    } catch (error) {
      console.error('IPC habitCompletion:get error:', error);
      throw error;
    }
  });

  ipcMain.on('set-theme', (_, theme) => {
    nativeTheme.themeSource = theme;
  });

  console.log('IPC handlers registered successfully');
}

module.exports = { setupIpcHandlers };
