use serde::{Deserialize, Serialize};
use tauri::State;
use crate::database::AppState;

// ============================================================================
// SETTINGS STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceSettings {
    pub theme: String,
    pub week_starts_on: String,
    pub timezone: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HabitSettings {
    pub default_reminder: bool,
    pub default_reminder_time: String,
    pub default_priority: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoalSettings {
    pub deadline_warning_days: u32,
    pub default_category: String,
    pub show_progress_percentage: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationSettings {
    pub habit_reminders: bool,
    pub goal_deadlines: bool,
    pub streak_milestones: bool,
    pub daily_summary: bool,
    pub weekly_summary: bool,
    pub motivational_quotes: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataSettings {
    pub auto_backup: bool,
    pub backup_frequency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub appearance: AppearanceSettings,
    pub habits: HabitSettings,
    pub goals: GoalSettings,
    pub notifications: NotificationSettings,
    pub data: DataSettings,
}

// ============================================================================
// EXPORT/IMPORT DATA STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportData {
    pub settings: AppSettings,
    pub goals: Vec<GoalData>,
    pub tasks: Vec<TaskData>,
    pub habits: Vec<HabitData>,
    pub habit_completions: Vec<HabitCompletionData>,
    pub export_metadata: ExportMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoalData {
    pub id: String,
    pub title: String,
    pub description: String,
    pub notes: String,
    pub category: String,
    pub priority: String,
    pub status: String,
    pub color: String,
    pub icon: String,
    pub deadline: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskData {
    pub id: String,
    pub title: String,
    pub done: bool,
    pub goal_id: Option<String>,
    pub due_date: Option<String>,
    pub priority: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HabitData {
    pub id: String,
    pub name: String,
    pub category: String,
    pub icon: String,
    pub color: String,
    pub target_amount: f64,
    pub unit: String,
    pub frequency_type: String,
    pub frequency_value: String,
    pub priority: String,
    pub notes: String,
    pub linked_goals: String,
    pub start_date: String,
    pub reminder_enabled: bool,
    pub reminder_time: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HabitCompletionData {
    pub id: String,
    pub habit_id: String,
    pub date: String,
    pub completed: bool,
    pub actual_amount: f64,
    pub target_amount: f64,
    pub completed_at: Option<String>,
    pub note: String,
    pub mood: Option<String>,
    pub difficulty: Option<String>,
    pub skipped: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportMetadata {
    pub export_date: String,
    pub version: String,
    pub total_records: usize,
}

// ============================================================================
// DATABASE HELPER FUNCTIONS
// ============================================================================

fn save_settings_to_db_impl(conn: &rusqlite::Connection, settings: &AppSettings) -> Result<(), String> {
    let json_data = serde_json::to_string(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    conn.execute(
        "INSERT INTO settings (id, data, updated_at)
         VALUES (1, ?1, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
            data = excluded.data,
            updated_at = datetime('now')",
        rusqlite::params![json_data],
    )
    .map_err(|e| format!("Failed to save settings: {}", e))?;

    Ok(())
}

fn load_settings_from_db(state: &State<AppState>) -> Result<Option<AppSettings>, String> {
    let conn = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let mut stmt = conn.prepare("SELECT data FROM settings WHERE id = 1")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let result = stmt.query_row([], |row| {
        let json_data: String = row.get(0)?;
        Ok(json_data)
    });

    match result {
        Ok(json_data) => {
            let settings: AppSettings = serde_json::from_str(&json_data)
                .map_err(|e| format!("Failed to deserialize settings: {}", e))?;
            Ok(Some(settings))
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Database error: {}", e)),
    }
}

// ============================================================================
// DATA EXPORT FUNCTIONS
// ============================================================================

fn export_goals_data(conn: &rusqlite::Connection) -> Result<Vec<GoalData>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, title, description, notes, category, priority, status, color, icon, deadline, created_at, updated_at
         FROM goals"
    )
    .map_err(|e| format!("Failed to prepare goals statement: {}", e))?;

    let goal_iter = stmt.query_map([], |row| {
        Ok(GoalData {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            notes: row.get(3)?,
            category: row.get(4)?,
            priority: row.get(5)?,
            status: row.get(6)?,
            color: row.get(7)?,
            icon: row.get(8)?,
            deadline: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })
    .map_err(|e| format!("Failed to query goals: {}", e))?;

    goal_iter.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect goals: {}", e))
}

fn export_tasks_data(conn: &rusqlite::Connection) -> Result<Vec<TaskData>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, title, done, goal_id, due_date, priority, created_at FROM tasks"
    )
    .map_err(|e| format!("Failed to prepare tasks statement: {}", e))?;

    let task_iter = stmt.query_map([], |row| {
        Ok(TaskData {
            id: row.get(0)?,
            title: row.get(1)?,
            done: row.get::<_, i64>(2)? != 0,
            goal_id: row.get(3)?,
            due_date: row.get(4)?,
            priority: row.get(5)?,
            created_at: row.get(6)?,
        })
    })
    .map_err(|e| format!("Failed to query tasks: {}", e))?;

    task_iter.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect tasks: {}", e))
}

fn export_habits_data(conn: &rusqlite::Connection) -> Result<Vec<HabitData>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, name, category, icon, color, target_amount, unit, frequency_type, frequency_value,
                priority, notes, linked_goals, start_date, reminder_enabled, reminder_time, created_at, updated_at
         FROM habits"
    )
    .map_err(|e| format!("Failed to prepare habits statement: {}", e))?;

    let habit_iter = stmt.query_map([], |row| {
        Ok(HabitData {
            id: row.get(0)?,
            name: row.get(1)?,
            category: row.get(2)?,
            icon: row.get(3)?,
            color: row.get(4)?,
            target_amount: row.get(5)?,
            unit: row.get(6)?,
            frequency_type: row.get(7)?,
            frequency_value: row.get(8)?,
            priority: row.get(9)?,
            notes: row.get(10)?,
            linked_goals: row.get(11)?,
            start_date: row.get(12)?,
            reminder_enabled: row.get::<_, i64>(13)? != 0,
            reminder_time: row.get(14)?,
            created_at: row.get(15)?,
            updated_at: row.get(16)?,
        })
    })
    .map_err(|e| format!("Failed to query habits: {}", e))?;

    habit_iter.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect habits: {}", e))
}

fn export_habit_completions_data(conn: &rusqlite::Connection) -> Result<Vec<HabitCompletionData>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, habit_id, date, completed, actual_amount, target_amount, completed_at, note,
                mood, difficulty, skipped, created_at, updated_at
         FROM habit_completions"
    )
    .map_err(|e| format!("Failed to prepare habit completions statement: {}", e))?;

    let completion_iter = stmt.query_map([], |row| {
        Ok(HabitCompletionData {
            id: row.get(0)?,
            habit_id: row.get(1)?,
            date: row.get(2)?,
            completed: row.get::<_, i64>(3)? != 0,
            actual_amount: row.get(4)?,
            target_amount: row.get(5)?,
            completed_at: row.get(6)?,
            note: row.get(7)?,
            mood: row.get(8)?,
            difficulty: row.get(9)?,
            skipped: row.get::<_, i64>(10)? != 0,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    })
    .map_err(|e| format!("Failed to query habit completions: {}", e))?;

    completion_iter.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect habit completions: {}", e))
}

// ============================================================================
// DATA IMPORT FUNCTIONS
// ============================================================================

fn import_goals_data(conn: &rusqlite::Transaction, goals: &[GoalData]) -> Result<(), String> {
    // Clear existing data (tasks first due to foreign key)
    conn.execute("DELETE FROM tasks", [])
        .map_err(|e| format!("Failed to clear tasks: {}", e))?;
    conn.execute("DELETE FROM goals", [])
        .map_err(|e| format!("Failed to clear goals: {}", e))?;

    let mut stmt = conn.prepare(
        "INSERT INTO goals (id, title, description, notes, category, priority, status, color, icon, deadline, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)"
    )
    .map_err(|e| format!("Failed to prepare goals insert statement: {}", e))?;

    for goal in goals {
        stmt.execute(rusqlite::params![
            goal.id, goal.title, goal.description, goal.notes, goal.category, goal.priority,
            goal.status, goal.color, goal.icon, goal.deadline, goal.created_at, goal.updated_at
        ])
        .map_err(|e| format!("Failed to insert goal {}: {}", goal.id, e))?;
    }

    Ok(())
}

fn import_tasks_data(conn: &rusqlite::Transaction, tasks: &[TaskData]) -> Result<(), String> {
    let mut stmt = conn.prepare(
        "INSERT INTO tasks (id, title, done, goal_id, due_date, priority, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
    )
    .map_err(|e| format!("Failed to prepare tasks insert statement: {}", e))?;

    for task in tasks {
        stmt.execute(rusqlite::params![
            task.id, task.title, task.done as i64, task.goal_id, task.due_date,
            task.priority, task.created_at
        ])
        .map_err(|e| format!("Failed to insert task {}: {}", task.id, e))?;
    }

    Ok(())
}

fn import_habits_data(conn: &rusqlite::Transaction, habits: &[HabitData]) -> Result<(), String> {
    // Clear existing data (completions first due to foreign key)
    conn.execute("DELETE FROM habit_completions", [])
        .map_err(|e| format!("Failed to clear habit completions: {}", e))?;
    conn.execute("DELETE FROM habits", [])
        .map_err(|e| format!("Failed to clear habits: {}", e))?;

    let mut stmt = conn.prepare(
        "INSERT INTO habits (id, name, category, icon, color, target_amount, unit, frequency_type, frequency_value,
                            priority, notes, linked_goals, start_date, reminder_enabled, reminder_time, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)"
    )
    .map_err(|e| format!("Failed to prepare habits insert statement: {}", e))?;

    for habit in habits {
        stmt.execute(rusqlite::params![
            habit.id, habit.name, habit.category, habit.icon, habit.color, habit.target_amount,
            habit.unit, habit.frequency_type, habit.frequency_value, habit.priority, habit.notes,
            habit.linked_goals, habit.start_date, habit.reminder_enabled as i64, habit.reminder_time,
            habit.created_at, habit.updated_at
        ])
        .map_err(|e| format!("Failed to insert habit {}: {}", habit.id, e))?;
    }

    Ok(())
}

fn import_habit_completions_data(conn: &rusqlite::Transaction, completions: &[HabitCompletionData]) -> Result<(), String> {
    let mut stmt = conn.prepare(
        "INSERT INTO habit_completions (id, habit_id, date, completed, actual_amount, target_amount, completed_at,
                                      note, mood, difficulty, skipped, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)"
    )
    .map_err(|e| format!("Failed to prepare habit completions insert statement: {}", e))?;

    for completion in completions {
        stmt.execute(rusqlite::params![
            completion.id, completion.habit_id, completion.date, completion.completed as i64,
            completion.actual_amount, completion.target_amount, completion.completed_at,
            completion.note, completion.mood, completion.difficulty, completion.skipped as i64,
            completion.created_at, completion.updated_at
        ])
        .map_err(|e| format!("Failed to insert habit completion {}: {}", completion.id, e))?;
    }

    Ok(())
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

/// Get current settings. Returns None if no settings exist (first run).
#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<Option<AppSettings>, String> {
    load_settings_from_db(&state)
}

/// Save complete settings object
#[tauri::command]
pub async fn save_settings(
    settings: AppSettings,
    state: State<'_, AppState>,
) -> Result<AppSettings, String> {
    let conn = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    save_settings_to_db_impl(&conn, &settings)?;
    Ok(settings)
}

/// Update only appearance settings
#[tauri::command]
pub async fn update_appearance_settings(
    appearance: AppearanceSettings,
    state: State<'_, AppState>,
) -> Result<AppSettings, String> {
    let mut settings = load_settings_from_db(&state)?
        .ok_or_else(|| "Settings not initialized".to_string())?;

    settings.appearance = appearance;

    let conn = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    save_settings_to_db_impl(&conn, &settings)?;
    Ok(settings)
}

/// Update only habit settings
#[tauri::command]
pub async fn update_habit_settings(
    habits: HabitSettings,
    state: State<'_, AppState>,
) -> Result<AppSettings, String> {
    let mut settings = load_settings_from_db(&state)?
        .ok_or_else(|| "Settings not initialized".to_string())?;

    settings.habits = habits;

    let conn = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    save_settings_to_db_impl(&conn, &settings)?;
    Ok(settings)
}

/// Update only goal settings
#[tauri::command]
pub async fn update_goal_settings(
    goals: GoalSettings,
    state: State<'_, AppState>,
) -> Result<AppSettings, String> {
    let mut settings = load_settings_from_db(&state)?
        .ok_or_else(|| "Settings not initialized".to_string())?;

    settings.goals = goals;

    let conn = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    save_settings_to_db_impl(&conn, &settings)?;
    Ok(settings)
}

/// Update only notification settings
#[tauri::command]
pub async fn update_notification_settings(
    notifications: NotificationSettings,
    state: State<'_, AppState>,
) -> Result<AppSettings, String> {
    let mut settings = load_settings_from_db(&state)?
        .ok_or_else(|| "Settings not initialized".to_string())?;

    settings.notifications = notifications;

    let conn = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    save_settings_to_db_impl(&conn, &settings)?;
    Ok(settings)
}

/// Update only data settings
#[tauri::command]
pub async fn update_data_settings(
    data: DataSettings,
    state: State<'_, AppState>,
) -> Result<AppSettings, String> {
    let mut settings = load_settings_from_db(&state)?
        .ok_or_else(|| "Settings not initialized".to_string())?;

    settings.data = data;

    let conn = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    save_settings_to_db_impl(&conn, &settings)?;
    Ok(settings)
}

/// Reset settings - requires frontend to provide default settings
#[tauri::command]
pub async fn reset_settings(
    default_settings: AppSettings,
    state: State<'_, AppState>,
) -> Result<AppSettings, String> {
    let conn = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    save_settings_to_db_impl(&conn, &default_settings)?;
    Ok(default_settings)
}

// ============================================================================
// EXPORT/IMPORT COMMANDS
// ============================================================================

/// Export all app data (settings + database)
#[tauri::command]
pub async fn export_all_data(state: State<'_, AppState>) -> Result<String, String> {
    let conn = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // Get settings - return error if not initialized
    let settings = load_settings_from_db(&state)?
        .ok_or_else(|| "Settings not initialized".to_string())?;

    // Get all data from database
    let goals = export_goals_data(&conn)?;
    let tasks = export_tasks_data(&conn)?;
    let habits = export_habits_data(&conn)?;
    let habit_completions = export_habit_completions_data(&conn)?;

    let total_records = goals.len() + tasks.len() + habits.len() + habit_completions.len();

    let export_data = ExportData {
        settings,
        goals,
        tasks,
        habits,
        habit_completions,
        export_metadata: ExportMetadata {
            export_date: chrono::Utc::now().to_rfc3339(),
            version: "1.0.0".to_string(),
            total_records,
        },
    };

    serde_json::to_string_pretty(&export_data)
        .map_err(|e| format!("Failed to serialize export data: {}", e))
}

/// Import all app data (settings + database)
#[tauri::command]
pub async fn import_all_data(
    json_data: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let mut conn = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // Parse the import data
    let import_data: ExportData = serde_json::from_str(&json_data)
        .map_err(|e| format!("Failed to parse import data: {}", e))?;

    // Use a single transaction for atomicity
    let tx = conn.transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // Import all data within the transaction - if any fails, transaction is automatically rolled back on drop
    if let Err(e) = import_goals_data(&tx, &import_data.goals) {
        return Err(e);
    }

    if let Err(e) = import_tasks_data(&tx, &import_data.tasks) {
        return Err(e);
    }

    if let Err(e) = import_habits_data(&tx, &import_data.habits) {
        return Err(e);
    }

    if let Err(e) = import_habit_completions_data(&tx, &import_data.habit_completions) {
        return Err(e);
    }

    // Save settings within the transaction
    if let Err(e) = save_settings_to_db_impl(&tx, &import_data.settings) {
        return Err(e);
    }

    // Commit everything - if this fails, transaction is rolled back
    tx.commit()
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(format!(
        "Successfully imported {} goals, {} tasks, {} habits, and {} habit completions",
        import_data.goals.len(),
        import_data.tasks.len(),
        import_data.habits.len(),
        import_data.habit_completions.len()
    ))
}

// ============================================================================
// LEGACY COMMANDS (for backward compatibility)
// ============================================================================

/// Export settings only
#[tauri::command]
pub async fn export_settings(state: State<'_, AppState>) -> Result<String, String> {
    let settings = load_settings_from_db(&state)?
        .ok_or_else(|| "Settings not initialized".to_string())?;

    serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))
}

/// Import settings only
#[tauri::command]
pub async fn import_settings(
    json_data: String,
    state: State<'_, AppState>,
) -> Result<AppSettings, String> {
    let imported_settings: AppSettings = serde_json::from_str(&json_data)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;

    let conn = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    save_settings_to_db_impl(&conn, &imported_settings)?;
    Ok(imported_settings)
}