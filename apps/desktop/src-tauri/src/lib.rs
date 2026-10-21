//! Native desktop adapter. Keep application rules in `dejavu-core`.

use dejavu_core::AppInfo;
use tauri::Manager;

mod moments;
mod photos;

#[tauri::command]
fn app_info() -> AppInfo {
    AppInfo::current()
}

pub fn run() -> tauri::Result<()> {
    tauri::Builder::default()
        .setup(|app| {
            let database = app.path().app_data_dir()?.join("moments.sqlite3");
            app.manage(moments::StorePath(database));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            app_info,
            moments::list_moments,
            moments::create_moment,
            moments::update_moment,
            moments::delete_moment,
            moments::save_photo_moment,
            moments::read_photo,
        ])
        .run(tauri::generate_context!())
}
