use base64::{engine::general_purpose::STANDARD, Engine as _};
use image::codecs::jpeg::JpegEncoder;
use image::imageops::FilterType;
use image::DynamicImage;
use xcap::Monitor;

const MAX_CAPTURE_WIDTH: u32 = 1280;
const JPEG_QUALITY: u8 = 75;

pub struct MonitorCapture {
    pub label: String,
    pub jpeg_base64: String,
}

pub fn capture_all_monitors() -> Result<Vec<MonitorCapture>, String> {
    let mut monitors = Monitor::all().map_err(|error| format!("failed to list monitors: {error}"))?;

    monitors.sort_by_key(|monitor| (monitor.x(), monitor.y()));

    let monitor_count = monitors.len();
    let mut captures = Vec::with_capacity(monitor_count);

    for (index, monitor) in monitors.into_iter().enumerate() {
        let label = build_monitor_label(index, monitor_count);
        let image = monitor
            .capture_image()
            .map_err(|error| format!("failed to capture {label}: {error}"))?;
        let jpeg_base64 = encode_monitor_image(&image)?;

        captures.push(MonitorCapture { label, jpeg_base64 });
    }

    Ok(captures)
}

fn build_monitor_label(index: usize, total: usize) -> String {
    match total {
        1 => "monitor".to_string(),
        2 if index == 0 => "left monitor".to_string(),
        2 => "right monitor".to_string(),
        3 if index == 0 => "left monitor".to_string(),
        3 if index == 1 => "center monitor".to_string(),
        3 => "right monitor".to_string(),
        _ => format!("monitor {}", index + 1),
    }
}

fn encode_monitor_image(image: &xcap::image::RgbaImage) -> Result<String, String> {
    let rgba_image =
        image::RgbaImage::from_raw(image.width(), image.height(), image.as_raw().to_vec())
            .ok_or_else(|| "failed to build image buffer from monitor capture".to_string())?;

    let mut dynamic_image = DynamicImage::ImageRgba8(rgba_image);

    if dynamic_image.width() > MAX_CAPTURE_WIDTH {
        let scale = MAX_CAPTURE_WIDTH as f32 / dynamic_image.width() as f32;
        let new_height = (dynamic_image.height() as f32 * scale).round().max(1.0) as u32;
        dynamic_image = dynamic_image.resize(MAX_CAPTURE_WIDTH, new_height, FilterType::Triangle);
    }

    // jpeg doesn't support alpha — strip to rgb before encoding
    let rgb_image = dynamic_image.to_rgb8();

    let mut jpeg_bytes = Vec::new();
    let mut encoder = JpegEncoder::new_with_quality(&mut jpeg_bytes, JPEG_QUALITY);
    encoder
        .encode(
            rgb_image.as_raw(),
            rgb_image.width(),
            rgb_image.height(),
            image::ExtendedColorType::Rgb8,
        )
        .map_err(|error| format!("failed to encode screenshot as jpeg: {error}"))?;

    Ok(STANDARD.encode(jpeg_bytes))
}
