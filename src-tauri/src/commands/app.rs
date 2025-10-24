use serde::Serialize;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub version: String,
    pub name: String,
    pub authors: String,
}

/// Get the application version
#[tauri::command]
pub async fn get_app_version(app_handle: AppHandle) -> Result<String, String> {
    Ok(app_handle.package_info().version.to_string())
}

/// Get comprehensive application information
#[tauri::command]
pub async fn get_app_info(app_handle: AppHandle) -> Result<AppInfo, String> {
    let package_info = app_handle.package_info();

    Ok(AppInfo {
        version: package_info.version.to_string(),
        name: package_info.name.clone(),
        authors: package_info.authors.to_string(),
    })
}

/// Get the application data directory path
#[tauri::command]
pub async fn get_app_data_dir(app_handle: AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    app_data_dir
        .to_str()
        .ok_or_else(|| "Invalid path encoding".to_string())
        .map(|s| s.to_string())
}

/// Get the application log directory path
#[tauri::command]
pub async fn get_app_log_dir(app_handle: AppHandle) -> Result<String, String> {
    let app_log_dir = app_handle
        .path()
        .app_log_dir()
        .map_err(|e| format!("Failed to get app log directory: {}", e))?;

    app_log_dir
        .to_str()
        .ok_or_else(|| "Invalid path encoding".to_string())
        .map(|s| s.to_string())
}

/// Check if the application is running in development mode
#[tauri::command]
pub async fn is_dev_mode() -> Result<bool, String> {
    Ok(cfg!(debug_assertions))
}