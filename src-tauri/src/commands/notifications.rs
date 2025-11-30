use crate::database::AppState;
use rusqlite::{params, Row};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationPayload {
    pub id: String,
    pub habit_id: String,
    pub title: String,
    pub body: String,
    #[serde(rename = "type")]
    pub notification_type: String,
    pub scheduled_for: String,
    pub icon: Option<String>,
    pub actions: Option<Vec<NotificationAction>>,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationAction {
    pub action: String,
    pub title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationSchedule {
    pub habit_id: String,
    pub habit_name: String,
    pub scheduled_time: String,
    pub notification_type: String,
    pub is_recurring: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationHistory {
    pub id: String,
    pub habit_id: String,
    pub sent_at: String,
    pub notification_type: String,
    pub opened: bool,
    pub action_taken: Option<String>,
    pub payload_data: String,
}

impl NotificationSchedule {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        let schedule_data_str: String = row.get(6)?;

        match serde_json::from_str::<NotificationSchedule>(&schedule_data_str) {
            Ok(schedule) => Ok(schedule),
            Err(_) => {
                Ok(Self {
                    habit_id: row.get(1)?,
                    habit_name: row.get(2)?,
                    scheduled_time: row.get(3)?,
                    notification_type: row.get(4)?,
                    is_recurring: row.get::<_, i32>(5)? != 0,
                })
            }
        }
    }
}

impl NotificationHistory {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get(0)?,
            habit_id: row.get(1)?,
            sent_at: row.get(2)?,
            notification_type: row.get(3)?,
            opened: row.get::<_, i32>(4)? != 0,
            action_taken: row.get(5)?,
            payload_data: row.get(6)?,
        })
    }
}


#[tauri::command]
pub async fn send_system_notification(
    app: AppHandle,
    payload: NotificationPayload,
) -> Result<(), String> {
    app.notification()
        .builder()
        .title(&payload.title)
        .body(&payload.body)
        .icon("../../icons/32x32.png")
        .show()
        .map_err(|e| format!("Failed to send notification: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn schedule_notification(
    state: tauri::State<'_, AppState>,
    schedule: NotificationSchedule,
) -> Result<NotificationSchedule, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let schedule_json = serde_json::to_string(&schedule)
        .map_err(|e| format!("Failed to serialize schedule: {}", e))?;

    db.execute(
        "INSERT OR REPLACE INTO notification_schedules (
            habit_id, habit_name, scheduled_time, notification_type, is_recurring, schedule_data
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            schedule.habit_id,
            schedule.habit_name,
            schedule.scheduled_time,
            schedule.notification_type,
            schedule.is_recurring as i32,
            schedule_json,
        ],
    )
    .map_err(|e| format!("Failed to schedule notification: {}", e))?;

    Ok(schedule)
}

#[tauri::command]
pub async fn get_scheduled_notifications(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<NotificationSchedule>, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let mut stmt = db
        .prepare(
            "SELECT id, habit_id, habit_name, scheduled_time, notification_type,
                    is_recurring, schedule_data
             FROM notification_schedules
             ORDER BY scheduled_time ASC"
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let schedules = stmt
        .query_map([], NotificationSchedule::from_row)
        .map_err(|e| format!("Failed to query schedules: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect schedules: {}", e))?;

    Ok(schedules)
}

#[tauri::command]
pub async fn get_habit_notifications(
    state: tauri::State<'_, AppState>,
    habit_id: String,
) -> Result<Vec<NotificationSchedule>, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let mut stmt = db
        .prepare(
            "SELECT id, habit_id, habit_name, scheduled_time, notification_type,
                    is_recurring, schedule_data
             FROM notification_schedules
             WHERE habit_id = ?1
             ORDER BY scheduled_time ASC"
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let schedules = stmt
        .query_map(params![habit_id], NotificationSchedule::from_row)
        .map_err(|e| format!("Failed to query schedules: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect schedules: {}", e))?;

    Ok(schedules)
}

#[tauri::command]
pub async fn cancel_notification(
    state: tauri::State<'_, AppState>,
    habit_id: String,
) -> Result<bool, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let rows = db.execute(
        "DELETE FROM notification_schedules WHERE habit_id = ?1",
        params![habit_id],
    )
    .map_err(|e| format!("Failed to cancel notification: {}", e))?;

    Ok(rows > 0)
}

#[tauri::command]
pub async fn cancel_all_notifications(
    state: tauri::State<'_, AppState>,
) -> Result<usize, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let rows = db.execute("DELETE FROM notification_schedules", [])
        .map_err(|e| format!("Failed to cancel all notifications: {}", e))?;

    Ok(rows)
}

#[tauri::command]
pub async fn record_notification(
    state: tauri::State<'_, AppState>,
    history: NotificationHistory,
) -> Result<NotificationHistory, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    db.execute(
        "INSERT INTO notification_history (
            id, habit_id, sent_at, notification_type, opened, action_taken, payload_data
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            history.id,
            history.habit_id,
            history.sent_at,
            history.notification_type,
            history.opened as i32,
            history.action_taken,
            history.payload_data,
        ],
    )
    .map_err(|e| format!("Failed to record notification: {}", e))?;

    Ok(history)
}

#[tauri::command]
pub async fn get_notification_history(
    state: tauri::State<'_, AppState>,
    limit: Option<i32>,
) -> Result<Vec<NotificationHistory>, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let query = if let Some(limit) = limit {
        format!(
            "SELECT id, habit_id, sent_at, notification_type, opened, action_taken, payload_data
             FROM notification_history
             ORDER BY sent_at DESC
             LIMIT {}",
            limit
        )
    } else {
        "SELECT id, habit_id, sent_at, notification_type, opened, action_taken, payload_data
         FROM notification_history
         ORDER BY sent_at DESC"
            .to_string()
    };

    let mut stmt = db
        .prepare(&query)
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let history = stmt
        .query_map([], NotificationHistory::from_row)
        .map_err(|e| format!("Failed to query history: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect history: {}", e))?;

    Ok(history)
}

#[tauri::command]
pub async fn mark_notification_opened(
    state: tauri::State<'_, AppState>,
    notification_id: String,
    action_taken: Option<String>,
) -> Result<(), String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    db.execute(
        "UPDATE notification_history
         SET opened = 1, action_taken = ?2
         WHERE id = ?1",
        params![notification_id, action_taken],
    )
    .map_err(|e| format!("Failed to update notification: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn clean_notification_history(
    state: tauri::State<'_, AppState>,
    days_to_keep: i32,
) -> Result<usize, String> {
    let db = state.db.get()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;

    let rows = db.execute(
        "DELETE FROM notification_history
         WHERE sent_at < datetime('now', '-' || ?1 || ' days')",
        params![days_to_keep],
    )
    .map_err(|e| format!("Failed to clean notification history: {}", e))?;

    Ok(rows)
}

#[tauri::command]
pub async fn check_notification_permission(_app: AppHandle) -> Result<bool, String> {
    Ok(true)
}

#[tauri::command]
pub async fn request_notification_permission(_app: AppHandle) -> Result<bool, String> {
    Ok(true)
}