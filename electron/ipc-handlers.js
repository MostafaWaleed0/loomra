'use strict';

const { nativeTheme, ipcMain } = require('electron');

function setupIpcHandlers(dbManager, mainWindow) {
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
      // No progress update needed - calculate on read instead
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
  // HABIT HANDLERS (Placeholder - implement based on your DatabaseManager)
  // ============================================================================

  ipcMain.handle('habit:create', async (event, habit) => {
    try {
      // Implement createHabit in DatabaseManager
      return await dbManager.createHabit(habit);
    } catch (error) {
      console.error('IPC habit:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('habit:update', async (event, habit) => {
    try {
      // Implement updateHabit in DatabaseManager
      return await dbManager.updateHabit(habit);
    } catch (error) {
      console.error('IPC habit:update error:', error);
      throw error;
    }
  });

  ipcMain.handle('habit:delete', async (event, id) => {
    try {
      // Implement deleteHabit in DatabaseManager
      return await dbManager.deleteHabit(id);
    } catch (error) {
      console.error('IPC habit:delete error:', error);
      throw error;
    }
  });

  ipcMain.handle('habit:getAll', async () => {
    try {
      // Implement getAllHabits in DatabaseManager
      return await dbManager.getAllHabits();
    } catch (error) {
      console.error('IPC habit:getAll error:', error);
      throw error;
    }
  });

  ipcMain.handle('habit:getById', async (event, id) => {
    try {
      // Implement getHabitById in DatabaseManager
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
      // Implement createHabitCompletion in DatabaseManager
      return await dbManager.createHabitCompletion(completion);
    } catch (error) {
      console.error('IPC habitCompletion:create error:', error);
      throw error;
    }
  });

  ipcMain.handle('habitCompletion:update', async (event, completion) => {
    try {
      // Implement updateHabitCompletion in DatabaseManager
      return await dbManager.updateHabitCompletion(completion);
    } catch (error) {
      console.error('IPC habitCompletion:update error:', error);
      throw error;
    }
  });

  ipcMain.handle('habitCompletion:delete', async (event, id) => {
    try {
      // Implement deleteHabitCompletion in DatabaseManager
      return await dbManager.deleteHabitCompletion(id);
    } catch (error) {
      console.error('IPC habitCompletion:delete error:', error);
      throw error;
    }
  });

  ipcMain.handle('habitCompletion:get', async (event, habitId, startDate, endDate) => {
    try {
      // Implement getHabitCompletions in DatabaseManager
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
