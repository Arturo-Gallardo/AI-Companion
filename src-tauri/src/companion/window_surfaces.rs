use serde::Serialize;
use std::collections::HashSet;
use std::sync::{LazyLock, Mutex};
use tauri::Manager;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowSurface {
    pub hwnd: isize,
    pub left: i32,
    pub right: i32,
    pub top: i32,
    pub bottom: i32,
    pub title_bar_bottom: i32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum WindowWallSide {
    Left,
    Right,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowWallHit {
    pub hwnd: isize,
    pub left: i32,
    pub right: i32,
    pub top: i32,
    pub bottom: i32,
    pub side: WindowWallSide,
}

static EXCLUDED_HWNDS: LazyLock<Mutex<HashSet<isize>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));

const MIN_SURFACE_WIDTH: i32 = 200;
const MIN_SURFACE_HEIGHT: i32 = 80;
const TITLE_BAR_BAND_MIN: i32 = 8;
const TITLE_BAR_BAND_MAX: i32 = 48;
// magnet zone around the title bar — larger below so you can snap from under the bar
const HIT_TOLERANCE_X: i32 = 32;
const HIT_TOLERANCE_Y_ABOVE: i32 = 24;
const HIT_TOLERANCE_Y_BELOW: i32 = 56;
const WALL_HIT_TOLERANCE_X: i32 = 36;
const WALL_HIT_TOLERANCE_Y: i32 = 32;
const MIN_WALL_CLIMB_HEIGHT: i32 = 160;

pub fn register_excluded_hwnd(hwnd: isize) {
    if hwnd == 0 {
        return;
    }

    if let Ok(mut excluded) = EXCLUDED_HWNDS.lock() {
        excluded.insert(hwnd);
    }
}

fn excluded_hwnds() -> std::sync::MutexGuard<'static, HashSet<isize>> {
    EXCLUDED_HWNDS
        .lock()
        .expect("excluded hwnd mutex poisoned")
}

pub fn register_excluded_hwnds_from_app(app: &tauri::AppHandle) -> Result<(), String> {
    const LABELS: [&str; 5] = [
        "main",
        "companion",
        "companion-speech",
        "companion-menu",
        "walk-picker",
    ];

    for label in LABELS {
        if let Some(window) = app.get_webview_window(label) {
            let hwnd = window
                .hwnd()
                .map_err(|error| format!("failed to read hwnd for {label}: {error}"))?;
            register_excluded_hwnd(hwnd.0 as isize);
        }
    }

    Ok(())
}

#[cfg(windows)]
fn is_excluded(hwnd: isize) -> bool {
    excluded_hwnds().contains(&hwnd)
}

#[cfg(windows)]
fn title_bar_band_height() -> i32 {
    use windows::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SM_CYFRAME, SM_CYCAPTION};

    unsafe {
        let caption = GetSystemMetrics(SM_CYCAPTION);
        let frame = GetSystemMetrics(SM_CYFRAME);
        (caption + frame).clamp(TITLE_BAR_BAND_MIN, TITLE_BAR_BAND_MAX)
    }
}

#[cfg(windows)]
fn surface_from_hwnd(hwnd: windows::Win32::Foundation::HWND) -> Option<WindowSurface> {
    use windows::Win32::Foundation::RECT;
    use windows::Win32::UI::WindowsAndMessaging::{
        GetAncestor, GetWindowLongPtrW, GetWindowRect, IsIconic, IsWindowVisible, GA_ROOT,
        GWL_EXSTYLE, GWL_STYLE, WS_CAPTION, WS_EX_TOOLWINDOW,
    };

    let hwnd_isize = hwnd.0 as isize;

    if hwnd.0.is_null() || is_excluded(hwnd_isize) {
        return None;
    }

    unsafe {
        if !IsWindowVisible(hwnd).as_bool() || IsIconic(hwnd).as_bool() {
            return None;
        }

        let root = GetAncestor(hwnd, GA_ROOT);
        if root.0.is_null() {
            return None;
        }

        if root != hwnd {
            return surface_from_hwnd(root);
        }

        let style = GetWindowLongPtrW(hwnd, GWL_STYLE) as u32;
        let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as u32;
        let has_caption = style & WS_CAPTION.0 != 0;
        let is_tool_window = ex_style & WS_EX_TOOLWINDOW.0 != 0;

        if !has_caption && is_tool_window {
            return None;
        }

        let mut rect = RECT::default();
        if GetWindowRect(hwnd, &mut rect).is_err() {
            return None;
        }

        let width = rect.right - rect.left;
        let height = rect.bottom - rect.top;

        if width < MIN_SURFACE_WIDTH || height < MIN_SURFACE_HEIGHT {
            return None;
        }

        let band = title_bar_band_height();
        let top = rect.top;
        let title_bar_bottom = top + band;

        Some(WindowSurface {
            hwnd: hwnd_isize,
            left: rect.left,
            right: rect.right,
            top,
            bottom: rect.bottom,
            title_bar_bottom,
        })
    }
}

