//! helios-scanner: High-performance cloud resource scanner and metrics collector
//!
//! Built in Rust for sub-second scan latency and minimal memory footprint.
//! Exposes a Prometheus /metrics endpoint and a JSON HTTP API compatible
//! with the HELIOS platform.

pub mod aws;
pub mod cache;
pub mod metrics;
pub mod models;
pub mod server;

pub use models::{MetricsSnapshot, Resource, ResourceStatus, ScanResult};
