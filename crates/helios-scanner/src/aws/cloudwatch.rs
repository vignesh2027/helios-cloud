use anyhow::Result;
use aws_sdk_cloudwatch::{
    types::{Dimension, Metric, MetricDataQuery, MetricStat, Statistic},
    Client,
};
use chrono::{Duration, Utc};
use tracing::warn;

use crate::models::MetricsSnapshot;

const CPU_NAMESPACE: &str = "AWS/EC2";
const CPU_METRIC: &str = "CPUUtilization";
const LOOKBACK_DAYS: i64 = 14;
const PERIOD_SECONDS: i32 = 3600; // 1-hour resolution

pub async fn get_instance_metrics(
    client: &Client,
    instance_id: &str,
    region: &str,
) -> Result<MetricsSnapshot> {
    let end_time = Utc::now();
    let start_time = end_time - Duration::days(LOOKBACK_DAYS);

    let dimension = Dimension::builder()
        .name("InstanceId")
        .value(instance_id)
        .build();

    let metric = Metric::builder()
        .namespace(CPU_NAMESPACE)
        .metric_name(CPU_METRIC)
        .dimensions(dimension)
        .build();

    let stat = MetricStat::builder()
        .metric(metric)
        .period(PERIOD_SECONDS)
        .stat(Statistic::Average.as_str())
        .build();

    let query = MetricDataQuery::builder()
        .id("cpu_avg")
        .metric_stat(stat)
        .return_data(true)
        .build();

    let resp = client
        .get_metric_data()
        .metric_data_queries(query)
        .start_time(
            aws_sdk_cloudwatch::primitives::DateTime::from_secs(start_time.timestamp()),
        )
        .end_time(
            aws_sdk_cloudwatch::primitives::DateTime::from_secs(end_time.timestamp()),
        )
        .send()
        .await;

    match resp {
        Err(e) => {
            warn!("CloudWatch query failed for {instance_id}: {e}");
            Ok(MetricsSnapshot {
                instance_id: instance_id.to_string(),
                region: region.to_string(),
                collected_at: Utc::now(),
                avg_cpu_percent: 0.0,
                max_cpu_percent: 0.0,
                avg_memory_percent: None,
                avg_network_in_mbps: 0.0,
                avg_network_out_mbps: 0.0,
                avg_disk_read_iops: 0.0,
                avg_disk_write_iops: 0.0,
                idle_days: 0,
            })
        }
        Ok(data) => {
            let values: Vec<f64> = data
                .metric_data_results()
                .iter()
                .flat_map(|r| r.values())
                .copied()
                .collect();

            let avg_cpu = if values.is_empty() {
                0.0
            } else {
                values.iter().sum::<f64>() / values.len() as f64
            };

            let max_cpu = values.iter().cloned().fold(f64::NAN, f64::max);
            let max_cpu = if max_cpu.is_nan() { 0.0 } else { max_cpu };

            // Count idle days: hours with CPU < 1% → approximate idle days
            let idle_hours = values.iter().filter(|&&v| v < 1.0).count();
            let idle_days = (idle_hours / 24) as u32;

            Ok(MetricsSnapshot {
                instance_id: instance_id.to_string(),
                region: region.to_string(),
                collected_at: Utc::now(),
                avg_cpu_percent: (avg_cpu * 100.0).round() / 100.0,
                max_cpu_percent: (max_cpu * 100.0).round() / 100.0,
                avg_memory_percent: None, // Requires CloudWatch agent
                avg_network_in_mbps: 0.0,
                avg_network_out_mbps: 0.0,
                avg_disk_read_iops: 0.0,
                avg_disk_write_iops: 0.0,
                idle_days,
            })
        }
    }
}

/// Batch-fetches metrics for multiple instances concurrently.
pub async fn get_batch_metrics(
    client: &Client,
    instance_ids: &[String],
    region: &str,
) -> Vec<MetricsSnapshot> {
    let futs = instance_ids.iter().map(|id| {
        let client = client.clone();
        let id = id.clone();
        let region = region.to_string();
        async move { get_instance_metrics(&client, &id, &region).await }
    });

    let results = futures::future::join_all(futs).await;
    results.into_iter().filter_map(|r| r.ok()).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn idle_days_calculation() {
        // 48 hours below 1% CPU → 2 idle days
        let values: Vec<f64> = vec![0.1; 48];
        let idle_hours = values.iter().filter(|&&v| v < 1.0).count();
        let idle_days = (idle_hours / 24) as u32;
        assert_eq!(idle_days, 2);
    }

    #[test]
    fn avg_cpu_calculation() {
        let values = vec![10.0, 20.0, 30.0, 40.0];
        let avg = values.iter().sum::<f64>() / values.len() as f64;
        assert_eq!(avg, 25.0);
    }

    #[test]
    fn max_cpu_calculation() {
        let values = vec![10.0, 95.0, 30.0, 40.0];
        let max = values.iter().cloned().fold(f64::NAN, f64::max);
        assert_eq!(max, 95.0);
    }
}
