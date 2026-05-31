mod capture;
mod openai;

use capture::capture_all_monitors;
use openai::describe_screen_activity;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScreenActivityAnalysis {
    pub description: String,
}

#[tauri::command]
pub async fn analyze_screen_activity() -> Result<ScreenActivityAnalysis, String> {
    let captures = capture_all_monitors()?;

    if captures.is_empty() {
        return Err("no monitors found to capture".to_string());
    }

    let description = describe_screen_activity(&captures).await?;

    Ok(ScreenActivityAnalysis { description })
}
