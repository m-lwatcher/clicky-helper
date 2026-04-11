// Tauri commands — add your AI / OS integrations here

/// Placeholder AI ask command.
/// Replace the body with a real HTTP call to OpenAI, Ollama, etc.
#[tauri::command]
pub fn ask_ai(prompt: String) -> String {
    // TODO: call an LLM API or local model
    format!("Placeholder response for: \"{prompt}\"")
}

/// Placeholder screenshot command.
/// Replace with tauri-plugin-screenshot or OS-level capture.
#[tauri::command]
pub fn capture_screenshot() -> Result<String, String> {
    // TODO: implement screenshot capture
    Err("Screenshot not yet implemented. Wire up tauri-plugin-screenshot or a system call.".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![ask_ai, capture_screenshot])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
