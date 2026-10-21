use axum::{
    body::{Body, to_bytes},
    http::{Method, Request, StatusCode},
};
use serde_json::Value;
use tower::ServiceExt;

#[tokio::test]
async fn health_reports_application_metadata() -> Result<(), Box<dyn std::error::Error>> {
    let response = dejavu_server::router()
        .oneshot(Request::builder().uri("/api/health").body(Body::empty())?)
        .await?;

    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(response.headers()["content-type"], "application/json");
    let body = to_bytes(response.into_body(), 4096).await?;
    let health: Value = serde_json::from_slice(&body)?;
    assert_eq!(health["status"], "ok");
    assert_eq!(health["app"]["name"], "dejavu");
    assert_eq!(health["app"]["version"], env!("CARGO_PKG_VERSION"));
    Ok(())
}

#[tokio::test]
async fn unknown_routes_return_not_found() -> Result<(), Box<dyn std::error::Error>> {
    let response = dejavu_server::router()
        .oneshot(Request::builder().uri("/api/moments").body(Body::empty())?)
        .await?;
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    Ok(())
}

#[tokio::test]
async fn health_does_not_accept_writes() -> Result<(), Box<dyn std::error::Error>> {
    let response = dejavu_server::router()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/health")
                .body(Body::empty())?,
        )
        .await?;
    assert_eq!(response.status(), StatusCode::METHOD_NOT_ALLOWED);
    Ok(())
}
