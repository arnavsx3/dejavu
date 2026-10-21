//! Application types shared by the desktop and HTTP adapters.
//!
//! Keep filesystem, networking, and UI concerns outside this crate.

mod note;

pub use note::{MAX_NOTE_CHARACTERS, NoteError, TextNote};
use serde::Serialize;

/// Public application metadata, shared across transports.
#[derive(Debug, Clone, Copy, Serialize)]
pub struct AppInfo {
    pub name: &'static str,
    pub version: &'static str,
    pub tagline: &'static str,
}

impl AppInfo {
    pub const fn current() -> Self {
        Self {
            name: "dejavu",
            version: env!("CARGO_PKG_VERSION"),
            tagline: "Little things, felt again.",
        }
    }
}
