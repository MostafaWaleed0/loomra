#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod database;

use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, RunEvent, WindowEvent,
};
use tauri_plugin_updater::UpdaterExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(setup_app)
        .invoke_handler(tauri::generate_handler![
            // Auth commands
            commands::auth::hash_password,
            commands::auth::verify_password,
            commands::auth::check_password_strength,
            // User data commands
            commands::user_data::get_user_data,
            commands::user_data::save_user_data,
            commands::user_data::update_user_data,
            commands::user_data::update_user_data_batch,
            commands::user_data::get_user_data_field,
            commands::user_data::delete_user_data,
            commands::user_data::user_data_exists,
            // Goal commands
            commands::goals::create_goal,
            commands::goals::update_goal,
            commands::goals::delete_goal,
            commands::goals::get_all_goals,
            commands::goals::get_goal_by_id,
            commands::goals::get_goals_by_status,
            // Task commands
            commands::tasks::create_task,
            commands::tasks::update_task,
            commands::tasks::delete_task,
            commands::tasks::get_all_tasks,
            commands::tasks::get_task_by_id,
            commands::tasks::get_tasks_by_goal_id,
            commands::tasks::get_tasks_by_status,
            commands::tasks::toggle_task_status,
            // Habit commands
            commands::habits::create_habit,
            commands::habits::update_habit,
            commands::habits::delete_habit,
            commands::habits::get_all_habits,
            commands::habits::get_habit_by_id,
            commands::habits::get_habits_by_category,
            // Habit completion commands
            commands::habit_completions::create_habit_completion,
            commands::habit_completions::update_habit_completion,
            commands::habit_completions::delete_habit_completion,
            commands::habit_completions::get_habit_completions,
            commands::habit_completions::get_completion_by_date,
            commands::habit_completions::get_habit_streak,
            // Settings commands
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::settings::update_appearance_settings,
            commands::settings::update_habit_settings,
            commands::settings::update_goal_settings,
            commands::settings::update_notification_settings,
            commands::settings::update_data_settings,
            commands::settings::reset_settings,
            commands::settings::export_settings,
            commands::settings::import_settings,
            commands::settings::export_all_data,
            commands::settings::import_all_data,
            // App commands
            commands::app::get_app_version,
            commands::app::get_app_info,
            commands::app::get_app_data_dir,
            commands::app::get_app_log_dir,
            commands::app::is_dev_mode,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(handle_run_events);
}

/// Setup application state and system tray
fn setup_app(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Initialize the database
    database::init_database(app.handle())?;

    // Setup system tray
    setup_system_tray(app)?;

    #[cfg(debug_assertions)]
    {
        let window = app.get_webview_window("main").unwrap();
        window.open_devtools();
    }

    Ok(())
}

/// Load tray icon from embedded resources
fn load_tray_icon() -> Image<'static> {
    Image::from_bytes(include_bytes!("../icons/icon.png"))
        .expect("Failed to load tray icon")
}

/// Build the system tray with better icons
fn setup_system_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Menu items
    let toggle_item = MenuItemBuilder::new("Show/Hide")
        .id("toggle")
        .build(app)?;

    let check_updates_item = MenuItemBuilder::new("Check for Updates")
        .id("check_updates")
        .build(app)?;

    let quit_item = MenuItemBuilder::new("Quit")
        .id("quit")
        .build(app)?;

    let tray_menu = MenuBuilder::new(app)
        .items(&[&toggle_item, &check_updates_item, &quit_item])
        .build()?;

    // Load the default tray icon
    let tray_icon = load_tray_icon();

    // Build tray with custom icon
    TrayIconBuilder::new()
        .menu(&tray_menu)
        .icon(tray_icon)
        .on_tray_icon_event(handle_tray_icon_event)
        .on_menu_event(handle_tray_menu_event)
        .tooltip("Loomra")
        .build(app)?;

    Ok(())
}

/// Handle tray icon click events
fn handle_tray_icon_event(tray: &tauri::tray::TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
    } = event
    {
        let app = tray.app_handle();
        if let Some(window) = app.get_webview_window("main") {
            if window.is_visible().unwrap_or(false) {
                let _ = window.hide();
            } else {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.unminimize();
            }
        }
    }
}

/// Handle tray menu item click events
fn handle_tray_menu_event(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    match event.id().as_ref() {
        "quit" => {
            app.exit(0);
        }
        "toggle" => {
            if let Some(window) = app.get_webview_window("main") {
                if window.is_visible().unwrap_or(false) {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.unminimize();
                }
            }
        }
        "check_updates" => {
            check_for_updates(app.clone());
        }
        _ => {}
    }
}

/// Trigger manual update check
fn check_for_updates(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        match app.updater_builder().build() {
            Ok(updater) => {
                match updater.check().await {
                    Ok(Some(update)) => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("update-available", update.version);
                        }
                    }
                    Ok(None) => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("update-not-available", ());
                        }
                    }
                    Err(e) => {
                        eprintln!("Update check failed: {}", e);
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to build updater: {}", e);
            }
        }
    });
}

/// Handle application run events
fn handle_run_events(app: &tauri::AppHandle, event: RunEvent) {
    match event {
        RunEvent::WindowEvent {
            label,
            event: WindowEvent::CloseRequested { api, .. },
            ..
        } => {
            if label == "main" {
                if let Some(window) = app.get_webview_window(&label) {
                    let _ = window.hide();
                }
                api.prevent_close();
            }
        }
        _ => {}
    }
}