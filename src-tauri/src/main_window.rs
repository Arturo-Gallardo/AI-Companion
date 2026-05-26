use tauri::{AppHandle, Manager, Window, WindowEvent};

const MAIN_WINDOW_LABEL: &str = "main";

pub fn configure_main_window(app: &AppHandle) -> Result<(), String> {
    let main_window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window not found".to_string())?;

    main_window
        .set_icon(tauri::include_image!("icons/32x32.png"))
        .map_err(|error| format!("failed to set main window icon: {error}"))
}

pub fn handle_window_event(window: &Window, event: &WindowEvent) {
    if window.label() != MAIN_WINDOW_LABEL {
        return;
    }

    if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
    }
}

pub fn show_dashboard(app: &AppHandle) {
    let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
        return;
    };

    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
}
