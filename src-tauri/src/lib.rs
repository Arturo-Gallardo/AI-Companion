mod companion;

use companion::{
    create_companion_window, get_desktop_bounds, get_work_area, set_companion_position,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            create_companion_window(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_work_area,
            get_desktop_bounds,
            set_companion_position
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
