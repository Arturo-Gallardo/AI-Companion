mod companion;
mod focus;
mod main_window;
mod tray;

use companion::{
    create_companion_window, get_desktop_bounds, get_work_area, set_companion_position,
};
use focus::analyze_screen_activity;
use main_window::{configure_main_window, handle_window_event};
use tray::create_tray;

fn load_env_files() {
    let _ = dotenvy::from_filename("../.env.local");
    let _ = dotenvy::from_filename(".env.local");
    let _ = dotenvy::dotenv();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    load_env_files();

    tauri::Builder::default()
        .setup(|app| {
            configure_main_window(app.handle())?;
            create_companion_window(app.handle())?;
            create_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            handle_window_event(window, event);
        })
        .invoke_handler(tauri::generate_handler![
            get_work_area,
            get_desktop_bounds,
            set_companion_position,
            analyze_screen_activity
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            if let tauri::RunEvent::ExitRequested { api, code, .. } = event {
                // user closed the dashboard — keep companion + tray running
                if code.is_none() {
                    api.prevent_exit();
                }
            }
        });
}
