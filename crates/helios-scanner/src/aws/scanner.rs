use anyhow::Result;
use aws_config::BehaviorVersion;
use std::time::Instant;
use tracing::{info, warn};

use super::ec2;
use crate::models::ScanResult;

#[derive(Debug, Clone)]
pub struct ScanOptions {
    pub regions: Vec<String>,
    pub account_id: String,
    pub profile: Option<String>,
    pub role_arn: Option<String>,
    pub enabled_services: Vec<String>,
    pub max_concurrent_regions: usize,
}

impl Default for ScanOptions {
    fn default() -> Self {
        Self {
            regions: vec!["us-east-1".to_string()],
            account_id: String::new(),
            profile: None,
            role_arn: None,
            enabled_services: vec!["ec2:instance".into(), "ec2:security-group".into()],
            max_concurrent_regions: 4,
        }
    }
}

pub struct AwsScanner {
    opts: ScanOptions,
}

impl AwsScanner {
    pub fn new(opts: ScanOptions) -> Self {
        Self { opts }
    }

    pub async fn scan_region(&self, region: &str) -> Result<ScanResult> {
        let start = Instant::now();
        info!("Scanning region {region}");

        let mut config_loader = aws_config::defaults(BehaviorVersion::latest())
            .region(aws_config::Region::new(region.to_string()));

        if let Some(profile) = &self.opts.profile {
            config_loader = config_loader.profile_name(profile);
        }

        let config = config_loader.load().await;
        let ec2_client = aws_sdk_ec2::Client::new(&config);

        let mut result = ScanResult::new("aws", region, &self.opts.account_id);

        if self
            .opts
            .enabled_services
            .iter()
            .any(|s| s == "ec2:instance")
        {
            match ec2::scan_instances(&ec2_client, region, &self.opts.account_id).await {
                Ok((instances, edges)) => {
                    info!("Found {} instances in {region}", instances.len());
                    result.resources.extend(instances);
                    result.edges.extend(edges);
                }
                Err(e) => {
                    warn!("EC2 instance scan failed in {region}: {e}");
                    result.errors.push(crate::models::ScanError {
                        resource_type: "ec2:instance".into(),
                        message: e.to_string(),
                        retryable: true,
                    });
                }
            }
        }

        if self
            .opts
            .enabled_services
            .iter()
            .any(|s| s == "ec2:security-group")
        {
            match ec2::scan_security_groups(&ec2_client, region, &self.opts.account_id).await {
                Ok(sgs) => {
                    info!("Found {} security groups in {region}", sgs.len());
                    result.resources.extend(sgs);
                }
                Err(e) => {
                    warn!("Security group scan failed in {region}: {e}");
                    result.errors.push(crate::models::ScanError {
                        resource_type: "ec2:security-group".into(),
                        message: e.to_string(),
                        retryable: true,
                    });
                }
            }
        }

        result.duration_ms = start.elapsed().as_millis() as u64;
        info!(
            "Region {region} scan complete: {} resources, {}ms",
            result.resources.len(),
            result.duration_ms
        );
        Ok(result)
    }

    pub async fn scan_all(&self) -> Vec<Result<ScanResult>> {
        let futs = self.opts.regions.iter().map(|region| {
            let region = region.clone();
            async move { self.scan_region(&region).await }
        });
        futures::future::join_all(futs).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scan_options_default() {
        let opts = ScanOptions::default();
        assert_eq!(opts.regions, vec!["us-east-1"]);
        assert_eq!(opts.max_concurrent_regions, 4);
        assert!(opts.enabled_services.contains(&"ec2:instance".to_string()));
    }

    #[test]
    fn scanner_creation() {
        let opts = ScanOptions {
            regions: vec!["us-east-1".into(), "eu-west-1".into()],
            account_id: "123456789012".into(),
            ..Default::default()
        };
        let scanner = AwsScanner::new(opts);
        assert_eq!(scanner.opts.regions.len(), 2);
    }
}
