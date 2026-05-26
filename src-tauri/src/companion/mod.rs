use serde::Serialize;
use tauri::window::Color;
use tauri::{AppHandle, Manager, PhysicalPosition, WebviewUrl, WebviewWindowBuilder};

pub const SPRITE_WIDTH: f64 = 128.0;
pub const SPRITE_HEIGHT: f64 = 128.0;
pub const ANCHOR_X: f64 = 64.0;
pub const ANCHOR_Y: f64 = 128.0;

#[derive(Debug, Clone, Serialize)]
pub struct WorkArea {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitorWorkArea {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopBounds {
    pub monitors: Vec<MonitorWorkArea>,
    pub virtual_left: i32,
    pub virtual_top: i32,
    pub virtual_width: u32,
    pub virtual_height: u32,
}

fn build_desktop_bounds(monitors: Vec<MonitorWorkArea>) -> DesktopBounds {
    if monitors.is_empty() {
        return DesktopBounds {
            monitors,
            virtual_left: 0,
            virtual_top: 0,
            virtual_width: 1920,
            virtual_height: 1080,
        };
    }

    let virtual_left = monitors.iter().map(|monitor| monitor.x).min().unwrap_or(0);
    let virtual_top = monitors.iter().map(|monitor| monitor.y).min().unwrap_or(0);
    let virtual_right = monitors
        .iter()
        .map(|monitor| monitor.x + monitor.width as i32)
        .max()
        .unwrap_or(0);
    let virtual_bottom = monitors
        .iter()
        .map(|monitor| monitor.y + monitor.height as i32)
        .max()
        .unwrap_or(0);

    DesktopBounds {
        monitors,
        virtual_left,
        virtual_top,
        virtual_width: (virtual_right - virtual_left) as u32,
        virtual_height: (virtual_bottom - virtual_top) as u32,
    }
}

#[cfg(windows)]
fn query_desktop_bounds() -> Result<DesktopBounds, String> {
    use std::sync::Mutex;
    use windows::Win32::Foundation::{BOOL, LPARAM, RECT, TRUE};
    use windows::Win32::Graphics::Gdi::{
        EnumDisplayMonitors, GetMonitorInfoW, HDC, HMONITOR, MONITORINFO,
    };

    static MONITOR_LIST: Mutex<Vec<MonitorWorkArea>> = Mutex::new(Vec::new());

    unsafe extern "system" fn monitor_enum_proc(
        monitor: HMONITOR,
        _device_context: HDC,
        _clip_area: *mut RECT,
        _data: LPARAM,
    ) -> BOOL {
        let mut info = MONITORINFO {
            cbSize: std::mem::size_of::<MONITORINFO>() as u32,
            ..Default::default()
        };

        if !GetMonitorInfoW(monitor, &mut info).as_bool() {
            return TRUE;
        }

        let work_area = info.rcWork;

        if let Ok(mut monitors) = MONITOR_LIST.lock() {
            monitors.push(MonitorWorkArea {
                x: work_area.left,
                y: work_area.top,
                width: (work_area.right - work_area.left) as u32,
                height: (work_area.bottom - work_area.top) as u32,
            });
        }

        TRUE
    }

    {
        let mut monitors = MONITOR_LIST
            .lock()
            .map_err(|error| format!("failed to lock monitor list: {error}"))?;
        monitors.clear();
    }

    unsafe {
        if !EnumDisplayMonitors(None, None, Some(monitor_enum_proc), LPARAM(0)).as_bool() {
            return Err("failed to enumerate monitors".to_string());
        }
    }

    let monitors = MONITOR_LIST
        .lock()
        .map_err(|error| format!("failed to read monitor list: {error}"))?
        .clone();

    Ok(build_desktop_bounds(monitors))
}

#[cfg(windows)]
fn query_work_area() -> Result<WorkArea, String> {
    let bounds = query_desktop_bounds()?;
    let primary = bounds
        .monitors
        .first()
        .cloned()
        .ok_or_else(|| "no monitors found".to_string())?;

    Ok(WorkArea {
        x: primary.x,
        y: primary.y,
        width: primary.width,
        height: primary.height,
    })
}

#[cfg(not(windows))]
fn query_desktop_bounds() -> Result<DesktopBounds, String> {
    Ok(build_desktop_bounds(vec![MonitorWorkArea {
        x: 0,
        y: 0,
        width: 1920,
        height: 1040,
    }]))
}

#[cfg(not(windows))]
fn query_work_area() -> Result<WorkArea, String> {
    Ok(WorkArea {
        x: 0,
        y: 0,
        width: 1920,
        height: 1040,
    })
}

#[tauri::command]
pub fn get_work_area() -> Result<WorkArea, String> {
    query_work_area()
}

#[tauri::command]
pub fn get_desktop_bounds() -> Result<DesktopBounds, String> {
    query_desktop_bounds()
}

#[tauri::command]
pub fn set_companion_position(app: AppHandle, x: f64, y: f64) -> Result<(), String> {
    let window = app
        .get_webview_window("companion")
        .ok_or_else(|| "companion window not found".to_string())?;

    let window_x = x - ANCHOR_X;
    let window_y = y - ANCHOR_Y;

    window
        .set_position(PhysicalPosition::new(window_x as i32, window_y as i32))
        .map_err(|error| format!("failed to move companion window: {error}"))
}

pub fn create_companion_window(app: &AppHandle) -> Result<(), String> {
    if app.get_webview_window("companion").is_some() {
        return Ok(());
    }

    let bounds = query_desktop_bounds()?;
    let rightmost = bounds
        .monitors
        .iter()
        .max_by_key(|monitor| monitor.x + monitor.width as i32)
        .ok_or_else(|| "no monitors found".to_string())?;

    let start_x = rightmost.x as f64 + rightmost.width as f64 - ANCHOR_X;
    let start_y = rightmost.y as f64 + rightmost.height as f64;
    let window_x = start_x - ANCHOR_X;
    let window_y = start_y - ANCHOR_Y;

    let companion_window = WebviewWindowBuilder::new(app, "companion", WebviewUrl::default())
        .title("Companion")
        .inner_size(SPRITE_WIDTH, SPRITE_HEIGHT)
        .position(window_x, window_y)
        .decorations(false)
        .transparent(true)
        // shadows break transparency on windows and show as a grey box around the sprite
        .shadow(false)
        .background_color(Color(0, 0, 0, 0))
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .focused(false)
        .visible(true)
        .build()
        .map_err(|error| format!("failed to create companion window: {error}"))?;

    let _ = companion_window;

    Ok(())
}
