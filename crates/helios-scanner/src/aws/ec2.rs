use anyhow::Result;
use aws_sdk_ec2::Client;
use tracing::{debug, warn};

use crate::models::{DependencyEdge, EdgeType, Resource, ResourceStatus};

fn tags_to_map(tags: &[aws_sdk_ec2::types::Tag]) -> std::collections::HashMap<String, String> {
    tags.iter()
        .filter_map(|t| Some((t.key.clone()?, t.value.clone()?)))
        .collect()
}

fn name_from_tags(tags: &[aws_sdk_ec2::types::Tag]) -> Option<String> {
    tags.iter()
        .find(|t| t.key.as_deref() == Some("Name"))
        .and_then(|t| t.value.clone())
}

fn map_instance_state(state: Option<&str>) -> ResourceStatus {
    match state {
        Some("running") => ResourceStatus::Active,
        Some("stopped") | Some("stopping") => ResourceStatus::Stopped,
        Some("terminated") | Some("shutting-down") => ResourceStatus::Terminated,
        Some("pending") => ResourceStatus::Pending,
        _ => ResourceStatus::Unknown,
    }
}

pub async fn scan_instances(
    client: &Client,
    region: &str,
    account_id: &str,
) -> Result<(Vec<Resource>, Vec<DependencyEdge>)> {
    let mut resources = Vec::new();
    let mut edges = Vec::new();
    let mut next_token: Option<String> = None;

    loop {
        let mut req = client.describe_instances().max_results(100);
        if let Some(token) = next_token.take() {
            req = req.next_token(token);
        }

        let resp = match req.send().await {
            Ok(r) => r,
            Err(e) => {
                warn!("Failed to describe EC2 instances in {region}: {e}");
                break;
            }
        };

        for reservation in resp.reservations() {
            for instance in reservation.instances() {
                let Some(instance_id) = instance.instance_id() else {
                    continue;
                };

                let tags = instance.tags();
                let name = name_from_tags(tags);
                let tag_map = tags_to_map(tags);

                let state_name = instance.state().and_then(|s| s.name()).map(|n| n.as_str());

                let arn = format!("arn:aws:ec2:{region}:{account_id}:instance/{instance_id}");

                let metadata = serde_json::json!({
                    "instanceType": instance.instance_type().map(|t| t.as_str()),
                    "platform": instance.platform_details(),
                    "privateIpAddress": instance.private_ip_address(),
                    "publicIpAddress": instance.public_ip_address(),
                    "subnetId": instance.subnet_id(),
                    "vpcId": instance.vpc_id(),
                    "imageId": instance.image_id(),
                    "iamInstanceProfile": instance.iam_instance_profile().and_then(|p| p.arn()),
                    "ebsOptimized": instance.ebs_optimized(),
                    "launchTime": instance.launch_time().map(|t| t.to_string()),
                });

                let mut r = Resource::new(instance_id, "ec2:instance", region, account_id)
                    .with_arn(&arn)
                    .with_status(map_instance_state(state_name));

                if let Some(n) = name {
                    r = r.with_name(n);
                }
                for (k, v) in &tag_map {
                    r = r.with_tag(k, v);
                }
                r.metadata = metadata;

                // Dependency edges
                if let Some(vpc_id) = instance.vpc_id() {
                    edges.push(DependencyEdge {
                        source_id: instance_id.to_string(),
                        target_id: vpc_id.to_string(),
                        edge_type: EdgeType::Contains,
                    });
                }
                if let Some(subnet_id) = instance.subnet_id() {
                    edges.push(DependencyEdge {
                        source_id: instance_id.to_string(),
                        target_id: subnet_id.to_string(),
                        edge_type: EdgeType::Contains,
                    });
                }
                for sg in instance.security_groups() {
                    if let Some(sg_id) = sg.group_id() {
                        edges.push(DependencyEdge {
                            source_id: instance_id.to_string(),
                            target_id: sg_id.to_string(),
                            edge_type: EdgeType::Network,
                        });
                    }
                }

                debug!("Discovered instance {instance_id} ({state_name:?})");
                resources.push(r);
            }
        }

        next_token = resp.next_token().map(|s| s.to_string());
        if next_token.is_none() {
            break;
        }
    }

    Ok((resources, edges))
}

pub async fn scan_security_groups(
    client: &Client,
    region: &str,
    account_id: &str,
) -> Result<Vec<Resource>> {
    let mut resources = Vec::new();
    let mut next_token: Option<String> = None;

    loop {
        let mut req = client.describe_security_groups().max_results(100);
        if let Some(token) = next_token.take() {
            req = req.next_token(token);
        }

        let resp = match req.send().await {
            Ok(r) => r,
            Err(e) => {
                warn!("Failed to describe security groups in {region}: {e}");
                break;
            }
        };

        for sg in resp.security_groups() {
            let Some(sg_id) = sg.group_id() else { continue };

            let has_public_ingress = sg.ip_permissions().iter().any(|p| {
                p.ip_ranges()
                    .iter()
                    .any(|r| r.cidr_ip() == Some("0.0.0.0/0"))
                    || p.ipv6_ranges()
                        .iter()
                        .any(|r| r.cidr_ipv6() == Some("::/0"))
            });

            let metadata = serde_json::json!({
                "description": sg.description(),
                "vpcId": sg.vpc_id(),
                "hasPublicIngress": has_public_ingress,
                "ingressRuleCount": sg.ip_permissions().len(),
                "egressRuleCount": sg.ip_permissions_egress().len(),
            });

            let tags = sg.tags();
            let tag_map = tags_to_map(tags);
            let name = name_from_tags(tags).or_else(|| sg.group_name().map(|s| s.to_string()));

            let mut r = Resource::new(sg_id, "ec2:security-group", region, account_id)
                .with_status(ResourceStatus::Active);

            if let Some(n) = name {
                r = r.with_name(n);
            }
            for (k, v) in &tag_map {
                r = r.with_tag(k, v);
            }
            r.metadata = metadata;
            resources.push(r);
        }

        next_token = resp.next_token().map(|s| s.to_string());
        if next_token.is_none() {
            break;
        }
    }

    Ok(resources)
}
