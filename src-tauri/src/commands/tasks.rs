use crate::database::AppState;
use rusqlite::{params, OptionalExtension, Row};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub title: String,
    pub done: bool,
    pub goal_id: Option<String>,
    pub parent_task_id: Option<String>,
    pub due_date: Option<String>,
    pub priority: String,
    pub created_at: String,
    pub updated_at: String,
}

impl Task {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get(0)?,
            title: row.get(1)?,
            done: row.get::<_, i32>(2)? != 0,
            goal_id: row.get(3)?,
            parent_task_id: row.get(4)?,
            due_date: row.get(5)?,
            priority: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    }
}

#[tauri::command]
pub async fn create_task(
    state: tauri::State<'_, AppState>,
    task: Task,
) -> Result<Task, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    db.execute(
        "INSERT INTO tasks (id, title, done, goal_id, parent_task_id, due_date, priority, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            task.id,
            task.title,
            task.done as i32,
            task.goal_id,
            task.parent_task_id,
            task.due_date,
            task.priority,
            task.created_at,
            task.updated_at,
        ],
    )
    .map_err(|e| format!("Failed to create task: {}", e))?;

    Ok(task)
}

#[tauri::command]
pub async fn update_task(
    state: tauri::State<'_, AppState>,
    task: Task,
) -> Result<Task, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let rows = db.execute(
        "UPDATE tasks SET
            title = ?1, done = ?2, goal_id = ?3, parent_task_id = ?4,
            due_date = ?5, priority = ?6, updated_at = ?7
         WHERE id = ?8",
        params![
            task.title,
            task.done as i32,
            task.goal_id,
            task.parent_task_id,
            task.due_date,
            task.priority,
            task.updated_at,
            task.id,
        ],
    )
    .map_err(|e| format!("Failed to update task: {}", e))?;

    if rows == 0 {
        return Err(format!("Task with id '{}' not found", task.id));
    }

    Ok(task)
}

#[tauri::command]
pub async fn delete_task(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<bool, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let rows_affected = db
        .execute("DELETE FROM tasks WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete task: {}", e))?;

    Ok(rows_affected > 0)
}

#[tauri::command]
pub async fn get_all_tasks(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Task>, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let mut stmt = db
        .prepare("SELECT * FROM tasks ORDER BY created_at DESC")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let tasks = stmt
        .query_map([], Task::from_row)
        .map_err(|e| format!("Failed to query tasks: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect tasks: {}", e))?;

    Ok(tasks)
}

#[tauri::command]
pub async fn get_task_by_id(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<Option<Task>, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let task = db
        .query_row(
            "SELECT * FROM tasks WHERE id = ?1",
            params![id],
            Task::from_row,
        )
        .optional()
        .map_err(|e| format!("Failed to query task: {}", e))?;

    Ok(task)
}

#[tauri::command]
pub async fn get_tasks_by_goal_id(
    state: tauri::State<'_, AppState>,
    goal_id: String,
) -> Result<Vec<Task>, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let mut stmt = db
        .prepare("SELECT * FROM tasks WHERE goal_id = ?1 ORDER BY created_at DESC")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let tasks = stmt
        .query_map(params![goal_id], Task::from_row)
        .map_err(|e| format!("Failed to query tasks: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect tasks: {}", e))?;

    Ok(tasks)
}

#[tauri::command]
pub async fn get_tasks_by_status(
    state: tauri::State<'_, AppState>,
    done: bool,
) -> Result<Vec<Task>, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let mut stmt = db
        .prepare("SELECT * FROM tasks WHERE done = ?1 ORDER BY created_at DESC")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let tasks = stmt
        .query_map(params![done as i32], Task::from_row)
        .map_err(|e| format!("Failed to query tasks: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect tasks: {}", e))?;

    Ok(tasks)
}

#[tauri::command]
pub async fn get_subtasks(
    state: tauri::State<'_, AppState>,
    parent_task_id: String,
) -> Result<Vec<Task>, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let mut stmt = db
        .prepare("SELECT * FROM tasks WHERE parent_task_id = ?1 ORDER BY created_at ASC")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let tasks = stmt
        .query_map(params![parent_task_id], Task::from_row)
        .map_err(|e| format!("Failed to query subtasks: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect subtasks: {}", e))?;

    Ok(tasks)
}

#[tauri::command]
pub async fn toggle_task_status(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<bool, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let rows = db.execute(
        "UPDATE tasks SET done = NOT done, updated_at = datetime('now') WHERE id = ?1",
        params![id],
    )
    .map_err(|e| format!("Failed to toggle task status: {}", e))?;

    if rows == 0 {
        return Err(format!("Task with id '{}' not found", id));
    }

    let new_status = db
        .query_row(
            "SELECT done FROM tasks WHERE id = ?1",
            params![id],
            |row| row.get::<_, i32>(0),
        )
        .map_err(|e| format!("Failed to get task status: {}", e))?;

    Ok(new_status != 0)
}