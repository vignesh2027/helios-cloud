# ☀️ HELIOS — Enterprise Cloud Infrastructure Platform

<p align="center">
  <img src="docs/assets/helios-banner.svg" alt="HELIOS" width="800"/>
</p>

<p align="center">
  <a href="https://github.com/vignesh2027/helios-cloud/actions"><img src="https://github.com/vignesh2027/helios-cloud/workflows/CI/badge.svg" alt="CI"/></a>
  <a href="https://github.com/vignesh2027/helios-cloud/releases"><img src="https://img.shields.io/github/v/release/vignesh2027/helios-cloud?color=orange" alt="Release"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"/></a>
  <a href="https://github.com/vignesh2027/helios-cloud/stargazers"><img src="https://img.shields.io/github/stars/vignesh2027/helios-cloud?style=flat&color=yellow" alt="Stars"/></a>
  <a href="https://github.com/vignesh2027/helios-cloud/graphs/contributors"><img src="https://img.shields.io/badge/contributors-1-brightgreen" alt="Contributors"/></a>
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js" alt="Node.js"/>
</p>

<p align="center">
  <strong>Multi-cloud infrastructure orchestration with intelligent cost optimization, drift detection, and policy enforcement.</strong>
</p>

---

## What is HELIOS?

HELIOS is a production-grade cloud infrastructure platform that gives platform engineering teams a **single control plane** across AWS, GCP, and Azure. It combines the power of GitOps workflows, real-time drift detection, ML-driven cost optimization, and a unified policy engine — delivered as a CLI, SDK, REST API, and web dashboard.

Think of it as **Terraform + AWS Cost Explorer + AWS Config + AWS Organizations** — unified, open-source, and extensible.

```
┌─────────────────────────────────────────────────────────────┐
│                      HELIOS PLATFORM                         │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   CLI    │  │  SDK     │  │  REST API│  │Dashboard │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │          │
│  ─────┴──────────────┴──────────────┴──────────────┴─────   │
│                   HELIOS CORE ENGINE                         │
│  ─────────────────────────────────────────────────────────  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Resource  │  │  Cost    │  │  Drift   │  │ Policy   │   │
│  │  Graph   │  │Optimizer │  │Detector  │  │ Engine   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │          │
│  ─────┴──────────────┴──────────────┴──────────────┴─────   │
│                   PROVIDER LAYER                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │   AWS    │  │   GCP    │  │  Azure   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 🔭 Universal Resource Inventory
- Real-time discovery across 50+ AWS resource types (EC2, S3, RDS, Lambda, EKS, VPC, IAM, and more)
- Dependency graph with visual topology mapping
- Tag compliance enforcement and bulk remediation
- Cross-account, multi-region aggregation

### 💰 Intelligent Cost Optimization
- ML-driven rightsizing recommendations for EC2, RDS, and Lambda
- Idle resource detection with automated cleanup workflows
- Savings Plans and Reserved Instance analysis
- Cost anomaly detection with Slack/PagerDuty alerts
- 30/60/90-day trend forecasting

### 🔍 Infrastructure Drift Detection
- Continuous comparison of live state vs IaC definitions (Terraform, CDK, CloudFormation)
- Automatic drift remediation via GitOps PR workflow
- Drift timeline with attribution (who changed what, when)
- Configurable alert thresholds

### 🛡️ Policy Enforcement Engine
- OPA-compatible Rego policies for cloud governance
- CIS benchmark enforcement (AWS, GCP, Azure)
- SOC 2, PCI DSS, HIPAA compliance scoring
- Real-time violation alerts with remediation guidance

### ⚡ GitOps Workflow
- PR-based infrastructure changes with plan/apply lifecycle
- Automatic rollback on failed deployments
- Audit log with immutable change history
- Slack and GitHub integration

### 🌡️ Observability
- Prometheus metrics endpoint (`/metrics`)
- OpenTelemetry distributed tracing
- Structured JSON logging (pino)
- Pre-built Grafana dashboards

---

## Quick Start

### Install CLI

```bash
# Using npm
npm install -g @helios-cloud/cli

