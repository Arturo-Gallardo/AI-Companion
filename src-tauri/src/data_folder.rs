use std::path::Path;
use std::process::Command;

use tauri::{AppHandle, Manager};

fn open_in_file_manager(path: &Path) -> Result<(), String> {
    let path_string = path
        .to_str()
        .ok_or_else(|| "characters folder path is not valid utf-8".to_string())?
        .to_string();

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&path_string)
            .spawn()
            .map_err(|error| format!("failed to open folder in explorer: {error}"))?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path_string)
            .spawn()
            .map_err(|error| format!("failed to open folder in finder: {error}"))?;
        return Ok(());
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path_string)
            .spawn()
            .map_err(|error| format!("failed to open folder: {error}"))?;
        return Ok(());
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        let _ = path_string;
        Err("opening folders is not supported on this platform".to_string())
    }
}

#[tauri::command]
pub fn open_characters_folder(app: AppHandle) -> Result<(), String> {
    let characters_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data dir: {error}"))?
        .join("characters");

    std::fs::create_dir_all(&characters_dir)
        .map_err(|error| format!("failed to create characters folder: {error}"))?;

    open_in_file_manager(&characters_dir)
}
