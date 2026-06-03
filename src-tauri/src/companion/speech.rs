use std::sync::Mutex;

use serde::Serialize;
use tauri::window::Color;
use tauri::{AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, WebviewUrl, WebviewWindowBuilder};

use super::{query_desktop_bounds, MonitorWorkArea, ANCHOR_X, SPRITE_HEIGHT, SPRITE_WIDTH};

pub const SPEECH_WINDOW_LABEL: &str = "companion-speech";
pub const COMPANION_SPEECH_CONTENT_EVENT: &str = "companion-speech-content";
pub const COMPANION_SPEECH_DISMISS_EVENT: &str = "companion-speech-dismiss";
pub const COMPANION_SPEECH_PLACEMENT_EVENT: &str = "companion-speech-placement";
pub const SPEECH_BUBBLE_GAP: f64 = 4.0;

const SPEECH_INITIAL_WIDTH: f64 = 128.0;
const SPEECH_INITIAL_HEIGHT: f64 = 32.0;
const SPEECH_SIDE_GAP: f64 = 4.0;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SpeechBubblePlacement {
    Above,
    Left,
    Right,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CompanionSpeechContentPayload {
    text: String,
    anchor_x: f64,
    anchor_y: f64,
    placement: SpeechBubblePlacement,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CompanionSpeechPlacementPayload {
    placement: SpeechBubblePlacement,
}

#[derive(Debug, Clone, Copy)]
struct SpeechWindowState {
    visible: bool,
    anchor_x: f64,
    anchor_y: f64,
    width: f64,
    height: f64,
    placement: SpeechBubblePlacement,
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
            placement: SpeechBubblePlacement::Above,
        }
    }
}

static SPEECH_STATE: Mutex<SpeechWindowState> = Mutex::new(SpeechWindowState {
    visible: false,
    anchor_x: 0.0,
    anchor_y: 0.0,
    width: SPEECH_INITIAL_WIDTH,
    height: SPEECH_INITIAL_HEIGHT,
    placement: SpeechBubblePlacement::Above,
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

fn clamp_to_monitor(
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    mon_left: f64,
    mon_top: f64,
    mon_right: f64,
    mon_bottom: f64,
) -> (f64, f64) {
    (
        x.clamp(mon_left, (mon_right - width).max(mon_left)),
        y.clamp(mon_top, (mon_bottom - height).max(mon_top)),
    )
}

struct ResolvedSpeechBounds {
    x: f64,
    y: f64,
    placement: SpeechBubblePlacement,
}

fn resolve_speech_bounds(
    anchor_x: f64,
    anchor_y: f64,
    speech_width: f64,
    speech_height: f64,
) -> Result<ResolvedSpeechBounds, String> {
    let bounds = query_desktop_bounds()?;
    let monitor = monitor_at_point(anchor_x, anchor_y, &bounds.monitors)
        .ok_or_else(|| "no monitors found".to_string())?;

    let mon_left = monitor.x as f64;
    let mon_top = monitor.y as f64;
    let mon_right = mon_left + monitor.width as f64;
    let mon_bottom = mon_top + monitor.height as f64;

    let sprite_left = anchor_x - ANCHOR_X;
    let sprite_right = sprite_left + SPRITE_WIDTH;
    let sprite_top = anchor_y - SPRITE_HEIGHT;

    let above_y = sprite_top - SPEECH_BUBBLE_GAP - speech_height;
    let above_x = anchor_x - speech_width / 2.0;

    if above_y >= mon_top {
        let (x, y) = clamp_to_monitor(
            above_x,
            above_y,
            speech_width,
            speech_height,
            mon_left,
            mon_top,
            mon_right,
            mon_bottom,
        );

        return Ok(ResolvedSpeechBounds {
            x,
            y,
            placement: SpeechBubblePlacement::Above,
        });
    }

    let left_space = sprite_left - SPEECH_SIDE_GAP - mon_left;
    let right_space = mon_right - sprite_right - SPEECH_SIDE_GAP;

    let placement = if left_space >= right_space {
        SpeechBubblePlacement::Left
    } else {
        SpeechBubblePlacement::Right
    };

    let side_y = anchor_y - SPRITE_HEIGHT / 2.0 - speech_height / 2.0;
    let side_x = match placement {
        SpeechBubblePlacement::Left => sprite_left - SPEECH_SIDE_GAP - speech_width,
        SpeechBubblePlacement::Right => sprite_right + SPEECH_SIDE_GAP,
        SpeechBubblePlacement::Above => unreachable!(),
    };

    let (x, y) = clamp_to_monitor(
        side_x,
        side_y,
        speech_width,
        speech_height,
        mon_left,
        mon_top,
        mon_right,
        mon_bottom,
    );

    Ok(ResolvedSpeechBounds {
        x,
        y,
        placement,
    })
}

fn emit_speech_placement(
    app: &AppHandle,
    placement: SpeechBubblePlacement,
) -> Result<(), String> {
    let _ = app.emit_to(
        SPEECH_WINDOW_LABEL,
        COMPANION_SPEECH_PLACEMENT_EVENT,
        CompanionSpeechPlacementPayload { placement },
    );

    Ok(())
}

fn apply_companion_speech_bounds(
    app: &AppHandle,
    anchor_x: f64,
    anchor_y: f64,
    speech_width: f64,
    speech_height: f64,
    show_window: bool,
) -> Result<SpeechBubblePlacement, String> {
    let previous = read_speech_state()?.placement;
    let resolved = resolve_speech_bounds(anchor_x, anchor_y, speech_width, speech_height)?;

    let window = app
        .get_webview_window(SPEECH_WINDOW_LABEL)
        .ok_or_else(|| "companion speech window not found".to_string())?;

    window
        .set_size(LogicalSize::new(speech_width, speech_height))
        .map_err(|error| format!("failed to resize companion speech window: {error}"))?;

    window
        .set_position(PhysicalPosition::new(
            resolved.x.round() as i32,
            resolved.y.round() as i32,
        ))
        .map_err(|error| format!("failed to reposition companion speech window: {error}"))?;

    update_speech_state(|stored| {
        stored.placement = resolved.placement;
    })?;

    if previous != resolved.placement {
        emit_speech_placement(app, resolved.placement)?;
    }

    if show_window {
        window
            .show()
            .map_err(|error| format!("failed to show companion speech window: {error}"))?;
    }

    Ok(resolved.placement)
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
    )?;

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

    let placement = apply_companion_speech_bounds(
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
            placement,
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

    let _ = apply_companion_speech_bounds(
        &app,
        state.anchor_x,
        state.anchor_y,
        width,
        height,
        true,
    )?;

    Ok(())
}
