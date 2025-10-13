'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // auth
  auth: {
    hashPassword: (password) => ipcRenderer.invoke('auth:hash-password', password),
    verifyPassword: (password, hashedPassword) => ipcRenderer.invoke('auth:verify-password', password, hashedPassword)
  },

  // user
  userData: {
    get: () => ipcRenderer.invoke('user-data:get'),
    save: (userData) => ipcRenderer.invoke('user-data:save', userData),
    update: (field, value) => ipcRenderer.invoke('user-data:update', field, value),
    delete: () => ipcRenderer.invoke('user-data:delete')
  },

  // Goals
  goals: {
    createGoal: (goal) => ipcRenderer.invoke('goal:create', goal),
    updateGoal: (goal) => ipcRenderer.invoke('goal:update', goal),
    deleteGoal: (id, deleteStrategy) => ipcRenderer.invoke('goal:delete', id, deleteStrategy),
    getAllGoals: () => ipcRenderer.invoke('goal:getAll'),
    getGoalById: (id) => ipcRenderer.invoke('goal:getById', id)
  },
  // Tasks
  tasks: {
    createTask: (task) => ipcRenderer.invoke('task:create', task),
    updateTask: (task) => ipcRenderer.invoke('task:update', task),
    deleteTask: (id) => ipcRenderer.invoke('task:delete', id),
    getAllTasks: () => ipcRenderer.invoke('task:getAll'),
    getTaskById: (id) => ipcRenderer.invoke('task:getById', id),
    getTasksByGoalId: (goalId) => ipcRenderer.invoke('task:getByGoalId', goalId)
  },
  // Habits
  habits: {
    createHabit: (habit) => ipcRenderer.invoke('habit:create', habit),
    updateHabit: (habit) => ipcRenderer.invoke('habit:update', habit),
    deleteHabit: (id) => ipcRenderer.invoke('habit:delete', id),
    getAllHabits: () => ipcRenderer.invoke('habit:getAll'),
    getHabitById: (id) => ipcRenderer.invoke('habit:getById', id)
  },
  // Habit Completions
  habitCompletions: {
    createHabitCompletion: (completion) => ipcRenderer.invoke('habitCompletion:create', completion),
    updateHabitCompletion: (completion) => ipcRenderer.invoke('habitCompletion:update', completion),
    deleteHabitCompletion: (id) => ipcRenderer.invoke('habitCompletion:delete', id),
    getHabitCompletions: (habitId, startDate, endDate) => ipcRenderer.invoke('habitCompletion:get', habitId, startDate, endDate)
  },

  updater: {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    onUpdateStatus: (callback) => {
      ipcRenderer.on('update-status', (event, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('update-status');
    },
    onDownloadProgress: (callback) => {
      ipcRenderer.on('download-progress', (event, progress) => callback(progress));
      return () => ipcRenderer.removeAllListeners('download-progress');
    }
  },
  setTheme: (theme) => ipcRenderer.send('set-theme', theme)
});
