use crate::main_window::show_dashboard;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle,
};

const TRAY_ID: &str = "main-tray";
const MENU_SHOW: &str = "show";
const MENU_QUIT: &str = "quit";

pub fn create_tray(app: &AppHandle) -> Result<(), String> {
    let show = MenuItem::with_id(app, MENU_SHOW, "Show Dashboard", true, None::<&str>)
        .map_err(|error| format!("failed to create show menu item: {error}"))?;
    let quit = MenuItem::with_id(app, MENU_QUIT, "Quit", true, None::<&str>)
        .map_err(|error| format!("failed to create quit menu item: {error}"))?;

    let menu = Menu::with_items(app, &[&show, &quit])
        .map_err(|error| format!("failed to create tray menu: {error}"))?;

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(tauri::include_image!("icons/32x32.png"))
        .tooltip("AI Focus Companion")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().as_ref() {
            MENU_SHOW => show_dashboard(app),
            MENU_QUIT => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)
        .map_err(|error| format!("failed to create tray icon: {error}"))?;

    Ok(())
}
