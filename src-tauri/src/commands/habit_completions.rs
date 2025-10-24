use crate::database::AppState;
use rusqlite::{params, OptionalExtension, Row};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HabitCompletion {
    pub id: String,
    pub habit_id: String,
    pub date: String,
    pub completed: bool,
    pub actual_amount: f64,
    pub target_amount: f64,
    pub completed_at: Option<String>,
    pub note: String,
    pub mood: Option<i32>,
    pub difficulty: Option<i32>,
    pub skipped: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl HabitCompletion {
    /// Map a database row to a HabitCompletion struct
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get(0)?,
            habit_id: row.get(1)?,
            date: row.get(2)?,
            completed: row.get::<_, i32>(3)? != 0,
            actual_amount: row.get(4)?,
            target_amount: row.get(5)?,
            completed_at: row.get(6)?,
            note: row.get(7)?,
            mood: row.get(8)?,
            difficulty: row.get(9)?,
            skipped: row.get::<_, i32>(10)? != 0,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    }
}

#[tauri::command]
pub async fn create_habit_completion(
    state: tauri::State<'_, AppState>,
    completion: HabitCompletion,
) -> Result<HabitCompletion, String> {
    let db = state.db.lock().await;

    db.execute(
        "INSERT INTO habit_completions (
            id, habit_id, date, completed, actual_amount,
            target_amount, completed_at, note, mood, difficulty,
            skipped, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
        ON CONFLICT(habit_id, date) DO UPDATE SET
            completed = excluded.completed,
            actual_amount = excluded.actual_amount,
            target_amount = excluded.target_amount,
            completed_at = excluded.completed_at,
            note = excluded.note,
            mood = excluded.mood,
            difficulty = excluded.difficulty,
            skipped = excluded.skipped,
            updated_at = excluded.updated_at",
        params![
            completion.id,
            completion.habit_id,
            completion.date,
            completion.completed as i32,
            completion.actual_amount,
            completion.target_amount,
            completion.completed_at,
            completion.note,
            completion.mood,
            completion.difficulty,
            completion.skipped as i32,
            completion.created_at,
            completion.updated_at,
        ],
    )
    .map_err(|e| format!("Failed to create habit completion: {}", e))?;

    Ok(completion)
}

#[tauri::command]
pub async fn update_habit_completion(
    state: tauri::State<'_, AppState>,
    completion: HabitCompletion,
) -> Result<HabitCompletion, String> {
    let db = state.db.lock().await;

    let rows = db.execute(
        "UPDATE habit_completions SET
            completed = ?1, actual_amount = ?2, target_amount = ?3,
            completed_at = ?4, note = ?5, mood = ?6, difficulty = ?7,
            skipped = ?8, updated_at = ?9
        WHERE id = ?10",
        params![
            completion.completed as i32,
            completion.actual_amount,
            completion.target_amount,
            completion.completed_at,
            completion.note,
            completion.mood,
            completion.difficulty,
            completion.skipped as i32,
            completion.updated_at,
            completion.id,
        ],
    )
    .map_err(|e| format!("Failed to update habit completion: {}", e))?;

    if rows == 0 {
        return Err(format!("Habit completion with id '{}' not found", completion.id));
    }

    Ok(completion)
}

#[tauri::command]
pub async fn delete_habit_completion(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<bool, String> {
    let db = state.db.lock().await;

    let rows_affected = db
        .execute("DELETE FROM habit_completions WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete habit completion: {}", e))?;

    Ok(rows_affected > 0)
}

#[tauri::command]
pub async fn get_habit_completions(
    state: tauri::State<'_, AppState>,
    habit_id: String,
    start_date: Option<String>,
    end_date: Option<String>,
) -> Result<Vec<HabitCompletion>, String> {
    let db = state.db.lock().await;

    match (&start_date, &end_date) {
        (Some(start), Some(end)) => {
            let mut stmt = db
                .prepare("SELECT * FROM habit_completions WHERE habit_id = ?1 AND date BETWEEN ?2 AND ?3 ORDER BY date DESC")
                .map_err(|e| format!("Failed to prepare statement: {}", e))?;

            let completions: Vec<HabitCompletion> = stmt
                .query_map(params![&habit_id, start, end], HabitCompletion::from_row)
                .map_err(|e| format!("Failed to query habit completions: {}", e))?
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| format!("Failed to collect habit completions: {}", e))?;

            Ok(completions)
        }
        (Some(start), None) => {
            let mut stmt = db
                .prepare("SELECT * FROM habit_completions WHERE habit_id = ?1 AND date >= ?2 ORDER BY date DESC")
                .map_err(|e| format!("Failed to prepare statement: {}", e))?;

            let completions: Vec<HabitCompletion> = stmt
                .query_map(params![&habit_id, start], HabitCompletion::from_row)
                .map_err(|e| format!("Failed to query habit completions: {}", e))?
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| format!("Failed to collect habit completions: {}", e))?;

            Ok(completions)
        }
        (None, Some(end)) => {
            let mut stmt = db
                .prepare("SELECT * FROM habit_completions WHERE habit_id = ?1 AND date <= ?2 ORDER BY date DESC")
                .map_err(|e| format!("Failed to prepare statement: {}", e))?;

            let completions: Vec<HabitCompletion> = stmt
                .query_map(params![&habit_id, end], HabitCompletion::from_row)
                .map_err(|e| format!("Failed to query habit completions: {}", e))?
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| format!("Failed to collect habit completions: {}", e))?;

            Ok(completions)
        }
        (None, None) => {
            let mut stmt = db
                .prepare("SELECT * FROM habit_completions WHERE habit_id = ?1 ORDER BY date DESC")
                .map_err(|e| format!("Failed to prepare statement: {}", e))?;

            let completions: Vec<HabitCompletion> = stmt
                .query_map(params![&habit_id], HabitCompletion::from_row)
                .map_err(|e| format!("Failed to query habit completions: {}", e))?
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| format!("Failed to collect habit completions: {}", e))?;

            Ok(completions)
        }
    }
}

#[tauri::command]
pub async fn get_completion_by_date(
    state: tauri::State<'_, AppState>,
    habit_id: String,
    date: String,
) -> Result<Option<HabitCompletion>, String> {
    let db = state.db.lock().await;

    let completion = db
        .query_row(
            "SELECT * FROM habit_completions WHERE habit_id = ?1 AND date = ?2",
            params![habit_id, date],
            HabitCompletion::from_row,
        )
        .optional()
        .map_err(|e| format!("Failed to query habit completion: {}", e))?;

    Ok(completion)
}

#[tauri::command]
pub async fn get_habit_streak(
    state: tauri::State<'_, AppState>,
    habit_id: String,
) -> Result<i32, String> {
    let db = state.db.lock().await;

    let mut stmt = db
        .prepare(
            "SELECT date, completed FROM habit_completions
             WHERE habit_id = ?1
             ORDER BY date DESC"
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let completions: Vec<(String, bool)> = stmt
        .query_map(params![habit_id], |row| {
            Ok((row.get(0)?, row.get::<_, i32>(1)? != 0))
        })
        .map_err(|e| format!("Failed to query completions: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect completions: {}", e))?;

    // Calculate streak
    let mut streak = 0;
    for (_, completed) in completions {
        if completed {
            streak += 1;
        } else {
            break;
        }
    }

    Ok(streak)
}