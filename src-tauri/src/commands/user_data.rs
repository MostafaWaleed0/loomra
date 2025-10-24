use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Custom error type for user data operations
#[derive(Debug, thiserror::Error)]
pub enum UserDataError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Path error: {0}")]
    Path(String),
}

impl From<UserDataError> for String {
    fn from(err: UserDataError) -> Self {
        err.to_string()
    }
}

/// Get the path to the user config file
fn get_user_data_path(app_handle: &AppHandle) -> Result<PathBuf, UserDataError> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| UserDataError::Path(e.to_string()))?;

    Ok(app_data_dir.join("user-config.json"))
}

/// Ensure the parent directory exists
fn ensure_parent_dir(path: &PathBuf) -> Result<(), UserDataError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    Ok(())
}

/// Get user data from config file
#[tauri::command]
pub async fn get_user_data(app_handle: AppHandle) -> Result<Option<Value>, String> {
    let path = get_user_data_path(&app_handle)?;

    if !path.exists() {
        return Ok(None);
    }

    let data = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read user data: {}", e))?;

    let json: Value = serde_json::from_str(&data)
        .map_err(|e| format!("Failed to parse user data: {}", e))?;

    Ok(Some(json))
}

/// Save complete user data to config file
#[tauri::command]
pub async fn save_user_data(
    app_handle: AppHandle,
    user_data: Value,
) -> Result<(), String> {
    let path = get_user_data_path(&app_handle)?;

    ensure_parent_dir(&path)?;

    let json = serde_json::to_string_pretty(&user_data)
        .map_err(|e| format!("Failed to serialize user data: {}", e))?;

    fs::write(&path, json)
        .map_err(|e| format!("Failed to write user data: {}", e))?;

    Ok(())
}

/// Update a specific field in user data
#[tauri::command]
pub async fn update_user_data(
    app_handle: AppHandle,
    field: String,
    value: Value,
) -> Result<(), String> {
    let path = get_user_data_path(&app_handle)?;

    // Load existing data or create new object
    let mut user_data = if path.exists() {
        let data = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read user data: {}", e))?;
        serde_json::from_str(&data)
            .map_err(|e| format!("Failed to parse user data: {}", e))?
    } else {
        serde_json::json!({})
    };

    // Update the field
    if let Some(obj) = user_data.as_object_mut() {
        obj.insert(field, value);
    } else {
        return Err("User data is not a JSON object".to_string());
    }

    ensure_parent_dir(&path)?;

    let json = serde_json::to_string_pretty(&user_data)
        .map_err(|e| format!("Failed to serialize user data: {}", e))?;

    fs::write(&path, json)
        .map_err(|e| format!("Failed to write user data: {}", e))?;

    Ok(())
}

/// Update multiple fields in user data at once
#[tauri::command]
pub async fn update_user_data_batch(
    app_handle: AppHandle,
    updates: Value,
) -> Result<(), String> {
    let path = get_user_data_path(&app_handle)?;

    // Load existing data or create new object
    let mut user_data = if path.exists() {
        let data = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read user data: {}", e))?;
        serde_json::from_str(&data)
            .map_err(|e| format!("Failed to parse user data: {}", e))?
    } else {
        serde_json::json!({})
    };

    // Merge updates
    if let (Some(data_obj), Some(updates_obj)) = (user_data.as_object_mut(), updates.as_object()) {
        for (key, value) in updates_obj {
            data_obj.insert(key.clone(), value.clone());
        }
    } else {
        return Err("Invalid data format for batch update".to_string());
    }

    ensure_parent_dir(&path)?;

    let json = serde_json::to_string_pretty(&user_data)
        .map_err(|e| format!("Failed to serialize user data: {}", e))?;

    fs::write(&path, json)
        .map_err(|e| format!("Failed to write user data: {}", e))?;

    Ok(())
}

/// Get a specific field from user data
#[tauri::command]
pub async fn get_user_data_field(
    app_handle: AppHandle,
    field: String,
) -> Result<Option<Value>, String> {
    let path = get_user_data_path(&app_handle)?;

    if !path.exists() {
        return Ok(None);
    }

    let data = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read user data: {}", e))?;

    let json: Value = serde_json::from_str(&data)
        .map_err(|e| format!("Failed to parse user data: {}", e))?;

    if let Some(obj) = json.as_object() {
        Ok(obj.get(&field).cloned())
    } else {
        Ok(None)
    }
}

/// Delete user data file
#[tauri::command]
pub async fn delete_user_data(app_handle: AppHandle) -> Result<(), String> {
    let path = get_user_data_path(&app_handle)?;

    if path.exists() {
        fs::remove_file(&path)
            .map_err(|e| format!("Failed to delete user data: {}", e))?;
    }

    Ok(())
}

/// Check if user data file exists
#[tauri::command]
pub async fn user_data_exists(app_handle: AppHandle) -> Result<bool, String> {
    let path = get_user_data_path(&app_handle)?;
    Ok(path.exists())
}