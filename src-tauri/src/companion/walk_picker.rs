use serde::Serialize;
use tauri::window::Color;
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, WebviewUrl, WebviewWindowBuilder};

use super::query_desktop_bounds;

pub const WALK_PICKER_WINDOW_LABEL: &str = "walk-picker";
pub const WALK_PICKER_SELECTED_EVENT: &str = "walk-picker-selected";
pub const WALK_PICKER_CANCEL_EVENT: &str = "walk-picker-cancel";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WalkPickerSelectedPayload {
    pub anchor_x: f64,
}

pub fn create_walk_picker_window(app: &AppHandle) -> Result<(), String> {
    if app.get_webview_window(WALK_PICKER_WINDOW_LABEL).is_some() {
        return Ok(());
    }

    let bounds = query_desktop_bounds()?;

    let picker_window = WebviewWindowBuilder::new(
        app,
        WALK_PICKER_WINDOW_LABEL,
        WebviewUrl::default(),
    )
    .title("Walk Picker")
    .inner_size(bounds.virtual_width as f64, bounds.virtual_height as f64)
    .position(bounds.virtual_left as f64, bounds.virtual_top as f64)
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
    .map_err(|error| format!("failed to create walk picker window: {error}"))?;

    let _ = picker_window;

    Ok(())
}

#[tauri::command]
pub fn show_walk_picker(app: AppHandle) -> Result<(), String> {
    let _ = hide_companion_menu(app.clone());

    let bounds = query_desktop_bounds()?;

    let window = app
        .get_webview_window(WALK_PICKER_WINDOW_LABEL)
        .ok_or_else(|| "walk picker window not found".to_string())?;

    window
        .set_size(tauri::LogicalSize::new(
            bounds.virtual_width as f64,
            bounds.virtual_height as f64,
        ))
        .map_err(|error| format!("failed to resize walk picker window: {error}"))?;

    window
        .set_position(PhysicalPosition::new(bounds.virtual_left, bounds.virtual_top))
        .map_err(|error| format!("failed to position walk picker window: {error}"))?;

    window
        .show()
        .map_err(|error| format!("failed to show walk picker window: {error}"))?;

    window
        .set_focus()
        .map_err(|error| format!("failed to focus walk picker window: {error}"))?;

    Ok(())
}

#[tauri::command]
pub fn hide_walk_picker(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(WALK_PICKER_WINDOW_LABEL) {
        window
            .hide()
            .map_err(|error| format!("failed to hide walk picker window: {error}"))?;
    }

    Ok(())
}

pub fn emit_walk_picker_selected(app: &AppHandle, anchor_x: f64) -> Result<(), String> {
    let _ = app.emit_to(
        "companion",
        WALK_PICKER_SELECTED_EVENT,
        WalkPickerSelectedPayload { anchor_x },
    );

    Ok(())
}

pub fn emit_walk_picker_cancel(app: &AppHandle) -> Result<(), String> {
    let _ = app.emit_to("companion", WALK_PICKER_CANCEL_EVENT, ());

    Ok(())
}

// called from the walk-picker webview via invoke
#[tauri::command]
pub fn submit_walk_picker_target(app: AppHandle, anchor_x: f64) -> Result<(), String> {
    emit_walk_picker_selected(&app, anchor_x)?;
    hide_walk_picker(app)
}

#[tauri::command]
pub fn cancel_walk_picker(app: AppHandle) -> Result<(), String> {
    emit_walk_picker_cancel(&app)?;
    hide_walk_picker(app)
}

fn hide_companion_menu(app: AppHandle) -> Result<(), String> {
    super::menu::hide_companion_menu(app)
}
