//! Native desktop adapter. Keep application rules in `dejavu-core`.

use dejavu_core::AppInfo;

#[tauri::command]
fn app_info() -> AppInfo {
    AppInfo::current()
}

pub fn run() -> tauri::Result<()> {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![app_info])
        .run(tauri::generate_context!())
}
