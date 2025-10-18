'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const pathManager = require('./path-manager');

function DatabaseManager() {
  this.dbPath = pathManager.getDatabasePath();
  this.db = null;
}

DatabaseManager.prototype.initialize = function () {
  try {
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(this.dbPath);

    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.createTables();
    this.runMigrations();
    console.log('Database initialized successfully at:', this.dbPath);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

DatabaseManager.prototype.createTables = function () {
  if (!this.db) throw new Error('Database not initialized');

  this.db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      deadline TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  this.db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN DEFAULT FALSE,
      goal_id TEXT,
      due_date TEXT,
      priority TEXT DEFAULT 'medium',
      created_at TEXT NOT NULL,
      FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE
    )
  `);

  this.db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      target_amount REAL DEFAULT 1,
      unit TEXT DEFAULT 'times',
      frequency_type TEXT NOT NULL,
      frequency_value TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      notes TEXT DEFAULT '',
      linked_goals TEXT DEFAULT '[]',
      start_date TEXT NOT NULL,
      reminder_enabled BOOLEAN DEFAULT FALSE,
      reminder_time TEXT DEFAULT '09:00',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  this.db.exec(`
    CREATE TABLE IF NOT EXISTS habit_completions (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      actual_amount REAL DEFAULT 0,
      target_amount REAL DEFAULT 1,
      completed_at TEXT,
      note TEXT DEFAULT '',
      mood INTEGER,
      difficulty INTEGER,
      skipped BOOLEAN DEFAULT FALSE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
      UNIQUE (habit_id, date)
    )
  `);

  this.db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks (goal_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
    CREATE INDEX IF NOT EXISTS idx_goals_status ON goals (status);
    CREATE INDEX IF NOT EXISTS idx_goals_category ON goals (category);
    CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals (deadline);
    CREATE INDEX IF NOT EXISTS idx_habits_category ON habits (category);
    CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions (habit_id);
    CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions (date);
    CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions (habit_id, date);
  `);
};

