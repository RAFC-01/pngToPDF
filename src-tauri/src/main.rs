// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::fs;
use tauri::WindowEvent;
use serde_json::json;
use serde_json::Value;


#[tauri::command]
fn save_pdf(pdf: Vec<u8>, path: String) {
    let path = format!("{}.pdf", path);
    if let Err(e) = std::fs::write(&path, pdf) {
        eprintln!("Error saving to PATH: {}", e);
    }
}

#[tauri::command]
fn list_files_in_dir(dir_path: &str) -> Vec<Value> {
    let mut file_list = Vec::new();

    for entry in fs::read_dir(dir_path).unwrap() {
        let entry = entry.unwrap();
        let file_name = entry.file_name().to_string_lossy().to_string();
        if !entry.file_type().unwrap().is_symlink() {
            // Convert FileEntry struct to JSON value
            let json_value = json!({
                "name": file_name,
                "isDir": entry.file_type().unwrap().is_dir()
            });

            file_list.push(json_value);
        }
    }

    file_list
}

fn main() {
    tauri::Builder::default()
    // make window resize smoother
    .on_window_event(|e| {
        if let WindowEvent::Resized(_) = e.event() {
            std::thread::sleep(std::time::Duration::from_nanos(1));
        }
    })
    .invoke_handler(tauri::generate_handler![list_files_in_dir, save_pdf])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