# Using curl (macOS/Linux)
curl -sSL https://helios.sh/install | bash

# Using Homebrew
brew install helios-cloud/tap/helios
```

### Configure AWS credentials

```bash
helios config init
# Enter AWS region: us-east-1
# Enter AWS profile: default
```

### Discover your infrastructure

```bash
helios scan --provider aws --region us-east-1

# Output:
# ✓ Discovered 847 resources across 12 resource types
# ✓ Built dependency graph (2,340 edges)
# ✓ Identified 23 cost optimization opportunities ($4,812/mo potential savings)
# ✓ Found 7 policy violations
# ✓ Detected 3 drifted resources
```

### View cost recommendations

```bash
helios optimize --output table

# ┌─────────────────────────────┬──────────────┬────────────┬─────────────┐
# │ Resource                    │ Current Cost │ Optimized  │   Savings   │
# ├─────────────────────────────┼──────────────┼────────────┼─────────────┤
# │ i-0abc123 (m5.2xlarge)      │   $276.48/mo │  $69.12/mo │   $207.36   │
# │ db-prod-main (db.r5.xlarge) │   $518.40/mo │ $259.20/mo │   $259.20   │
# │ 14 idle Lambda functions    │    $48.60/mo │     $0/mo  │    $48.60   │
# └─────────────────────────────┴──────────────┴────────────┴─────────────┘
# Total potential savings: $515.16/month
```

### Check policy compliance

```bash
helios policy check --framework cis-aws-1.5

# CIS AWS Foundations Benchmark v1.5
# ─────────────────────────────────────────────
# ✓ 1.1  Root account MFA enabled
# ✓ 1.2  IAM users have MFA
# ✗ 1.4  Access keys rotated within 90 days      [3 violations]
# ✗ 2.1  CloudTrail enabled in all regions       [2 regions]
# ✓ 3.1  VPC flow logs enabled
# ...
# Score: 87/100 (B+)
```

---

## Architecture

```
helios-cloud/
├── packages/
│   ├── core/           # Resource graph, state machine, event bus
│   ├── cli/            # Command-line interface (Commander.js)
│   ├── sdk/            # TypeScript/JavaScript SDK
│   ├── api/            # REST + WebSocket API server (Fastify)
│   ├── optimizer/      # Cost analysis and rightsizing engine
│   ├── drift/          # Drift detection and reconciliation
│   ├── policy/         # OPA policy engine integration
│   ├── providers/
│   │   ├── aws/        # AWS SDK v3 provider
│   │   ├── gcp/        # Google Cloud provider
│   │   └── azure/      # Azure SDK provider
│   └── dashboard/      # Next.js 14 web dashboard
├── terraform/
│   ├── modules/        # Reusable Terraform modules
│   │   ├── vpc/
│   │   ├── eks/
│   │   ├── rds/
│   │   └── lambda/
│   └── examples/       # Reference architectures
├── charts/
│   └── helios/         # Helm chart for Kubernetes deployment
├── operator/           # Kubernetes operator (CloudResource CRD)
├── .github/
│   └── workflows/      # CI/CD pipelines
└── docs/               # Documentation site
```

---

## Installation & Deployment

### Kubernetes (Recommended for production)

```bash
helm repo add helios https://charts.helios.sh
helm repo update

helm install helios helios/helios \
  --namespace helios-system \
  --create-namespace \
  --set aws.region=us-east-1 \
  --set api.replicas=3 \
  --set dashboard.enabled=true
```

### Docker Compose (Development)

```bash
git clone https://github.com/vignesh2027/helios-cloud
cd helios-cloud
cp .env.example .env  # Fill in AWS credentials
docker compose up -d
```

### Local Development

```bash
git clone https://github.com/vignesh2027/helios-cloud
cd helios-cloud
pnpm install
pnpm dev
```

---

## SDK Usage

```typescript
import { HeliosClient } from '@helios-cloud/sdk';

