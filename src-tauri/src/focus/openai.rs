use super::capture::MonitorCapture;
use serde::{Deserialize, Serialize};
use serde_json::json;

const OPENAI_CHAT_URL: &str = "https://api.openai.com/v1/chat/completions";
const VISION_MODEL: &str = "gpt-4o-mini";

const SYSTEM_PROMPT: &str = "You observe the user's desktop screenshots. Describe what they appear to be doing across all visible monitors in 1-2 short casual sentences, like a friend noticing out loud. Mention specific apps, sites, or tasks when visible. No emojis. No quotation marks. Stay under 35 words.";

pub async fn describe_screen_activity(captures: &[MonitorCapture]) -> Result<String, String> {
    let api_key = std::env::var("OPENAI_API_KEY")
        .map_err(|_| "OPENAI_API_KEY is missing — add it to .env.local in the project root".to_string())?;

    let mut user_content = Vec::new();
    user_content.push(json!({
        "type": "text",
        "text": format!(
            "These are {} separate monitor screenshots from the user's desktop. Describe what they're doing overall.",
            captures.len()
        )
    }));

    for capture in captures {
        user_content.push(json!({
            "type": "text",
            "text": format!("{}:", capture.label)
        }));
        user_content.push(json!({
            "type": "image_url",
            "image_url": {
                "url": format!("data:image/jpeg;base64,{}", capture.jpeg_base64),
                "detail": "low"
            }
        }));
    }

    let request_body = ChatCompletionRequest {
        model: VISION_MODEL.to_string(),
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: ChatCompletionContent::Text(SYSTEM_PROMPT.to_string()),
            },
            ChatMessage {
                role: "user".to_string(),
                content: ChatCompletionContent::Parts(user_content),
            },
        ],
        max_tokens: 120,
        temperature: 0.4,
    };

    let client = reqwest::Client::new();
    let response = client
        .post(OPENAI_CHAT_URL)
        .bearer_auth(api_key)
        .json(&request_body)
        .send()
        .await
        .map_err(|error| format!("openai request failed: {error}"))?;

    let status = response.status();
    let response_body = response
        .text()
        .await
        .map_err(|error| format!("failed to read openai response: {error}"))?;

    if !status.is_success() {
        return Err(parse_openai_error(status.as_u16(), &response_body));
    }

    let parsed: ChatCompletionResponse = serde_json::from_str(&response_body)
        .map_err(|error| format!("failed to parse openai response: {error}"))?;

    let description = parsed
        .choices
        .into_iter()
        .next()
        .and_then(|choice| choice.message.content)
        .map(|text| text.trim().to_string())
        .filter(|text| !text.is_empty())
        .ok_or_else(|| "openai returned an empty description".to_string())?;

    Ok(description)
}

fn parse_openai_error(status: u16, response_body: &str) -> String {
    if let Ok(parsed) = serde_json::from_str::<OpenAiErrorResponse>(response_body) {
        if parsed.error.code.as_deref() == Some("insufficient_quota")
            || parsed.error.error_type.as_deref() == Some("insufficient_quota")
        {
            return "OpenAI account has no quota — add a payment method and credits at platform.openai.com/settings/organization/billing".to_string();
        }

        if !parsed.error.message.is_empty() {
            return format!("OpenAI error ({status}): {}", parsed.error.message);
        }
    }

    format!("OpenAI error ({status}): {response_body}")
}

#[derive(Debug, Deserialize)]
struct OpenAiErrorResponse {
    error: OpenAiErrorBody,
}

#[derive(Debug, Deserialize)]
struct OpenAiErrorBody {
    message: String,
    #[serde(rename = "type")]
    error_type: Option<String>,
    code: Option<String>,
}

#[derive(Debug, Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    max_tokens: u32,
    temperature: f32,
}

#[derive(Debug, Serialize)]
struct ChatMessage {
    role: String,
    content: ChatCompletionContent,
}

#[derive(Debug, Serialize)]
#[serde(untagged)]
enum ChatCompletionContent {
    Text(String),
    Parts(Vec<serde_json::Value>),
}

#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<ChatCompletionChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionChoice {
    message: ChatCompletionResponseMessage,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionResponseMessage {
    content: Option<String>,
}
