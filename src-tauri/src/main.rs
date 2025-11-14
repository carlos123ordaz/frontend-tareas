#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use device_query::{DeviceQuery, DeviceState};
use std::thread;
use std::time::{Duration, Instant};
use tauri::Emitter;
use tauri::{AppHandle, Manager};

#[tauri::command]
fn force_close(_app: AppHandle) {
    std::process::exit(0);
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![force_close])
        .setup(|app| {
            let app_handle = app.handle().clone();
            let app_handle_thread = app_handle.clone();
            let main_window = app.get_webview_window("main").unwrap();

            let app_handle_close = app_handle.clone();
            main_window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = app_handle_close.emit("confirm_close", {});
                }
            });

            thread::spawn(move || {
                let device_state = DeviceState::new();
                let mut last_mouse = device_state.get_mouse().coords;
                let mut last_activity = Instant::now();
                let mut is_active = true;
                loop {
                    let mouse = device_state.get_mouse().coords;
                    if mouse != last_mouse {
                        last_mouse = mouse;
                        last_activity = Instant::now();
                        if !is_active {
                            is_active = true;
                        }
                    }
                    if is_active && last_activity.elapsed() > Duration::from_secs(300) {
                        is_active = false;
                        app_handle_thread.emit("user_inactive", "true").unwrap();
                    }
                    thread::sleep(Duration::from_millis(30000));
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
