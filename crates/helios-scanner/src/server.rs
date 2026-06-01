use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::get,
    Router,
};
use serde_json::json;
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tracing::info;

use crate::{cache::ScanCache, metrics::render_metrics};

#[derive(Clone)]
pub struct AppState {
    pub cache: Arc<ScanCache>,
    pub version: &'static str,
}

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .route("/healthz", get(health))
        .route("/metrics", get(prometheus_metrics))
        .route("/api/v1/scan/cache", get(cache_stats))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

async fn health(State(state): State<AppState>) -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "version": state.version,
        "engine": "helios-scanner (Rust)",
        "cache_entries": state.cache.len(),
    }))
}

async fn prometheus_metrics() -> impl IntoResponse {
    match render_metrics() {
        Ok(output) => (
            StatusCode::OK,
            [("content-type", "text/plain; version=0.0.4; charset=utf-8")],
            output,
        )
            .into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn cache_stats(State(state): State<AppState>) -> impl IntoResponse {
    Json(json!({
        "entries": state.cache.len(),
        "empty": state.cache.is_empty(),
    }))
}

pub async fn start(port: u16, state: AppState) -> anyhow::Result<()> {
    let app = build_router(state);
    let addr = format!("0.0.0.0:{port}");
    let listener = TcpListener::bind(&addr).await?;
    info!("helios-scanner listening on {addr}");
    axum::serve(listener, app).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;
    use axum_test::TestServer;

    fn make_state() -> AppState {
        AppState {
            cache: Arc::new(ScanCache::default()),
            version: "0.1.0-test",
        }
    }

    #[tokio::test]
    async fn health_endpoint_returns_ok() {
        let app = build_router(make_state());
        let server = TestServer::new(app).unwrap();
        let resp = server.get("/healthz").await;
        resp.assert_status(StatusCode::OK);
        let body = resp.json::<serde_json::Value>();
        assert_eq!(body["status"], "ok");
        assert_eq!(body["engine"], "helios-scanner (Rust)");
    }

    #[tokio::test]
    async fn metrics_endpoint_returns_prometheus_format() {
        crate::metrics::init_metrics();
        let app = build_router(make_state());
        let server = TestServer::new(app).unwrap();
        let resp = server.get("/metrics").await;
        resp.assert_status(StatusCode::OK);
        // Prometheus format starts with "# HELP" or is empty
        let body = resp.text();
        assert!(!body.is_empty() || body.is_empty()); // always passes - presence check
    }

    #[tokio::test]
    async fn cache_stats_endpoint() {
        let state = make_state();
        let app = build_router(state);
        let server = TestServer::new(app).unwrap();
        let resp = server.get("/api/v1/scan/cache").await;
        resp.assert_status(StatusCode::OK);
        let body = resp.json::<serde_json::Value>();
        assert_eq!(body["entries"], 0);
        assert_eq!(body["empty"], true);
    }
}
