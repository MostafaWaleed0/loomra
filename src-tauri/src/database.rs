use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::{Connection, Result as SqlResult};
use tauri::{AppHandle, Manager};

/// Application state holding the database connection pool
pub struct AppState {
    pub db: Pool<SqliteConnectionManager>,
}

/// Custom error type for database operations
#[derive(Debug, thiserror::Error)]
pub enum DatabaseError {
    #[error("SQLite error: {0}")]
    Sqlite(#[from] rusqlite::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Path error: {0}")]
    Path(String),

    #[error("Pool error: {0}")]
    Pool(String),
}

impl From<DatabaseError> for String {
    fn from(err: DatabaseError) -> Self {
        err.to_string()
    }
}

/// Initialize the database with proper error handling and connection pooling
pub fn init_database(app_handle: &AppHandle) -> Result<(), DatabaseError> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| DatabaseError::Path(e.to_string()))?;

    std::fs::create_dir_all(&app_dir)?;

    let db_path = app_dir.join("loomra.db");

    // Create connection pool
    let manager = SqliteConnectionManager::file(&db_path);
    let pool = Pool::builder()
        .max_size(10)
        .connection_timeout(std::time::Duration::from_secs(30))
        .build(manager)
        .map_err(|e| DatabaseError::Pool(e.to_string()))?;

    // Configure first connection and set up schema
    {
        let conn = pool.get().map_err(|e| DatabaseError::Pool(e.to_string()))?;
        configure_connection(&conn)?;
        create_schema(&conn)?;
    }

    // Store connection pool in app state
    app_handle.manage(AppState { db: pool });

    Ok(())
}

/// Configure SQLite connection with optimal settings
fn configure_connection(conn: &Connection) -> SqlResult<()> {
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    conn.pragma_update(None, "synchronous", "NORMAL")?;
    conn.pragma_update(None, "cache_size", -64000)?; // 64MB cache
    conn.pragma_update(None, "temp_store", "MEMORY")?;
    conn.pragma_update(None, "mmap_size", 268435456i64)?; // 256MB memory-mapped I/O
    conn.pragma_update(None, "page_size", 4096)?;
    Ok(())
}

/// Create all database tables and indexes
fn create_schema(conn: &Connection) -> SqlResult<()> {
    create_tables(conn)?;
    create_indexes(conn)?;
    Ok(())
}

/// Create all application tables
fn create_tables(conn: &Connection) -> SqlResult<()> {
    // Goals table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS goals (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL,
            priority TEXT NOT NULL,
            status TEXT NOT NULL,
            color TEXT NOT NULL,
            icon TEXT NOT NULL,
            deadline TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // Tasks table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            done INTEGER NOT NULL DEFAULT 0,
            goal_id TEXT,
            parent_task_id TEXT,
            due_date TEXT,
            priority TEXT NOT NULL DEFAULT 'medium',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
            FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Habits table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            icon TEXT NOT NULL,
            color TEXT NOT NULL,
            target_amount REAL NOT NULL DEFAULT 1.0,
            unit TEXT NOT NULL DEFAULT 'times',
            frequency_type TEXT NOT NULL,
            frequency_value TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'medium',
            notes TEXT NOT NULL DEFAULT '',
            linked_goals TEXT NOT NULL DEFAULT '[]',
            start_date TEXT NOT NULL,
            reminder_enabled INTEGER NOT NULL DEFAULT 0,
            reminder_time TEXT NOT NULL DEFAULT '09:00',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // Habit completions table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS habit_completions (
            id TEXT PRIMARY KEY,
            habit_id TEXT NOT NULL,
            date TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            actual_amount REAL NOT NULL DEFAULT 0.0,
            target_amount REAL NOT NULL DEFAULT 1.0,
            completed_at TEXT,
            note TEXT NOT NULL DEFAULT '',
            mood TEXT,
            difficulty TEXT,
            skipped INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
            UNIQUE(habit_id, date)
        )",
        [],
    )?;

    // Settings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
        [],
    )?;

    Ok(())
}

/// Create all database indexes for optimal query performance
fn create_indexes(conn: &Connection) -> SqlResult<()> {
    let indexes = [
        // Task indexes
        "CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id)",
        "CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)",
        "CREATE INDEX IF NOT EXISTS idx_tasks_done ON tasks(done)",
        "CREATE INDEX IF NOT EXISTS idx_tasks_goal_done ON tasks(goal_id, done, due_date)",
        "CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id)",
        "CREATE INDEX IF NOT EXISTS idx_tasks_parent_done ON tasks(parent_task_id, done)",

        // Goal indexes
        "CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status)",
        "CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category)",
        "CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline)",
        "CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority)",
        "CREATE INDEX IF NOT EXISTS idx_goals_status_priority ON goals(status, priority, deadline)",

        // Habit indexes
        "CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(category)",
        "CREATE INDEX IF NOT EXISTS idx_habits_start_date ON habits(start_date)",

        // Habit completion indexes
        "CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id)",
        "CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(date)",
        "CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions(habit_id, date)",
        "CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_completed ON habit_completions(habit_id, completed, date DESC)",
        "CREATE INDEX IF NOT EXISTS idx_habit_completions_streak ON habit_completions(habit_id, date DESC, completed)",
    ];

    for index_sql in indexes {
        conn.execute(index_sql, [])?;
    }

    Ok(())
}