use crate::database::AppState;
use rusqlite::{params, OptionalExtension, Row, Transaction};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Goal {
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DeleteStrategy {
    Cascade,
    Nullify,
}

impl Goal {
    /// Map a database row to a Goal struct
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Self {
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
    }
}

#[tauri::command]
pub async fn create_goal(
    state: tauri::State<'_, AppState>,
    goal: Goal,
) -> Result<Goal, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    db.execute(
        "INSERT INTO goals (
            id, title, description, notes, category, priority,
            status, color, icon, deadline, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            goal.id,
            goal.title,
            goal.description,
            goal.notes,
            goal.category,
            goal.priority,
            goal.status,
            goal.color,
            goal.icon,
            goal.deadline,
            goal.created_at,
            goal.updated_at,
        ],
    )
    .map_err(|e| format!("Failed to create goal: {}", e))?;

    Ok(goal)
}

#[tauri::command]
pub async fn update_goal(
    state: tauri::State<'_, AppState>,
    goal: Goal,
) -> Result<Goal, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let rows = db.execute(
        "UPDATE goals SET
            title = ?1, description = ?2, notes = ?3, category = ?4,
            priority = ?5, status = ?6, color = ?7, icon = ?8,
            deadline = ?9, updated_at = ?10
        WHERE id = ?11",
        params![
            goal.title,
            goal.description,
            goal.notes,
            goal.category,
            goal.priority,
            goal.status,
            goal.color,
            goal.icon,
            goal.deadline,
            goal.updated_at,
            goal.id,
        ],
    )
    .map_err(|e| format!("Failed to update goal: {}", e))?;

    if rows == 0 {
        return Err(format!("Goal with id '{}' not found", goal.id));
    }

    Ok(goal)
}

#[tauri::command]
pub async fn delete_goal(
    state: tauri::State<'_, AppState>,
    id: String,
    delete_strategy: Option<String>,
) -> Result<bool, String> {
    let mut db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    // Parse delete strategy
    let strategy = match delete_strategy.as_deref() {
        Some("cascade") => DeleteStrategy::Cascade,
        _ => DeleteStrategy::Nullify,
    };

    // Use transaction for atomic operations
    let tx = db.transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // Remove goal from habits' linked_goals
    update_habit_linked_goals_tx(&tx, &id)?;

    // Handle associated tasks based on strategy
    match strategy {
        DeleteStrategy::Cascade => {
            tx.execute("DELETE FROM tasks WHERE goal_id = ?1", params![id])
                .map_err(|e| format!("Failed to delete associated tasks: {}", e))?;
        }
        DeleteStrategy::Nullify => {
            tx.execute("UPDATE tasks SET goal_id = NULL WHERE goal_id = ?1", params![id])
                .map_err(|e| format!("Failed to nullify task goal references: {}", e))?;
        }
    }

    // Delete the goal
    let rows_affected = tx
        .execute("DELETE FROM goals WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete goal: {}", e))?;

    tx.commit()
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(rows_affected > 0)
}

/// Remove a goal ID from all habits' linked_goals arrays (within transaction)
fn update_habit_linked_goals_tx(
    tx: &Transaction,
    goal_id: &str,
) -> Result<(), String> {
    let mut stmt = tx
        .prepare("SELECT id, linked_goals FROM habits")
        .map_err(|e| format!("Failed to query habits: {}", e))?;

    let habits: Vec<(String, String)> = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| format!("Failed to map habit rows: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect habits: {}", e))?;

    drop(stmt); // Drop the statement before executing updates

    for (habit_id, linked_goals_str) in habits {
        if let Ok(mut linked_goals) = serde_json::from_str::<Vec<String>>(&linked_goals_str) {
            if linked_goals.contains(&goal_id.to_string()) {
                linked_goals.retain(|g| g != goal_id);
                let updated_json = serde_json::to_string(&linked_goals)
                    .map_err(|e| format!("Failed to serialize linked goals: {}", e))?;

                tx.execute(
                    "UPDATE habits SET linked_goals = ?1 WHERE id = ?2",
                    params![updated_json, habit_id],
                )
                .map_err(|e| format!("Failed to update habit linked goals: {}", e))?;
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn get_all_goals(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Goal>, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let mut stmt = db
        .prepare("SELECT * FROM goals ORDER BY created_at DESC")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let goals = stmt
        .query_map([], Goal::from_row)
        .map_err(|e| format!("Failed to query goals: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect goals: {}", e))?;

    Ok(goals)
}

#[tauri::command]
pub async fn get_goal_by_id(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<Option<Goal>, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let goal = db
        .query_row(
            "SELECT * FROM goals WHERE id = ?1",
            params![id],
            Goal::from_row,
        )
        .optional()
        .map_err(|e| format!("Failed to query goal: {}", e))?;

    Ok(goal)
}

#[tauri::command]
pub async fn get_goals_by_status(
    state: tauri::State<'_, AppState>,
    status: String,
) -> Result<Vec<Goal>, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let mut stmt = db
        .prepare("SELECT * FROM goals WHERE status = ?1 ORDER BY created_at DESC")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let goals = stmt
        .query_map(params![status], Goal::from_row)
        .map_err(|e| format!("Failed to query goals: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect goals: {}", e))?;

    Ok(goals)
}