DatabaseManager.prototype.runMigrations = function () {
  if (!this.db) return;

  const currentVersion = this.db.pragma('user_version', { simple: true });

  const migrations = [
    () => {
      // Migration 1: Add indexes
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_goals_status ON goals (status);
        CREATE INDEX IF NOT EXISTS idx_goals_category ON goals (category);
        CREATE INDEX IF NOT EXISTS idx_habits_category ON habits (category);
      `);
    },
    () => {
      // Migration 2: Add notes column if it doesn't exist
      const columns = this.db.pragma('table_info(goals)');
      const hasNotes = columns.some((col) => col.name === 'notes');
      if (!hasNotes) {
        this.db.exec('ALTER TABLE goals ADD COLUMN notes TEXT DEFAULT ""');
      }
    }
  ];

  for (let i = currentVersion; i < migrations.length; i++) {
    try {
      migrations[i]();
      this.db.pragma(`user_version = ${i + 1}`);
      console.log(`Migration ${i + 1} completed`);
    } catch (error) {
      console.error(`Migration ${i + 1} failed:`, error);
      throw error;
    }
  }
};

// ============================================================================
// GOAL OPERATIONS WITH VALIDATION
// ============================================================================

DatabaseManager.prototype.createGoal = function (goal) {
  if (!this.db) throw new Error('Database not initialized');

  if (!goal || !goal.id || !goal.title) {
    throw new Error('Invalid goal data: id and title are required');
  }

  try {
    const stmt = this.db.prepare(`
      INSERT INTO goals (
        id, title, description, notes, category, priority, status,
        color, icon, deadline, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      goal.id,
      goal.title,
      goal.description || '',
      goal.notes || '',
      goal.category,
      goal.priority,
      goal.status,
      goal.color,
      goal.icon,
      goal.deadline || null,
      goal.createdAt,
      goal.updatedAt
    );

    return this.getGoalById(goal.id);
  } catch (error) {
    console.error('Failed to create goal:', error);
    throw error;
  }
};

DatabaseManager.prototype.updateGoal = function (goal) {
  if (!this.db) throw new Error('Database not initialized');

  if (!goal || !goal.id) {
    throw new Error('Invalid goal data: id is required');
  }

  try {
    const existingGoal = this.getGoalById(goal.id);
    if (!existingGoal) {
      throw new Error(`Goal with id ${goal.id} not found`);
    }

    const stmt = this.db.prepare(`
      UPDATE goals SET
        title = ?, description = ?, notes = ?, category = ?, priority = ?,
        status = ?, color = ?, icon = ?, deadline = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      goal.title,
      goal.description || '',
      goal.notes || '',
      goal.category,
      goal.priority,
      goal.status,
      goal.color,
      goal.icon,
      goal.deadline || null,
      goal.updatedAt,
      goal.id
    );

    return this.getGoalById(goal.id);
  } catch (error) {
    console.error('Failed to update goal:', error);
    throw error;
  }
};

DatabaseManager.prototype.deleteGoal = function (id, deleteStrategy = 'unlink') {
  if (!this.db) throw new Error('Database not initialized');
  if (!id) throw new Error('Goal ID is required');

  try {
    const goal = this.getGoalById(id);
    if (!goal) return false;

    // Remove this goal from all habits' linkedGoals arrays
    this.removeGoalFromHabits(id);

    if (deleteStrategy === 'cascade') {
      // Delete goal and all its tasks
      this.db.prepare('DELETE FROM tasks WHERE goal_id = ?').run(id);
      this.db.prepare('DELETE FROM goals WHERE id = ?').run(id);
    } else {
      // Delete goal only, unlink tasks
      this.db.prepare('UPDATE tasks SET goal_id = NULL WHERE goal_id = ?').run(id);
      this.db.prepare('DELETE FROM goals WHERE id = ?').run(id);
    }

    return true;
  } catch (error) {
    console.error('Failed to delete goal:', error);
    throw error;
  }
};

DatabaseManager.prototype.removeGoalFromHabits = function (goalId) {
  if (!this.db) throw new Error('Database not initialized');

  try {
    const habits = this.getAllHabits();

    const stmt = this.db.prepare('UPDATE habits SET linked_goals = ?, updated_at = ? WHERE id = ?');

    for (const habit of habits) {
      if (habit.linkedGoals && habit.linkedGoals.includes(goalId)) {
        const updatedLinkedGoals = habit.linkedGoals.filter((id) => id !== goalId);
        stmt.run(JSON.stringify(updatedLinkedGoals), new Date().toISOString(), habit.id);
      }
    }
  } catch (error) {
    console.error('Failed to remove goal from habits:', error);
    throw error;
  }
};

DatabaseManager.prototype.getAllGoals = function () {
  if (!this.db) throw new Error('Database not initialized');

  try {
    const stmt = this.db.prepare('SELECT * FROM goals ORDER BY created_at DESC');
    const rows = stmt.all();
    return rows.map(this.mapGoalFromDb.bind(this));
  } catch (error) {
    console.error('Failed to get all goals:', error);
    throw error;
  }
};

DatabaseManager.prototype.getGoalById = function (id) {
  if (!this.db) throw new Error('Database not initialized');

  if (!id) {
    throw new Error('Goal ID is required');
  }

  try {
    const stmt = this.db.prepare('SELECT * FROM goals WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapGoalFromDb(row) : null;
  } catch (error) {
    console.error('Failed to get goal by id:', error);
    throw error;
  }
};

// ============================================================================
// HABIT OPERATIONS
// ============================================================================

DatabaseManager.prototype.createHabit = function (habit) {
  if (!this.db) throw new Error('Database not initialized');

  if (!habit || !habit.id || !habit.name) {
    throw new Error('Invalid habit data: id and name are required');
  }

  try {
    // Validate linked goals exist
    const validatedLinkedGoals = this.validateLinkedGoals(habit.linkedGoals || []);

    const stmt = this.db.prepare(`
      INSERT INTO habits (
        id, name, category, icon, color, target_amount, unit,
        frequency_type, frequency_value, priority, notes, linked_goals,
        start_date, reminder_enabled, reminder_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      habit.id,
      habit.name,
      habit.category,
      habit.icon,
      habit.color,
      habit.targetAmount || 1,
      habit.unit || 'times',
      habit.frequency.type,
      JSON.stringify(habit.frequency.value),
      habit.priority || 'medium',
      habit.notes || '',
      JSON.stringify(validatedLinkedGoals),
      habit.startDate,
      habit.reminder?.enabled ? 1 : 0,
      habit.reminder?.time || '09:00',
      habit.createdAt,
      habit.updatedAt
    );

    return this.getHabitById(habit.id);
  } catch (error) {
    console.error('Failed to create habit:', error);
    throw error;
  }
};

DatabaseManager.prototype.updateHabit = function (habit) {
  if (!this.db) throw new Error('Database not initialized');

  if (!habit || !habit.id) {
    throw new Error('Invalid habit data: id is required');
  }

  try {
    const existingHabit = this.getHabitById(habit.id);
    if (!existingHabit) {
      throw new Error(`Habit with id ${habit.id} not found`);
    }

    // Validate linked goals exist
    const validatedLinkedGoals = this.validateLinkedGoals(habit.linkedGoals || []);

    const stmt = this.db.prepare(`
      UPDATE habits SET
        name = ?, category = ?, icon = ?, color = ?, target_amount = ?,
        unit = ?, frequency_type = ?, frequency_value = ?, priority = ?,
        notes = ?, linked_goals = ?, start_date = ?, reminder_enabled = ?,
        reminder_time = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      habit.name,
      habit.category,
      habit.icon,
      habit.color,
      habit.targetAmount || 1,
      habit.unit || 'times',
      habit.frequency.type,
      JSON.stringify(habit.frequency.value),
      habit.priority || 'medium',
      habit.notes || '',
      JSON.stringify(validatedLinkedGoals),
      habit.startDate,
      habit.reminder?.enabled ? 1 : 0,
      habit.reminder?.time || '09:00',
      habit.updatedAt,
      habit.id
    );

    return this.getHabitById(habit.id);
  } catch (error) {
    console.error('Failed to update habit:', error);
    throw error;
  }
};

DatabaseManager.prototype.validateLinkedGoals = function (linkedGoals) {
  if (!linkedGoals || linkedGoals.length === 0) {
    return [];
  }

  const validGoals = [];
  for (const goalId of linkedGoals) {
    const goal = this.getGoalById(goalId);
    if (goal) {
      validGoals.push(goalId);
    } else {
      console.warn(`Goal with id ${goalId} not found, removing from linked goals`);
    }
  }

  return validGoals;
};

DatabaseManager.prototype.deleteHabit = function (id) {
  if (!this.db) throw new Error('Database not initialized');

  if (!id) {
    throw new Error('Habit ID is required');
  }

  try {
    const habit = this.getHabitById(id);
    if (!habit) {
      return false;
    }

    this.db.prepare('DELETE FROM habits WHERE id = ?').run(id);
    return true;
  } catch (error) {
    console.error('Failed to delete habit:', error);
    throw error;
  }
};

DatabaseManager.prototype.getAllHabits = function () {
  if (!this.db) throw new Error('Database not initialized');

  try {
    const stmt = this.db.prepare('SELECT * FROM habits ORDER BY created_at DESC');
    const rows = stmt.all();
    return rows.map(this.mapHabitFromDb.bind(this));
  } catch (error) {
    console.error('Failed to get all habits:', error);
    throw error;
  }
};

DatabaseManager.prototype.getHabitById = function (id) {
  if (!this.db) throw new Error('Database not initialized');

  if (!id) {
    throw new Error('Habit ID is required');
  }

  try {
    const stmt = this.db.prepare('SELECT * FROM habits WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapHabitFromDb(row) : null;
  } catch (error) {
    console.error('Failed to get habit by id:', error);
    throw error;
  }
};

// ============================================================================
// HABIT COMPLETION OPERATIONS
// ============================================================================

DatabaseManager.prototype.createHabitCompletion = function (completion) {
  if (!this.db) throw new Error('Database not initialized');

  if (!completion || !completion.id || !completion.habitId || !completion.date) {
    throw new Error('Invalid completion data: id, habitId, and date are required');
  }

  try {
    const stmt = this.db.prepare(`
      INSERT INTO habit_completions (
        id, habit_id, date, completed, actual_amount, target_amount,
        completed_at, note, mood, difficulty, skipped, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      completion.id,
      completion.habitId,
      completion.date,
      completion.completed ? 1 : 0,
      completion.actualAmount || 0,
      completion.targetAmount || 1,
      completion.completedAt || null,
      completion.note || '',
      completion.mood || null,
      completion.difficulty || null,
      completion.skipped ? 1 : 0,
      completion.createdAt,
      completion.updatedAt
    );

    return this.getHabitCompletionById(completion.id);
  } catch (error) {
    console.error('Failed to create habit completion:', error);
    throw error;
  }
};

DatabaseManager.prototype.updateHabitCompletion = function (completion) {
  if (!this.db) throw new Error('Database not initialized');

  if (!completion || !completion.id) {
    throw new Error('Invalid completion data: id is required');
  }

  try {
    const existingCompletion = this.getHabitCompletionById(completion.id);
    if (!existingCompletion) {
      throw new Error(`Habit completion with id ${completion.id} not found`);
    }

    const stmt = this.db.prepare(`
      UPDATE habit_completions SET
        completed = ?, actual_amount = ?, target_amount = ?, completed_at = ?,
        note = ?, mood = ?, difficulty = ?, skipped = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      completion.completed ? 1 : 0,
      completion.actualAmount || 0,
      completion.targetAmount || 1,
      completion.completedAt || null,
      completion.note || '',
      completion.mood || null,
      completion.difficulty || null,
      completion.skipped ? 1 : 0,
      completion.updatedAt,
      completion.id
    );

    return this.getHabitCompletionById(completion.id);
  } catch (error) {
    console.error('Failed to update habit completion:', error);
    throw error;
  }
};

DatabaseManager.prototype.deleteHabitCompletion = function (id) {
  if (!this.db) throw new Error('Database not initialized');

  if (!id) {
    throw new Error('Habit completion ID is required');
  }

  try {
    const completion = this.getHabitCompletionById(id);
    if (!completion) {
      return false;
    }

    this.db.prepare('DELETE FROM habit_completions WHERE id = ?').run(id);
    return true;
  } catch (error) {
    console.error('Failed to delete habit completion:', error);
    throw error;
  }
};

DatabaseManager.prototype.getHabitCompletions = function (habitId, startDate, endDate) {
  if (!this.db) throw new Error('Database not initialized');

  if (!habitId) {
    throw new Error('Habit ID is required');
  }

  try {
    let query = 'SELECT * FROM habit_completions WHERE habit_id = ?';
    const params = [habitId];

    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);
    return rows.map(this.mapHabitCompletionFromDb.bind(this));
  } catch (error) {
    console.error('Failed to get habit completions:', error);
    throw error;
  }
};

DatabaseManager.prototype.getHabitCompletionById = function (id) {
  if (!this.db) throw new Error('Database not initialized');

  if (!id) {
    throw new Error('Habit completion ID is required');
  }

  try {
    const stmt = this.db.prepare('SELECT * FROM habit_completions WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapHabitCompletionFromDb(row) : null;
  } catch (error) {
    console.error('Failed to get habit completion by id:', error);
    throw error;
  }
};

// ============================================================================
// TASK OPERATIONS
// ============================================================================

DatabaseManager.prototype.createTask = function (task) {
  if (!this.db) throw new Error('Database not initialized');

  if (!task || !task.id || !task.title) {
    throw new Error('Invalid task data: id and title are required');
  }

  try {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, title, done, goal_id, due_date, priority, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      task.id,
      task.title,
      task.done ? 1 : 0,
      task.goalId || null,
      task.dueDate || null,
      task.priority || 'medium',
      task.createdAt
    );

    return this.getTaskById(task.id);
  } catch (error) {
    console.error('Failed to create task:', error);
    throw error;
  }
};

DatabaseManager.prototype.updateTask = function (task) {
  if (!this.db) throw new Error('Database not initialized');

  if (!task || !task.id) {
    throw new Error('Invalid task data: id is required');
  }

  try {
    const existingTask = this.getTaskById(task.id);
    if (!existingTask) {
      throw new Error(`Task with id ${task.id} not found`);
    }

    const stmt = this.db.prepare(`
      UPDATE tasks SET title = ?, done = ?, goal_id = ?, due_date = ?, priority = ?
      WHERE id = ?
    `);

    stmt.run(task.title, task.done ? 1 : 0, task.goalId || null, task.dueDate || null, task.priority || 'medium', task.id);

    return this.getTaskById(task.id);
  } catch (error) {
    console.error('Failed to update task:', error);
    throw error;
  }
};

DatabaseManager.prototype.deleteTask = function (id) {
  if (!this.db) throw new Error('Database not initialized');

  if (!id) {
    throw new Error('Task ID is required');
  }

  try {
    const task = this.getTaskById(id);
    if (!task) {
      return false;
    }

    this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return true;
  } catch (error) {
    console.error('Failed to delete task:', error);
    throw error;
  }
};

DatabaseManager.prototype.getAllTasks = function () {
  if (!this.db) throw new Error('Database not initialized');

  try {
    const stmt = this.db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
    const rows = stmt.all();
    return rows.map(this.mapTaskFromDb.bind(this));
  } catch (error) {
    console.error('Failed to get all tasks:', error);
    throw error;
  }
};

DatabaseManager.prototype.getTaskById = function (id) {
  if (!this.db) throw new Error('Database not initialized');

  if (!id) {
    throw new Error('Task ID is required');
  }

  try {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapTaskFromDb(row) : null;
  } catch (error) {
    console.error('Failed to get task by id:', error);
    throw error;
  }
};

DatabaseManager.prototype.getTasksByGoalId = function (goalId) {
  if (!this.db) throw new Error('Database not initialized');

  try {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE goal_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(goalId);
    return rows.map(this.mapTaskFromDb.bind(this));
  } catch (error) {
    console.error('Failed to get tasks by goal id:', error);
    throw error;
  }
};

// ============================================================================
// UTILITY METHODS
// ============================================================================

DatabaseManager.prototype.close = function () {
  if (this.db) {
    try {
      this.db.close();
      this.db = null;
      console.log('Database closed successfully');
    } catch (error) {
      console.error('Error closing database:', error);
      throw error;
    }
  }
};

// ============================================================================
// MAPPING METHODS
// ============================================================================

DatabaseManager.prototype.mapGoalFromDb = function (row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    notes: row.notes || '',
    category: row.category,
    priority: row.priority,
    status: row.status,
    color: row.color,
    icon: row.icon,
    deadline: row.deadline || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

DatabaseManager.prototype.mapTaskFromDb = function (row) {
  return {
    id: row.id,
    title: row.title,
    done: Boolean(row.done),
    goalId: row.goal_id || null,
    dueDate: row.due_date || null,
    priority: row.priority || 'medium',
    createdAt: row.created_at
  };
};

DatabaseManager.prototype.mapHabitFromDb = function (row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    icon: row.icon,
    color: row.color,
    targetAmount: row.target_amount,
    unit: row.unit,
    frequency: {
      type: row.frequency_type,
      value: JSON.parse(row.frequency_value)
    },
    priority: row.priority,
    notes: row.notes,
    linkedGoals: JSON.parse(row.linked_goals),
    startDate: row.start_date,
    reminder: {
      enabled: Boolean(row.reminder_enabled),
      time: row.reminder_time
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

DatabaseManager.prototype.mapHabitCompletionFromDb = function (row) {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completed: Boolean(row.completed),
    actualAmount: row.actual_amount,
    targetAmount: row.target_amount,
    completedAt: row.completed_at,
    note: row.note,
    mood: row.mood,
    difficulty: row.difficulty,
    skipped: Boolean(row.skipped),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

module.exports = { DatabaseManager };
