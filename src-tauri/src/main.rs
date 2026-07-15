#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use device_query::{DeviceQuery, DeviceState};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};
use tauri::Emitter;
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, State};

#[derive(Clone, Copy)]
struct WindowSnapshot {
    width: u32,
    height: u32,
    x: i32,
    y: i32,
    resizable: bool,
    maximizable: bool,
    always_on_top: bool,
}

#[derive(Default)]
struct MiniModeState {
    previous: Mutex<Option<WindowSnapshot>>,
}

#[tauri::command]
fn force_close(_app: AppHandle) {
    std::process::exit(0);
}

#[tauri::command]
fn set_mini_mode(app: AppHandle, state: State<MiniModeState>, enabled: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "No se encontro la ventana principal".to_string())?;

    if enabled {
        let current_size = window.outer_size().map_err(|e| e.to_string())?;
        let current_position = window.outer_position().map_err(|e| e.to_string())?;
        let current_resizable = window.is_resizable().map_err(|e| e.to_string())?;
        let current_maximizable = window.is_maximizable().map_err(|e| e.to_string())?;
        let current_always_on_top = window.is_always_on_top().map_err(|e| e.to_string())?;

        let mut previous = state.previous.lock().map_err(|_| "No se pudo bloquear el estado".to_string())?;
        if previous.is_none() {
            *previous = Some(WindowSnapshot {
                width: current_size.width,
                height: current_size.height,
                x: current_position.x,
                y: current_position.y,
                resizable: current_resizable,
                maximizable: current_maximizable,
                always_on_top: current_always_on_top,
            });
        }

        window.set_resizable(false).map_err(|e| e.to_string())?;
        window.set_maximizable(false).map_err(|e| e.to_string())?;
        window.set_always_on_top(true).map_err(|e| e.to_string())?;
        window
            .set_size(tauri::Size::Physical(PhysicalSize {
                width: 240,
                height: 150,
            }))
            .map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    } else {
        let previous = {
            let mut stored = state.previous.lock().map_err(|_| "No se pudo bloquear el estado".to_string())?;
            stored.take()
        };

        if let Some(snapshot) = previous {
            window.set_resizable(snapshot.resizable).map_err(|e| e.to_string())?;
            window.set_maximizable(snapshot.maximizable).map_err(|e| e.to_string())?;
            window
                .set_size(tauri::Size::Physical(PhysicalSize {
                    width: snapshot.width,
                    height: snapshot.height,
                }))
                .map_err(|e| e.to_string())?;
            window
                .set_position(tauri::Position::Physical(PhysicalPosition {
                    x: snapshot.x,
                    y: snapshot.y,
                }))
                .map_err(|e| e.to_string())?;
            window
                .set_always_on_top(snapshot.always_on_top)
                .map_err(|e| e.to_string())?;
        } else {
            window.set_resizable(true).map_err(|e| e.to_string())?;
            window.set_maximizable(true).map_err(|e| e.to_string())?;
            window.set_always_on_top(false).map_err(|e| e.to_string())?;
            window
                .set_size(tauri::Size::Physical(PhysicalSize {
                    width: 1000,
                    height: 720,
                }))
                .map_err(|e| e.to_string())?;
        }

        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(MiniModeState::default())
        .invoke_handler(tauri::generate_handler![force_close, set_mini_mode])
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
