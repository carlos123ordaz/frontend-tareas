#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use device_query::{DeviceQuery, DeviceState};
use std::thread;
use std::time::{Duration, Instant};
use tauri::Emitter;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
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
                        app_handle.emit("user_inactive", "true").unwrap();
                    }
                    thread::sleep(Duration::from_millis(30000));
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
