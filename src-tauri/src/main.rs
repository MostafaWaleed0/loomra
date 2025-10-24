#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod database;

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager, RunEvent, WindowEvent,
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

/// Build the system tray with menu items
fn setup_system_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItemBuilder::new("Show App")
        .id("show")
        .build(app)?;

    let check_updates_item = MenuItemBuilder::new("Check for Updates")
        .id("check_updates")
        .build(app)?;

    let quit_item = MenuItemBuilder::new("Quit")
        .id("quit")
        .build(app)?;

    let tray_menu = MenuBuilder::new(app)
        .items(&[&show_item, &check_updates_item, &quit_item])
        .build()?;

    TrayIconBuilder::new()
        .menu(&tray_menu)
        .on_tray_icon_event(handle_tray_icon_event)
        .on_menu_event(handle_tray_menu_event)
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Loomra")
        .build(app)?;

    Ok(())
}

/// Handle tray icon click events
fn handle_tray_icon_event(tray: &tauri::tray::TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click { .. } = event {
        let app = tray.app_handle();
        if let Some(window) = app.get_webview_window("main") {
            match window.is_visible() {
                Ok(true) => {
                    let _ = window.hide();
                }
                Ok(false) => {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.unminimize();
                }
                Err(e) => {
                    eprintln!("Failed to check window visibility: {}", e);
                }
            }
        }
    }
}

/// Handle tray menu item click events
fn handle_tray_menu_event(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    match event.id().as_ref() {
        "quit" => {
            // Properly quit the application on all platforms
            app.exit(0);
        }
        "show" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.unminimize();
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
        match app.updater() {
            Ok(updater) => {
                if let Err(e) = updater.check().await {
                    eprintln!("Update check failed: {}", e);
                }
            }
            Err(e) => {
                eprintln!("Failed to get updater: {}", e);
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
            // Platform-specific close behavior
            if label == "main" {
                #[cfg(target_os = "macos")]
                {
                    // On macOS, hide the window but keep app running (standard macOS behavior)
                    if let Some(window) = app.get_webview_window(&label) {
                        let _ = window.hide();
                    }
                    api.prevent_close();
                }

                #[cfg(not(target_os = "macos"))]
                {
                    // On Windows/Linux, minimize to tray
                    if let Some(window) = app.get_webview_window(&label) {
                        let _ = window.hide();
                    }
                    api.prevent_close();
                }
            }
        }
        RunEvent::ExitRequested { api, .. } => {
            // Platform-specific exit behavior
            #[cfg(target_os = "macos")]
            {
                // On macOS, allow Cmd+Q to quit
                // Check if all windows are closed or user explicitly quit
                api.prevent_exit();
            }

            #[cfg(not(target_os = "macos"))]
            {
                // On Windows/Linux, prevent exit and require tray quit
                api.prevent_exit();
            }
        }
        _ => {}
    }
}