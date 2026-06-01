use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ResourceStatus {
    Active,
    Stopped,
    Terminated,
    Pending,
    Error,
    Unknown,
}

impl std::fmt::Display for ResourceStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Active => write!(f, "active"),
            Self::Stopped => write!(f, "stopped"),
            Self::Terminated => write!(f, "terminated"),
            Self::Pending => write!(f, "pending"),
            Self::Error => write!(f, "error"),
            Self::Unknown => write!(f, "unknown"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resource {
    pub id: String,
    #[serde(rename = "type")]
    pub resource_type: String,
    pub provider: String,
    pub region: String,
    pub account_id: String,
    pub name: Option<String>,
    pub arn: Option<String>,
    pub status: ResourceStatus,
    pub tags: HashMap<String, String>,
    pub metadata: serde_json::Value,
    pub cost_per_month: Option<f64>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

impl Resource {
    pub fn new(
        id: impl Into<String>,
        resource_type: impl Into<String>,
        region: impl Into<String>,
        account_id: impl Into<String>,
    ) -> Self {
        Self {
            id: id.into(),
            resource_type: resource_type.into(),
            provider: "aws".into(),
            region: region.into(),
            account_id: account_id.into(),
            name: None,
            arn: None,
            status: ResourceStatus::Unknown,
            tags: HashMap::new(),
            metadata: serde_json::Value::Object(serde_json::Map::new()),
            cost_per_month: None,
            created_at: None,
            updated_at: None,
        }
    }

    pub fn with_name(mut self, name: impl Into<String>) -> Self {
        self.name = Some(name.into());
        self
    }

    pub fn with_arn(mut self, arn: impl Into<String>) -> Self {
        self.arn = Some(arn.into());
        self
    }

    pub fn with_status(mut self, status: ResourceStatus) -> Self {
        self.status = status;
        self
    }

    pub fn with_tag(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.tags.insert(key.into(), value.into());
        self
    }

    pub fn name_from_tags(&self) -> Option<&str> {
        self.tags.get("Name").map(|s| s.as_str())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyEdge {
    pub source_id: String,
    pub target_id: String,
    pub edge_type: EdgeType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EdgeType {
    DependsOn,
    Contains,
    References,
    Network,
    Iam,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub provider: String,
    pub region: String,
    pub account_id: String,
    pub resources: Vec<Resource>,
    pub edges: Vec<DependencyEdge>,
    pub scanned_at: DateTime<Utc>,
    pub duration_ms: u64,
    pub errors: Vec<ScanError>,
}

impl ScanResult {
    pub fn new(provider: impl Into<String>, region: impl Into<String>, account_id: impl Into<String>) -> Self {
        Self {
            provider: provider.into(),
            region: region.into(),
            account_id: account_id.into(),
            resources: Vec::new(),
            edges: Vec::new(),
            scanned_at: Utc::now(),
            duration_ms: 0,
            errors: Vec::new(),
        }
    }

    pub fn total_resources(&self) -> usize {
        self.resources.len()
    }

    pub fn by_type(&self) -> HashMap<&str, usize> {
        let mut counts: HashMap<&str, usize> = HashMap::new();
        for r in &self.resources {
            *counts.entry(r.resource_type.as_str()).or_insert(0) += 1;
        }
        counts
    }

    pub fn by_status(&self) -> HashMap<String, usize> {
        let mut counts: HashMap<String, usize> = HashMap::new();
        for r in &self.resources {
            *counts.entry(r.status.to_string()).or_insert(0) += 1;
        }
        counts
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanError {
    pub resource_type: String,
    pub message: String,
    pub retryable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsSnapshot {
    pub instance_id: String,
    pub region: String,
    pub collected_at: DateTime<Utc>,
    pub avg_cpu_percent: f64,
    pub max_cpu_percent: f64,
    pub avg_memory_percent: Option<f64>,
    pub avg_network_in_mbps: f64,
    pub avg_network_out_mbps: f64,
    pub avg_disk_read_iops: f64,
    pub avg_disk_write_iops: f64,
    pub idle_days: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BudgetAlert {
    pub id: String,
    pub name: String,
    pub threshold_usd: f64,
    pub current_spend_usd: f64,
    pub forecasted_spend_usd: f64,
    pub period: BudgetPeriod,
    pub triggered: bool,
    pub severity: AlertSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum BudgetPeriod {
    Daily,
    Monthly,
    Quarterly,
    Annual,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resource_builder_pattern() {
        let r = Resource::new("i-abc123", "ec2:instance", "us-east-1", "123456789012")
            .with_name("my-server")
            .with_arn("arn:aws:ec2:us-east-1:123456789012:instance/i-abc123")
            .with_status(ResourceStatus::Active)
            .with_tag("Environment", "production")
            .with_tag("Team", "platform");

        assert_eq!(r.id, "i-abc123");
        assert_eq!(r.resource_type, "ec2:instance");
        assert_eq!(r.status, ResourceStatus::Active);
        assert_eq!(r.tags.get("Environment").unwrap(), "production");
        assert_eq!(r.name.as_deref(), Some("my-server"));
        // name_from_tags() reads from tags["Name"], not from r.name
        assert_eq!(r.name_from_tags(), None);
    }

    #[test]
    fn scan_result_by_type() {
        let mut result = ScanResult::new("aws", "us-east-1", "123456789012");
        result.resources.push(Resource::new("i-1", "ec2:instance", "us-east-1", "123456789012"));
        result.resources.push(Resource::new("i-2", "ec2:instance", "us-east-1", "123456789012"));
        result.resources.push(Resource::new("b-1", "s3:bucket", "us-east-1", "123456789012"));

        let by_type = result.by_type();
        assert_eq!(by_type.get("ec2:instance"), Some(&2));
        assert_eq!(by_type.get("s3:bucket"), Some(&1));
        assert_eq!(result.total_resources(), 3);
    }

    #[test]
    fn scan_result_by_status() {
        let mut result = ScanResult::new("aws", "us-east-1", "123456789012");
        result.resources.push(
            Resource::new("i-1", "ec2:instance", "us-east-1", "123456789012")
                .with_status(ResourceStatus::Active),
        );
        result.resources.push(
            Resource::new("i-2", "ec2:instance", "us-east-1", "123456789012")
                .with_status(ResourceStatus::Stopped),
        );

        let by_status = result.by_status();
        assert_eq!(by_status.get("active"), Some(&1));
        assert_eq!(by_status.get("stopped"), Some(&1));
    }

    #[test]
    fn resource_status_display() {
        assert_eq!(ResourceStatus::Active.to_string(), "active");
        assert_eq!(ResourceStatus::Stopped.to_string(), "stopped");
        assert_eq!(ResourceStatus::Terminated.to_string(), "terminated");
    }

    #[test]
    fn edge_type_serialization() {
        let edge = DependencyEdge {
            source_id: "i-1".into(),
            target_id: "vpc-1".into(),
            edge_type: EdgeType::DependsOn,
        };
        let json = serde_json::to_string(&edge).unwrap();
        assert!(json.contains("depends_on"));
    }
}
