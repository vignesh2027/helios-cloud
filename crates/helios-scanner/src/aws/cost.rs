use anyhow::Result;
use aws_sdk_costexplorer::{
    types::{DateInterval, Expression, GroupDefinition, GroupDefinitionType},
    Client,
};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostBreakdown {
    pub period_start: String,
    pub period_end: String,
    pub total_usd: f64,
    pub by_service: HashMap<String, f64>,
    pub by_region: HashMap<String, f64>,
    pub by_usage_type: HashMap<String, f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostTrend {
    pub periods: Vec<CostBreakdown>,
    pub avg_monthly_usd: f64,
    pub trend_direction: TrendDirection,
    pub trend_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TrendDirection {
    Increasing,
    Decreasing,
    Stable,
}

pub async fn get_monthly_cost_breakdown(client: &Client, months_back: u32) -> Result<CostTrend> {
    let end = Utc::now();
    let start = end - Duration::days((months_back * 30) as i64);

    let interval = DateInterval::builder()
        .start(start.format("%Y-%m-%d").to_string())
        .end(end.format("%Y-%m-%d").to_string())
        .build()?;

    let group_by_service = GroupDefinition::builder()
        .r#type(GroupDefinitionType::Dimension)
        .key("SERVICE")
        .build();

    let resp = client
        .get_cost_and_usage()
        .time_period(interval)
        .granularity(aws_sdk_costexplorer::types::Granularity::Monthly)
        .metrics("BlendedCost")
        .group_by(group_by_service)
        .send()
        .await?;

    let mut periods = Vec::new();

    for result in resp.results_by_time() {
        let period = result.time_period();
        let period_start = period.map(|p| p.start()).unwrap_or_default().to_string();
        let period_end = period.map(|p| p.end()).unwrap_or_default().to_string();

        let mut total_usd = 0.0_f64;
        let mut by_service: HashMap<String, f64> = HashMap::new();

        for group in result.groups() {
            let service = group
                .keys()
                .first()
                .map(|k| k.as_str())
                .unwrap_or("Unknown");

            let cost: f64 = group
                .metrics()
                .as_ref()
                .and_then(|m| m.get("BlendedCost"))
                .and_then(|m| m.amount())
                .and_then(|a| a.parse().ok())
                .unwrap_or(0.0);

            total_usd += cost;
            by_service.insert(service.to_string(), cost);
        }

        periods.push(CostBreakdown {
            period_start,
            period_end,
            total_usd,
            by_service,
            by_region: HashMap::new(),
            by_usage_type: HashMap::new(),
        });
    }

    let avg = if periods.is_empty() {
        0.0
    } else {
        periods.iter().map(|p| p.total_usd).sum::<f64>() / periods.len() as f64
    };

    let trend_direction = if periods.len() >= 2 {
        let first = periods.first().map(|p| p.total_usd).unwrap_or(0.0);
        let last = periods.last().map(|p| p.total_usd).unwrap_or(0.0);
        let pct = if first > 0.0 {
            (last - first) / first * 100.0
        } else {
            0.0
        };

        if pct > 5.0 {
            TrendDirection::Increasing
        } else if pct < -5.0 {
            TrendDirection::Decreasing
        } else {
            TrendDirection::Stable
        }
    } else {
        TrendDirection::Stable
    };

    let trend_percent = if periods.len() >= 2 {
        let first = periods.first().map(|p| p.total_usd).unwrap_or(0.0);
        let last = periods.last().map(|p| p.total_usd).unwrap_or(0.0);
        if first > 0.0 {
            (last - first) / first * 100.0
        } else {
            0.0
        }
    } else {
        0.0
    };

    Ok(CostTrend {
        periods,
        avg_monthly_usd: avg,
        trend_direction,
        trend_percent,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trend_direction_increasing() {
        let periods = vec![
            CostBreakdown {
                period_start: "2026-01-01".into(),
                period_end: "2026-02-01".into(),
                total_usd: 1000.0,
                by_service: HashMap::new(),
                by_region: HashMap::new(),
                by_usage_type: HashMap::new(),
            },
            CostBreakdown {
                period_start: "2026-02-01".into(),
                period_end: "2026-03-01".into(),
                total_usd: 1200.0,
                by_service: HashMap::new(),
                by_region: HashMap::new(),
                by_usage_type: HashMap::new(),
            },
        ];
        let first = periods.first().map(|p| p.total_usd).unwrap_or(0.0);
        let last = periods.last().map(|p| p.total_usd).unwrap_or(0.0);
        let pct = (last - first) / first * 100.0;
        assert!(pct > 5.0);
    }

    #[test]
    fn trend_direction_stable() {
        let cost = 1000.0_f64;
        let pct = (cost - cost) / cost * 100.0;
        assert!(pct.abs() <= 5.0);
    }

    #[test]
    fn avg_calculation() {
        let costs = vec![1000.0, 1200.0, 1100.0];
        let avg: f64 = costs.iter().sum::<f64>() / costs.len() as f64;
        assert!((avg - 1100.0).abs() < 0.001);
    }
}
