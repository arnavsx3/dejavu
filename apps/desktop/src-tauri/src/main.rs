#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if let Err(error) = dejavu_desktop_lib::run() {
        eprintln!("dejavu could not start: {error}");
        std::process::exit(1);
    }
}
