mod companion;
mod main_window;
mod tray;

use companion::{
    cancel_walk_picker, create_companion_menu_window, create_companion_speech_window,
    create_companion_window, create_walk_picker_window, get_desktop_bounds, get_work_area,
    hide_companion_menu, hide_companion_speech, hide_walk_picker, set_companion_position,
    set_companion_speech_size, show_companion_menu, show_companion_speech, show_walk_picker,
    submit_walk_picker_target, take_companion_speech_content,
};
use main_window::{configure_main_window, handle_window_event};
use tray::create_tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            configure_main_window(app.handle())?;
            create_companion_window(app.handle())?;
            // speech webview must exist before any invoke from companion — creating it
            // inside a command deadlocks the main thread on Windows
            create_companion_speech_window(app.handle())?;
            create_companion_menu_window(app.handle())?;
            create_walk_picker_window(app.handle())?;
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
            show_companion_speech,
            hide_companion_speech,
            set_companion_speech_size,
            take_companion_speech_content,
            show_companion_menu,
            hide_companion_menu,
            show_walk_picker,
            hide_walk_picker,
            submit_walk_picker_target,
            cancel_walk_picker,
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