#[cfg(windows)]
fn point_hits_surface(surface: &WindowSurface, x: f64, y: f64) -> bool {
    let x = x.round() as i32;
    let y = y.round() as i32;

    x >= surface.left - HIT_TOLERANCE_X
        && x <= surface.right + HIT_TOLERANCE_X
        && y >= surface.top - HIT_TOLERANCE_Y_ABOVE
        && y <= surface.title_bar_bottom + HIT_TOLERANCE_Y_BELOW
}

#[cfg(windows)]
fn distance_to_title_band(surface: &WindowSurface, y: i32) -> i32 {
    if y < surface.top {
        surface.top - y
    } else if y > surface.title_bar_bottom {
        y - surface.title_bar_bottom
    } else {
        0
    }
}

#[cfg(windows)]
fn find_nearby_title_bar(surfaces: &[WindowSurface], x: f64, y: f64) -> Option<WindowSurface> {
    surfaces
        .iter()
        .filter(|surface| point_hits_surface(surface, x, y))
        .min_by_key(|surface| distance_to_title_band(surface, y.round() as i32))
        .cloned()
}

#[cfg(windows)]
pub fn query_window_surfaces() -> Result<Vec<WindowSurface>, String> {
    use std::sync::Mutex as EnumMutex;
    use windows::Win32::Foundation::{BOOL, HWND, LPARAM, TRUE};
    use windows::Win32::UI::WindowsAndMessaging::EnumWindows;

    static SURFACE_LIST: EnumMutex<Vec<WindowSurface>> = EnumMutex::new(Vec::new());

    unsafe extern "system" fn enum_proc(hwnd: HWND, _: LPARAM) -> BOOL {
        if let Some(surface) = surface_from_hwnd(hwnd) {
            if let Ok(mut surfaces) = SURFACE_LIST.lock() {
                if !surfaces.iter().any(|entry| entry.hwnd == surface.hwnd) {
                    surfaces.push(surface);
                }
            }
        }

        TRUE
    }

    {
        let mut surfaces = SURFACE_LIST
            .lock()
            .map_err(|error| format!("failed to lock surface list: {error}"))?;
        surfaces.clear();
    }

    unsafe {
        if EnumWindows(Some(enum_proc), LPARAM(0)).is_err() {
            return Err("failed to enumerate windows".to_string());
        }
    }

    let surfaces = SURFACE_LIST
        .lock()
        .map_err(|error| format!("failed to read surface list: {error}"))?
        .clone();

    Ok(surfaces)
}

#[cfg(windows)]
pub fn query_hit_title_bar_at(x: f64, y: f64) -> Result<Option<WindowSurface>, String> {
    use windows::Win32::Foundation::POINT;
    use windows::Win32::UI::WindowsAndMessaging::WindowFromPoint;

    let surfaces = query_window_surfaces()?;
    let point = POINT {
        x: x.round() as i32,
        y: y.round() as i32,
    };

    unsafe {
        let hwnd = WindowFromPoint(point);
        if let Some(surface) = surface_from_hwnd(hwnd) {
            if point_hits_surface(&surface, x, y) {
                return Ok(Some(surface));
            }
        }
    }

    Ok(find_nearby_title_bar(&surfaces, x, y))
}

#[cfg(windows)]
fn point_hits_left_wall(surface: &WindowSurface, x: f64, y: f64) -> bool {
    let x = x.round() as i32;
    let y = y.round() as i32;
    let height = surface.bottom - surface.top;

    if height < MIN_WALL_CLIMB_HEIGHT {
        return false;
    }

    x >= surface.left - WALL_HIT_TOLERANCE_X
        && x <= surface.left + WALL_HIT_TOLERANCE_X
        && y >= surface.top - WALL_HIT_TOLERANCE_Y
        && y <= surface.bottom + WALL_HIT_TOLERANCE_Y
}

