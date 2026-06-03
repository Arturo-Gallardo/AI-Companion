use tauri::window::Color;
use tauri::{AppHandle, Manager, PhysicalPosition, WebviewUrl, WebviewWindowBuilder};

pub const MENU_WINDOW_LABEL: &str = "companion-menu";

const MENU_WIDTH: f64 = 152.0;
const MENU_HEIGHT: f64 = 118.0;

pub fn create_companion_menu_window(app: &AppHandle) -> Result<(), String> {
    if app.get_webview_window(MENU_WINDOW_LABEL).is_some() {
        return Ok(());
    }

    let menu_window = WebviewWindowBuilder::new(app, MENU_WINDOW_LABEL, WebviewUrl::default())
        .title("Companion Menu")
        .inner_size(MENU_WIDTH, MENU_HEIGHT)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .background_color(Color(0, 0, 0, 0))
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .focused(true)
        .visible(false)
        .build()
        .map_err(|error| format!("failed to create companion menu window: {error}"))?;

    let _ = menu_window;

    Ok(())
}

#[tauri::command]
pub fn show_companion_menu(app: AppHandle, screen_x: f64, screen_y: f64) -> Result<(), String> {
    let window = app
        .get_webview_window(MENU_WINDOW_LABEL)
        .ok_or_else(|| "companion menu window not found".to_string())?;

    let window_x = screen_x.round() as i32;
    let window_y = screen_y.round() as i32;

    window
        .set_position(PhysicalPosition::new(window_x, window_y))
        .map_err(|error| format!("failed to position companion menu window: {error}"))?;

    window
        .show()
        .map_err(|error| format!("failed to show companion menu window: {error}"))?;

    window
        .set_focus()
        .map_err(|error| format!("failed to focus companion menu window: {error}"))?;

    Ok(())
}

#[tauri::command]
pub fn hide_companion_menu(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(MENU_WINDOW_LABEL) {
        window
            .hide()
            .map_err(|error| format!("failed to hide companion menu window: {error}"))?;
    }

    Ok(())
}
