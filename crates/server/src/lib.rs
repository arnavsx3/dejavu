//! The local HTTP adapter. Domain rules belong in `dejavu-core`.

use axum::{Json, Router, routing::get};
use dejavu_core::AppInfo;
use serde::Serialize;

/// Build the router independently from its listener so it can be tested in process.
pub fn router() -> Router {
    Router::new().route("/api/health", get(health))
}

#[derive(Debug, Serialize)]
struct Health {
    status: &'static str,
    app: AppInfo,
}

async fn health() -> Json<Health> {
    Json(Health {
        status: "ok",
        app: AppInfo::current(),
    })
}