const helios = new HeliosClient({
  provider: 'aws',
  region: 'us-east-1',
  credentials: { profile: 'default' },
});

// Discover all resources
const inventory = await helios.scan();
console.log(`Found ${inventory.total} resources`);

// Get cost recommendations
const recommendations = await helios.optimizer.analyze();
for (const rec of recommendations) {
  console.log(`${rec.resourceId}: save $${rec.monthlySavings}/mo by ${rec.action}`);
}

// Check for drift
const drift = await helios.drift.detect({ stateFile: './terraform.tfstate' });
if (drift.hasDrift) {
  console.log(`${drift.driftedResources.length} resources have drifted`);
}

// Evaluate policies
const compliance = await helios.policy.evaluate({ framework: 'cis-aws-1.5' });
console.log(`Compliance score: ${compliance.score}%`);
```

---

## Configuration

```yaml
# helios.yaml
version: "1"

providers:
  aws:
    regions: [us-east-1, us-west-2, eu-west-1]
    accounts:
      - id: "123456789012"
        role: arn:aws:iam::123456789012:role/HeliosReadOnly
      - id: "987654321098"
        role: arn:aws:iam::987654321098:role/HeliosReadOnly

scan:
  interval: 5m
  resourceTypes:
    - ec2:instance
    - s3:bucket
    - rds:db-instance
    - lambda:function
    - eks:cluster

optimizer:
  enabled: true
  idleThresholdDays: 14
  rightsizingConfidenceThreshold: 0.85

drift:
  enabled: true
  stateBackend:
    type: s3
    bucket: my-terraform-state
    prefix: helios/

policy:
  frameworks:
    - cis-aws-1.5
    - soc2
  enforceOnScan: true
  alerting:
    slack:
      webhook: ${SLACK_WEBHOOK_URL}
      channel: "#cloud-alerts"

api:
  port: 8080
  auth:
    type: jwt
    issuer: https://auth.example.com

dashboard:
  port: 3000
```

---

## CLI Reference

```
helios [command] [options]

Commands:
  scan          Discover and inventory cloud resources
  optimize      Analyze cost optimization opportunities  
  drift         Detect and reconcile infrastructure drift
  policy        Evaluate policy compliance
  apply         Apply infrastructure changes via GitOps
  rollback      Roll back a failed deployment
  config        Manage HELIOS configuration
  dashboard     Launch the web dashboard
  version       Show version information

Global Options:
  --config, -c   Path to helios.yaml (default: ./helios.yaml)
  --output, -o   Output format: table|json|yaml (default: table)
  --region       Cloud region override
  --profile      AWS/GCP profile to use
  --verbose      Enable verbose logging
  --no-color     Disable colored output
```

---

## Roadmap

- [x] AWS provider (EC2, S3, RDS, Lambda, EKS, VPC, IAM, CloudFront)
- [x] Cost optimization engine with ML rightsizing
- [x] Infrastructure drift detection
- [x] OPA policy engine
- [x] REST API & WebSocket
- [x] Next.js dashboard
- [x] Kubernetes operator
- [x] Terraform modules
- [ ] GCP provider (Compute, GKE, Cloud SQL, Cloud Run)
- [ ] Azure provider (VMs, AKS, SQL, Functions)
- [ ] AI-powered anomaly detection (via Bedrock/Vertex AI)
- [ ] FinOps reporting (FOCUS spec)
- [ ] Terraform Cloud / Spacelift integration
- [ ] VS Code extension
- [ ] Mobile app (React Native)

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

```bash
# Run tests
pnpm test

# Run linter
pnpm lint

# Build all packages
pnpm build
```

---

## License

Apache 2.0 — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/vignesh2027">Vigneshwar L</a>
</p>
