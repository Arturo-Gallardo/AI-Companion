use std::sync::Mutex;

use serde::Serialize;
use tauri::window::Color;
use tauri::{AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, WebviewUrl, WebviewWindowBuilder};

use super::SPRITE_HEIGHT;

pub const SPEECH_WINDOW_LABEL: &str = "companion-speech";
pub const COMPANION_SPEECH_CONTENT_EVENT: &str = "companion-speech-content";
pub const COMPANION_SPEECH_DISMISS_EVENT: &str = "companion-speech-dismiss";
pub const SPEECH_BUBBLE_GAP: f64 = 4.0;

const SPEECH_INITIAL_WIDTH: f64 = 128.0;
const SPEECH_INITIAL_HEIGHT: f64 = 32.0;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CompanionSpeechContentPayload {
    text: String,
    anchor_x: f64,
    anchor_y: f64,
}

#[derive(Debug, Clone, Copy)]
struct SpeechWindowState {
    visible: bool,
    anchor_x: f64,
    anchor_y: f64,
    width: f64,
    height: f64,
}

static PENDING_SPEECH_TEXT: Mutex<Option<String>> = Mutex::new(None);

impl Default for SpeechWindowState {
    fn default() -> Self {
        Self {
            visible: false,
            anchor_x: 0.0,
            anchor_y: 0.0,
            width: SPEECH_INITIAL_WIDTH,
            height: SPEECH_INITIAL_HEIGHT,
        }
    }
}

static SPEECH_STATE: Mutex<SpeechWindowState> = Mutex::new(SpeechWindowState {
    visible: false,
    anchor_x: 0.0,
    anchor_y: 0.0,
    width: SPEECH_INITIAL_WIDTH,
    height: SPEECH_INITIAL_HEIGHT,
});

fn read_speech_state() -> Result<SpeechWindowState, String> {
    SPEECH_STATE
        .lock()
        .map(|state| *state)
        .map_err(|error| format!("failed to read speech window state: {error}"))
}

fn update_speech_state(update: impl FnOnce(&mut SpeechWindowState)) -> Result<(), String> {
    let mut state = SPEECH_STATE
        .lock()
        .map_err(|error| format!("failed to update speech window state: {error}"))?;
    update(&mut state);
    Ok(())
}

fn companion_speech_position(
    anchor_x: f64,
    anchor_y: f64,
    speech_width: f64,
    speech_height: f64,
) -> (i32, i32) {
    let speech_bottom = anchor_y - SPRITE_HEIGHT - SPEECH_BUBBLE_GAP;
    let window_x = (anchor_x - speech_width / 2.0).round() as i32;
    let window_y = (speech_bottom - speech_height).round() as i32;

    (window_x, window_y)
}

fn apply_companion_speech_bounds(
    app: &AppHandle,
    anchor_x: f64,
    anchor_y: f64,
    speech_width: f64,
    speech_height: f64,
    show_window: bool,
) -> Result<(), String> {
    let window = app
        .get_webview_window(SPEECH_WINDOW_LABEL)
        .ok_or_else(|| "companion speech window not found".to_string())?;

    let (window_x, window_y) =
        companion_speech_position(anchor_x, anchor_y, speech_width, speech_height);

    window
        .set_size(LogicalSize::new(speech_width, speech_height))
        .map_err(|error| format!("failed to resize companion speech window: {error}"))?;

    window
        .set_position(PhysicalPosition::new(window_x, window_y))
        .map_err(|error| format!("failed to reposition companion speech window: {error}"))?;

    if show_window {
        window
            .show()
            .map_err(|error| format!("failed to show companion speech window: {error}"))?;
    }

    Ok(())
}

pub fn create_companion_speech_window(app: &AppHandle) -> Result<(), String> {
    if app.get_webview_window(SPEECH_WINDOW_LABEL).is_some() {
        return Ok(());
    }

    let speech_window = WebviewWindowBuilder::new(app, SPEECH_WINDOW_LABEL, WebviewUrl::default())
        .title("Companion Speech")
        .inner_size(SPEECH_INITIAL_WIDTH, SPEECH_INITIAL_HEIGHT)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .background_color(Color(0, 0, 0, 0))
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .focused(false)
        .visible(false)
        .build()
        .map_err(|error| format!("failed to create companion speech window: {error}"))?;

    let _ = speech_window;

    Ok(())
}

pub fn sync_companion_speech_position(app: &AppHandle, anchor_x: f64, anchor_y: f64) -> Result<(), String> {
    let state = read_speech_state()?;

    if !state.visible {
        return Ok(());
    }

    if app.get_webview_window(SPEECH_WINDOW_LABEL).is_none() {
        return Ok(());
    }

    update_speech_state(|stored| {
        stored.anchor_x = anchor_x;
        stored.anchor_y = anchor_y;
    })?;

    let _ = apply_companion_speech_bounds(
        app,
        anchor_x,
        anchor_y,
        state.width,
        state.height,
        false,
    );

    Ok(())
}

#[tauri::command]
pub fn take_companion_speech_content() -> Result<Option<String>, String> {
    let mut pending = PENDING_SPEECH_TEXT
        .lock()
        .map_err(|error| format!("failed to read pending speech content: {error}"))?;

    Ok(pending.take())
}

#[tauri::command]
pub fn show_companion_speech(
    app: AppHandle,
    text: String,
    anchor_x: f64,
    anchor_y: f64,
) -> Result<(), String> {
    if app.get_webview_window(SPEECH_WINDOW_LABEL).is_none() {
        return Err("companion speech window not found".to_string());
    }

    {
        let mut pending = PENDING_SPEECH_TEXT
            .lock()
            .map_err(|error| format!("failed to store pending speech content: {error}"))?;
        *pending = Some(text.clone());
    }

    update_speech_state(|state| {
        state.visible = true;
        state.anchor_x = anchor_x;
        state.anchor_y = anchor_y;
        state.width = SPEECH_INITIAL_WIDTH;
        state.height = SPEECH_INITIAL_HEIGHT;
    })?;

    apply_companion_speech_bounds(
        &app,
        anchor_x,
        anchor_y,
        SPEECH_INITIAL_WIDTH,
        SPEECH_INITIAL_HEIGHT,
        true,
    )?;

    let _ = app.emit_to(
        SPEECH_WINDOW_LABEL,
        COMPANION_SPEECH_CONTENT_EVENT,
        CompanionSpeechContentPayload {
            text,
            anchor_x,
            anchor_y,
        },
    );

    Ok(())
}

#[tauri::command]
pub fn hide_companion_speech(app: AppHandle) -> Result<(), String> {
    {
        let mut pending = PENDING_SPEECH_TEXT
            .lock()
            .map_err(|error| format!("failed to clear pending speech content: {error}"))?;
        *pending = None;
    }

    update_speech_state(|state| {
        state.visible = false;
    })?;

    let _ = app.emit_to(SPEECH_WINDOW_LABEL, COMPANION_SPEECH_DISMISS_EVENT, ());

    if let Some(window) = app.get_webview_window(SPEECH_WINDOW_LABEL) {
        window
            .hide()
            .map_err(|error| format!("failed to hide companion speech window: {error}"))?;
    }

    Ok(())
}

#[tauri::command]
pub fn set_companion_speech_size(app: AppHandle, width: f64, height: f64) -> Result<(), String> {
    let state = read_speech_state()?;

    if !state.visible {
        return Ok(());
    }

    update_speech_state(|stored| {
        stored.width = width;
        stored.height = height;
    })?;

    apply_companion_speech_bounds(
        &app,
        state.anchor_x,
        state.anchor_y,
        width,
        height,
        true,
    )
}
