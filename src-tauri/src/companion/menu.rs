use serde::Serialize;
use tauri::window::Color;
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, WebviewUrl, WebviewWindowBuilder};

use super::{query_desktop_bounds, MonitorWorkArea};

pub const MENU_WINDOW_LABEL: &str = "companion-menu";
pub const COMPANION_MENU_CONFIG_EVENT: &str = "companion-menu-config";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompanionMenuConfigPayload {
    pub wall_locked: bool,
    pub underside_locked: bool,
    pub frozen: bool,
    // the companion window the menu should route its actions back to
    pub target_label: String,
}

const MENU_WIDTH: f64 = 152.0;
const MENU_HEIGHT: f64 = 154.0;

fn monitor_at_point<'a>(
    x: f64,
    y: f64,
    monitors: &'a [MonitorWorkArea],
) -> Option<&'a MonitorWorkArea> {
    for monitor in monitors {
        let left = monitor.x as f64;
        let top = monitor.y as f64;
        let right = left + monitor.width as f64;
        let bottom = top + monitor.height as f64;

        if x >= left && x <= right && y >= top && y <= bottom {
            return Some(monitor);
        }
    }

    monitors.first()
}

fn clamp_menu_position(screen_x: f64, screen_y: f64) -> Result<(i32, i32), String> {
    let bounds = query_desktop_bounds()?;
    let monitor = monitor_at_point(screen_x, screen_y, &bounds.monitors)
        .ok_or_else(|| "no monitors found".to_string())?;

    let mon_left = monitor.x as f64;
    let mon_top = monitor.y as f64;
    let mon_right = mon_left + monitor.width as f64;
    let mon_bottom = mon_top + monitor.height as f64;

    let mut x = screen_x;
    let mut y = screen_y;

    // open above the cursor when the menu would clip off the bottom
    if y + MENU_HEIGHT > mon_bottom {
        y = screen_y - MENU_HEIGHT;
    }

    x = x.clamp(mon_left, (mon_right - MENU_WIDTH).max(mon_left));
    y = y.clamp(mon_top, (mon_bottom - MENU_HEIGHT).max(mon_top));

    Ok((x.round() as i32, y.round() as i32))
}

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
pub fn show_companion_menu(
    caller: tauri::WebviewWindow,
    screen_x: f64,
    screen_y: f64,
    wall_locked: bool,
    underside_locked: bool,
    frozen: bool,
) -> Result<(), String> {
    let app = caller.app_handle();
    let target_label = caller.label().to_string();

    let window = app
        .get_webview_window(MENU_WINDOW_LABEL)
        .ok_or_else(|| "companion menu window not found".to_string())?;

    let (window_x, window_y) = clamp_menu_position(screen_x, screen_y)?;

    window
        .emit(
            COMPANION_MENU_CONFIG_EVENT,
            CompanionMenuConfigPayload {
                wall_locked,
                underside_locked,
                frozen,
                target_label,
            },
        )
        .map_err(|error| format!("failed to emit companion menu config: {error}"))?;

    window
        .set_size(tauri::LogicalSize::new(MENU_WIDTH, MENU_HEIGHT))
        .map_err(|error| format!("failed to resize companion menu window: {error}"))?;

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
