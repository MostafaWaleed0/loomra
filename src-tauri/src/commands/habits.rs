use crate::database::AppState;
use rusqlite::{params, OptionalExtension, Row};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Habit {
    pub id: String,
    pub name: String,
    pub category: String,
    pub icon: String,
    pub color: String,
    pub target_amount: f64,
    pub unit: String,
    pub frequency: Frequency,
    pub priority: String,
    pub notes: String,
    pub linked_goals: Vec<String>,
    pub start_date: String,
    pub reminder: Reminder,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Frequency {
    #[serde(rename = "type")]
    pub freq_type: String,
    pub value: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reminder {
    pub enabled: bool,
    pub time: String,
}

impl Habit {
    /// Map a database row to a Habit struct
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        let frequency_value_str: String = row.get(8)?;
        let linked_goals_str: String = row.get(11)?;

        Ok(Self {
            id: row.get(0)?,
            name: row.get(1)?,
            category: row.get(2)?,
            icon: row.get(3)?,
            color: row.get(4)?,
            target_amount: row.get(5)?,
            unit: row.get(6)?,
            frequency: Frequency {
                freq_type: row.get(7)?,
                value: serde_json::from_str(&frequency_value_str).unwrap_or(Value::Null),
            },
            priority: row.get(9)?,
            notes: row.get(10)?,
            linked_goals: serde_json::from_str(&linked_goals_str).unwrap_or_default(),
            start_date: row.get(12)?,
            reminder: Reminder {
                enabled: row.get::<_, i32>(13)? != 0,
                time: row.get(14)?,
            },
            created_at: row.get(15)?,
            updated_at: row.get(16)?,
        })
    }

    /// Serialize frequency value to JSON string
    fn serialize_frequency_value(&self) -> Result<String, String> {
        serde_json::to_string(&self.frequency.value)
            .map_err(|e| format!("Failed to serialize frequency value: {}", e))
    }

    /// Serialize linked goals to JSON string
    fn serialize_linked_goals(&self) -> Result<String, String> {
        serde_json::to_string(&self.linked_goals)
            .map_err(|e| format!("Failed to serialize linked goals: {}", e))
    }
}

#[tauri::command]
pub async fn create_habit(
    state: tauri::State<'_, AppState>,
    habit: Habit,
) -> Result<Habit, String> {
    let db = state.db.lock().await;

    let frequency_value = habit.serialize_frequency_value()?;
    let linked_goals = habit.serialize_linked_goals()?;

    db.execute(
        "INSERT INTO habits (
            id, name, category, icon, color, target_amount, unit,
            frequency_type, frequency_value, priority, notes, linked_goals,
            start_date, reminder_enabled, reminder_time, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
        params![
            habit.id,
            habit.name,
            habit.category,
            habit.icon,
            habit.color,
            habit.target_amount,
            habit.unit,
            habit.frequency.freq_type,
            frequency_value,
            habit.priority,
            habit.notes,
            linked_goals,
            habit.start_date,
            habit.reminder.enabled as i32,
            habit.reminder.time,
            habit.created_at,
            habit.updated_at,
        ],
    )
    .map_err(|e| format!("Failed to create habit: {}", e))?;

    Ok(habit)
}

#[tauri::command]
pub async fn update_habit(
    state: tauri::State<'_, AppState>,
    habit: Habit,
) -> Result<Habit, String> {
    let db = state.db.lock().await;

    let frequency_value = habit.serialize_frequency_value()?;
    let linked_goals = habit.serialize_linked_goals()?;

    let rows = db.execute(
        "UPDATE habits SET
            name = ?1, category = ?2, icon = ?3, color = ?4,
            target_amount = ?5, unit = ?6, frequency_type = ?7, frequency_value = ?8,
            priority = ?9, notes = ?10, linked_goals = ?11, start_date = ?12,
            reminder_enabled = ?13, reminder_time = ?14, updated_at = ?15
        WHERE id = ?16",
        params![
            habit.name,
            habit.category,
            habit.icon,
            habit.color,
            habit.target_amount,
            habit.unit,
            habit.frequency.freq_type,
            frequency_value,
            habit.priority,
            habit.notes,
            linked_goals,
            habit.start_date,
            habit.reminder.enabled as i32,
            habit.reminder.time,
            habit.updated_at,
            habit.id,
        ],
    )
    .map_err(|e| format!("Failed to update habit: {}", e))?;

    if rows == 0 {
        return Err(format!("Habit with id '{}' not found", habit.id));
    }

    Ok(habit)
}

#[tauri::command]
pub async fn delete_habit(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<bool, String> {
    let db = state.db.lock().await;

    // Habit completions will be automatically deleted due to ON DELETE CASCADE
    let rows_affected = db
        .execute("DELETE FROM habits WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete habit: {}", e))?;

    Ok(rows_affected > 0)
}

#[tauri::command]
pub async fn get_all_habits(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Habit>, String> {
    let db = state.db.lock().await;

    let mut stmt = db
        .prepare("SELECT * FROM habits ORDER BY created_at DESC")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let habits = stmt
        .query_map([], Habit::from_row)
        .map_err(|e| format!("Failed to query habits: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect habits: {}", e))?;

    Ok(habits)
}

#[tauri::command]
pub async fn get_habit_by_id(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<Option<Habit>, String> {
    let db = state.db.lock().await;

    let habit = db
        .query_row(
            "SELECT * FROM habits WHERE id = ?1",
            params![id],
            Habit::from_row,
        )
        .optional()
        .map_err(|e| format!("Failed to query habit: {}", e))?;

    Ok(habit)
}

#[tauri::command]
pub async fn get_habits_by_category(
    state: tauri::State<'_, AppState>,
    category: String,
) -> Result<Vec<Habit>, String> {
    let db = state.db.lock().await;

    let mut stmt = db
        .prepare("SELECT * FROM habits WHERE category = ?1 ORDER BY created_at DESC")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let habits = stmt
        .query_map(params![category], Habit::from_row)
        .map_err(|e| format!("Failed to query habits: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect habits: {}", e))?;

    Ok(habits)
}