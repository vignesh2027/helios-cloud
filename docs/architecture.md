# HELIOS Architecture

## Overview

HELIOS is a **TypeScript monorepo** built with pnpm workspaces and turborepo. Each capability is a separately publishable package with a clean interface boundary.

## Package Dependency Graph

```
@helios-cloud/sdk
     ├── @helios-cloud/core          (resource graph, state, events, config)
     ├── @helios-cloud/optimizer     (cost analysis, rightsizing)
     ├── @helios-cloud/drift         (drift detection, Terraform state parsing)
     ├── @helios-cloud/provider-aws  (AWS SDK v3 adapters)
     └── @helios-cloud/provider-gcp  (planned)

@helios-cloud/cli
     └── @helios-cloud/sdk

@helios-cloud/api
     ├── @helios-cloud/core
     ├── @helios-cloud/optimizer
     └── @helios-cloud/drift

@helios-cloud/dashboard
     └── (API via HTTP)
```

## Core Concepts

### Resource Graph

The `ResourceGraph` is a directed acyclic graph (DAG) where:
- **Nodes** = cloud resources (EC2 instance, S3 bucket, RDS cluster, etc.)
- **Edges** = dependency relationships (contains, network, iam, references)

Resources are indexed by ID for O(1) lookup. Topological sort enables ordered plan/apply operations.

### State Manager

`StateManager` maintains versioned snapshots of the resource graph:
- Each scan creates a new snapshot with a checksum
- Diffs between snapshots identify added/removed/modified resources
- Maximum 100 snapshots retained (FIFO eviction)
- State files are stored as JSON in `.helios/state/`

### Provider Adapters

Providers implement `ProviderAdapter`:
```typescript
interface ProviderAdapter {
  name: string;
  scan(options: { regions: string[]; accountId: string }): Promise<ScanResult>;
}
```

The AWS provider uses AWS SDK v3 with:
- `p-limit` for concurrent request control (default: 10 concurrent per account)
- `p-retry` with exponential backoff for API rate limit handling
- IAM role assumption via STS for cross-account scanning

### Event Bus

`TypedEventBus` provides strongly-typed pub/sub across all packages:
```typescript
eventBus.on('drift:detected', ({ driftedResource }) => { ... });
eventBus.on('policy:violation', ({ violation }) => { ... });
eventBus.on('scan:completed', ({ totalResources, durationMs }) => { ... });
```

### Cost Optimizer

The cost analyzer runs rule-based analysis on discovered resources:
1. **EC2 Rightsizing**: Compare avg/max CPU% against threshold; recommend next-smaller instance type
2. **Idle Detection**: Resources with 0 CloudWatch metrics for N days → terminate recommendation
3. **EBS Optimization**: gp2 → gp3 migration (20% savings), unattached volume cleanup
4. **Savings Plans**: High-utilization instances identified as Savings Plan candidates

Confidence scoring (0-1) ensures only high-confidence recommendations surface:
- `< 0.85` = filtered out by default
- `0.85-0.95` = medium confidence
- `> 0.95` = high confidence

### Drift Detector

1. Parse Terraform `.tfstate` file → build index of expected resource attributes
2. Compare each expected resource against live state from last scan
3. Compute attribute-level diff with severity classification
4. Identify unmanaged resources (live but not in state)

Severity classification per resource type:
- **critical**: `instance_type`, `iam_instance_profile`, `multi_az`, `storage_encrypted`
- **high**: `engine_version`, `backup_retention_period`, `monitoring`
- **medium**: most other attributes
- **low**: tags

## API Design

REST API built with Fastify v4:
- **Versioning**: `/api/v1/` prefix
- **Validation**: AJV with coercion and strict schema matching
- **Auth**: JWT (pluggable — currently supports `none` for development)
- **Rate limiting**: 1000 req/min per IP by default
- **WebSocket**: `/api/v1/ws/events` for real-time event streaming

All responses are JSON. Paginated endpoints include `total`, `offset`, `limit`.

## Deployment Architecture

### Kubernetes (Production)

```
┌─────────────────────────────────────────────────────┐
│                   Kubernetes Cluster                  │
│                                                       │
│  ┌──────────────────┐    ┌──────────────────────┐   │
│  │   HELIOS API     │    │  HELIOS Dashboard     │   │
│  │   2-10 pods      │    │  2 pods               │   │
│  │   HPA enabled    │    │  Next.js standalone   │   │
│  └────────┬─────────┘    └──────────────────────┘   │
│           │                                           │
│  ┌────────▼─────────┐    ┌──────────────────────┐   │
│  │   AWS IAM Role   │    │   Prometheus           │   │
│  │   (IRSA)         │    │   ServiceMonitor       │   │
│  └────────┬─────────┘    └──────────────────────┘   │
│           │                                           │
└───────────┼─────────────────────────────────────────┘
            │
     ┌──────▼──────┐
     │  AWS APIs   │
     │  EC2, S3,   │
     │  RDS, etc.  │
     └─────────────┘
```

IAM permissions follow least-privilege:
- Read-only APIs: `ec2:Describe*`, `s3:List*`, `rds:Describe*`, `lambda:List*`
- Cost Explorer: `ce:GetCostAndUsage`, `ce:GetRecommendations`
- CloudWatch: `cloudwatch:GetMetricStatistics`, `cloudwatch:ListMetrics`

## Security

- Secrets via Kubernetes Secrets (never in ConfigMap)
- IMDSv2 enforced on all EC2 instances
- Container security: non-root, readOnlyRootFilesystem, no privilege escalation
- Network policies restrict ingress to ingress-nginx namespace only
- All EKS secrets encrypted with customer-managed KMS key
- API rate limiting + CORS protection
