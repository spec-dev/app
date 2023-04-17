#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use cocoa::appkit::{NSWindow, NSWindowStyleMask};
use tauri::{Manager, Runtime, Window};
// use app::{start_listening};
// use tauri::api::process::{Command};
// use std::collections::HashMap;

pub trait WindowExt {
    #[cfg(target_os = "macos")]
    fn set_transparent_titlebar(&self, transparent: bool);
}

impl<R: Runtime> WindowExt for Window<R> {
    #[cfg(target_os = "macos")]
    fn set_transparent_titlebar(&self, transparent: bool) {
        use cocoa::appkit::NSWindowTitleVisibility;

        unsafe {
            let id = self.ns_window().unwrap() as cocoa::base::id;

            let mut style_mask = id.styleMask();
            style_mask.set(
                NSWindowStyleMask::NSFullSizeContentViewWindowMask,
                transparent,
                );
            id.setStyleMask_(style_mask);

            id.setTitleVisibility_(if transparent {
                NSWindowTitleVisibility::NSWindowTitleHidden
            } else {
                NSWindowTitleVisibility::NSWindowTitleVisible
            });
            id.setTitlebarAppearsTransparent_(if transparent {
                cocoa::base::YES
            } else {
                cocoa::base::NO
            });
        }
    }
}

// #[tauri::command]
// async fn listen(window: tauri::Window, url: &str) -> Result<(), String> {
//     let _ = start_listening(window, &url).await;
//     Ok(())
// } 

// #[tauri::command]
// fn new_spec_client(
//     config_dir: &str,
//     db_user: &str,
//     db_password: &str,
//     db_host: &str,
//     db_port: &str,
//     db_name: &str,
//     project_id: &str,
//     project_api_key: &str,
// ) -> u32 {
//     // Environment Variables.
//     let mut envs = HashMap::new();
//     envs.insert(String::from("SPEC_CONFIG_DIR"), String::from(config_dir));
//     envs.insert(String::from("DB_USER"), String::from(db_user));
//     envs.insert(String::from("DB_PASSWORD"), String::from(db_password));
//     envs.insert(String::from("DB_HOST"), String::from(db_host));
//     envs.insert(String::from("DB_PORT"), String::from(db_port));
//     envs.insert(String::from("DB_NAME"), String::from(db_name));
//     envs.insert(String::from("PROJECT_ID"), String::from(project_id));
//     envs.insert(String::from("PROJECT_API_KEY"), String::from(project_api_key));
//     envs.insert(String::from("STREAM_LOGS"), String::from("local"));
//     envs.insert(String::from("FORCE_COLOR"), String::from("true"));
//     envs.insert(String::from("DEBUG"), String::from("true"));

//     // Create new sidecar running the spec client.
//     let (_rx, child) = Command::new_sidecar("spec-client")
//         .expect("failed to create `spec-client` binary command")
//         .envs(envs)
//         .spawn()
//         .expect("Failed to spawn spec-client");
//     child.pid()
// }

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let win = app.get_window("main").unwrap();
            win.set_transparent_titlebar(true);
            Ok(())
        })
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs_watch::init())
        // .invoke_handler(tauri::generate_handler![listen, new_spec_client])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
