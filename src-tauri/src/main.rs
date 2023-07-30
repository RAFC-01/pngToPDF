// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::fs;
use tauri::WindowEvent;

#[tauri::command]
fn save_pdf(pdf: Vec<u8>, name: String) {
    let path = format!("C:/Users/Admin/Desktop/{}.pdf", name);
    if let Err(e) = std::fs::write(&path, pdf) {
        eprintln!("Error saving PDF file: {}", e);
    }
}

#[tauri::command]
fn list_files_in_dir(dir_path: &str) -> Vec<String> {
    let file_list = fs::read_dir(dir_path)
        .unwrap()
        .map(|entry| entry.unwrap().file_name().to_string_lossy().to_string())
        .collect();
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