#[cfg(windows)]
fn point_hits_right_wall(surface: &WindowSurface, x: f64, y: f64) -> bool {
    let x = x.round() as i32;
    let y = y.round() as i32;
    let height = surface.bottom - surface.top;

    if height < MIN_WALL_CLIMB_HEIGHT {
        return false;
    }

    x >= surface.right - WALL_HIT_TOLERANCE_X
        && x <= surface.right + WALL_HIT_TOLERANCE_X
        && y >= surface.top - WALL_HIT_TOLERANCE_Y
        && y <= surface.bottom + WALL_HIT_TOLERANCE_Y
}

#[cfg(windows)]
fn distance_to_vertical_edge(surface: &WindowSurface, side: WindowWallSide, x: i32) -> i32 {
    match side {
        WindowWallSide::Left => (x - surface.left).abs(),
        WindowWallSide::Right => (x - surface.right).abs(),
    }
}

#[cfg(windows)]
fn wall_hit_from_surface(surface: &WindowSurface, side: WindowWallSide) -> WindowWallHit {
    WindowWallHit {
        hwnd: surface.hwnd,
        left: surface.left,
        right: surface.right,
        top: surface.top,
        bottom: surface.bottom,
        side,
    }
}

#[cfg(windows)]
fn find_nearby_window_wall(surfaces: &[WindowSurface], x: f64, y: f64) -> Option<WindowWallHit> {
    let x_i = x.round() as i32;

    let mut best: Option<(WindowWallHit, i32)> = None;

    for surface in surfaces {
        if point_hits_left_wall(surface, x, y) {
            let distance = distance_to_vertical_edge(surface, WindowWallSide::Left, x_i);
            let hit = wall_hit_from_surface(surface, WindowWallSide::Left);
            if best.as_ref().map(|(_, d)| distance < *d).unwrap_or(true) {
                best = Some((hit, distance));
            }
        }

        if point_hits_right_wall(surface, x, y) {
            let distance = distance_to_vertical_edge(surface, WindowWallSide::Right, x_i);
            let hit = wall_hit_from_surface(surface, WindowWallSide::Right);
            if best.as_ref().map(|(_, d)| distance < *d).unwrap_or(true) {
                best = Some((hit, distance));
            }
        }
    }

    best.map(|(hit, _)| hit)
}

#[cfg(windows)]
pub fn query_hit_window_wall_at(x: f64, y: f64) -> Result<Option<WindowWallHit>, String> {
    use windows::Win32::Foundation::POINT;
    use windows::Win32::UI::WindowsAndMessaging::WindowFromPoint;

    let surfaces = query_window_surfaces()?;
    let point = POINT {
        x: x.round() as i32,
        y: y.round() as i32,
    };

    unsafe {
        let hwnd = WindowFromPoint(point);
        if let Some(surface) = surface_from_hwnd(hwnd) {
            if point_hits_left_wall(&surface, x, y) {
                return Ok(Some(wall_hit_from_surface(&surface, WindowWallSide::Left)));
            }

            if point_hits_right_wall(&surface, x, y) {
                return Ok(Some(wall_hit_from_surface(&surface, WindowWallSide::Right)));
            }
        }
    }

    Ok(find_nearby_window_wall(&surfaces, x, y))
}

#[cfg(not(windows))]
pub fn query_hit_window_wall_at(_x: f64, _y: f64) -> Result<Option<WindowWallHit>, String> {
    Ok(None)
}

#[cfg(not(windows))]
pub fn query_hit_title_bar_at(_x: f64, _y: f64) -> Result<Option<WindowSurface>, String> {
    Ok(None)
}

#[cfg(not(windows))]
pub fn query_window_surfaces() -> Result<Vec<WindowSurface>, String> {
    Ok(Vec::new())
}

#[tauri::command]
pub fn hit_window_wall_at(x: f64, y: f64) -> Result<Option<WindowWallHit>, String> {
    query_hit_window_wall_at(x, y)
}

#[tauri::command]
pub fn get_window_surfaces() -> Result<Vec<WindowSurface>, String> {
    query_window_surfaces()
}

#[tauri::command]
pub fn hit_title_bar_at(x: f64, y: f64) -> Result<Option<WindowSurface>, String> {
    query_hit_title_bar_at(x, y)
}
