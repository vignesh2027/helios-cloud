use anyhow::Result;
use prometheus::{
    register_gauge_vec, register_histogram_vec, register_int_counter_vec, register_int_gauge_vec,
    Encoder, GaugeVec, HistogramVec, IntCounterVec, IntGaugeVec, TextEncoder,
};
use std::sync::OnceLock;

static RESOURCES_TOTAL: OnceLock<IntGaugeVec> = OnceLock::new();
static SCAN_DURATION_SECONDS: OnceLock<HistogramVec> = OnceLock::new();
static SCAN_ERRORS_TOTAL: OnceLock<IntCounterVec> = OnceLock::new();
static MONTHLY_COST_USD: OnceLock<GaugeVec> = OnceLock::new();
static DRIFT_RESOURCES_TOTAL: OnceLock<IntGaugeVec> = OnceLock::new();
static POLICY_VIOLATIONS_TOTAL: OnceLock<IntGaugeVec> = OnceLock::new();
static CPU_UTILIZATION_PERCENT: OnceLock<GaugeVec> = OnceLock::new();
static SAVINGS_POTENTIAL_USD: OnceLock<GaugeVec> = OnceLock::new();

pub fn init_metrics() {
    RESOURCES_TOTAL.get_or_init(|| {
        register_int_gauge_vec!(
            "helios_resources_total",
            "Total number of discovered cloud resources",
            &["provider", "region", "resource_type", "status"]
        )
        .unwrap()
    });

    SCAN_DURATION_SECONDS.get_or_init(|| {
        register_histogram_vec!(
            "helios_scan_duration_seconds",
            "Time taken to complete an infrastructure scan",
            &["provider", "region"],
            vec![0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0]
        )
        .unwrap()
    });

    SCAN_ERRORS_TOTAL.get_or_init(|| {
        register_int_counter_vec!(
            "helios_scan_errors_total",
            "Total number of scan errors",
            &["provider", "region", "resource_type"]
        )
        .unwrap()
    });

    MONTHLY_COST_USD.get_or_init(|| {
        register_gauge_vec!(
            "helios_monthly_cost_usd",
            "Estimated monthly cost in USD",
            &["provider", "region", "resource_type"]
        )
        .unwrap()
    });

    DRIFT_RESOURCES_TOTAL.get_or_init(|| {
        register_int_gauge_vec!(
            "helios_drift_resources_total",
            "Number of resources with detected drift",
            &["severity"]
        )
        .unwrap()
    });

    POLICY_VIOLATIONS_TOTAL.get_or_init(|| {
        register_int_gauge_vec!(
            "helios_policy_violations_total",
            "Number of active policy violations",
            &["framework", "severity"]
        )
        .unwrap()
    });

    CPU_UTILIZATION_PERCENT.get_or_init(|| {
        register_gauge_vec!(
            "helios_instance_cpu_utilization_percent",
            "Average CPU utilization percentage",
            &["instance_id", "region"]
        )
        .unwrap()
    });

    SAVINGS_POTENTIAL_USD.get_or_init(|| {
        register_gauge_vec!(
            "helios_savings_potential_usd",
            "Potential monthly savings in USD",
            &["action", "resource_type"]
        )
        .unwrap()
    });
}

pub fn record_resource_count(
    provider: &str,
    region: &str,
    resource_type: &str,
    status: &str,
    count: i64,
) {
    if let Some(m) = RESOURCES_TOTAL.get() {
        m.with_label_values(&[provider, region, resource_type, status])
            .set(count);
    }
}

pub fn record_scan_duration(provider: &str, region: &str, duration_secs: f64) {
    if let Some(m) = SCAN_DURATION_SECONDS.get() {
        m.with_label_values(&[provider, region])
            .observe(duration_secs);
    }
}

pub fn record_scan_error(provider: &str, region: &str, resource_type: &str) {
    if let Some(m) = SCAN_ERRORS_TOTAL.get() {
        m.with_label_values(&[provider, region, resource_type])
            .inc();
    }
}

pub fn record_monthly_cost(provider: &str, region: &str, resource_type: &str, cost_usd: f64) {
    if let Some(m) = MONTHLY_COST_USD.get() {
        m.with_label_values(&[provider, region, resource_type])
            .set(cost_usd);
    }
}

pub fn record_drift(severity: &str, count: i64) {
    if let Some(m) = DRIFT_RESOURCES_TOTAL.get() {
        m.with_label_values(&[severity]).set(count);
    }
}

pub fn record_violations(framework: &str, severity: &str, count: i64) {
    if let Some(m) = POLICY_VIOLATIONS_TOTAL.get() {
        m.with_label_values(&[framework, severity]).set(count);
    }
}

pub fn record_cpu_utilization(instance_id: &str, region: &str, percent: f64) {
    if let Some(m) = CPU_UTILIZATION_PERCENT.get() {
        m.with_label_values(&[instance_id, region]).set(percent);
    }
}

pub fn record_savings_potential(action: &str, resource_type: &str, usd: f64) {
    if let Some(m) = SAVINGS_POTENTIAL_USD.get() {
        m.with_label_values(&[action, resource_type]).set(usd);
    }
}

pub fn render_metrics() -> Result<String> {
    let encoder = TextEncoder::new();
    let metric_families = prometheus::gather();
    let mut buffer = Vec::new();
    encoder.encode(&metric_families, &mut buffer)?;
    Ok(String::from_utf8(buffer)?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn metrics_render_without_panic() {
        init_metrics();
        record_resource_count("aws", "us-east-1", "ec2:instance", "active", 42);
        record_scan_duration("aws", "us-east-1", 3.2);
        record_monthly_cost("aws", "us-east-1", "ec2:instance", 1234.56);
        record_drift("critical", 2);
        record_violations("cis-aws-1.5", "high", 5);
        record_savings_potential("rightsize", "ec2:instance", 207.36);

        let output = render_metrics().unwrap();
        assert!(output.contains("helios_resources_total"));
        assert!(output.contains("helios_monthly_cost_usd"));
        assert!(output.contains("helios_drift_resources_total"));
        assert!(output.contains("helios_policy_violations_total"));
        assert!(output.contains("helios_savings_potential_usd"));
    }
}
