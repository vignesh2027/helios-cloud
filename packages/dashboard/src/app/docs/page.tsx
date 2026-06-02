'use client';

import { useState } from 'react';
import {
  BookOpen, Terminal, Server, DollarSign, AlertTriangle, Shield,
  Zap, Copy, Check, ChevronRight, Package, Cpu, Database,
  CloudLightning, Eye, ArrowRight, Globe, GitBranch,
} from 'lucide-react';

/* ─── Types ─── */
type Method = 'GET' | 'POST' | 'WS';

interface Endpoint {
  method: Method;
  path: string;
  desc: string;
  params: string;
  example?: string;
}

/* ─── Data ─── */
const ENDPOINTS: Endpoint[] = [
  { method: 'GET',  path: '/resources',           desc: 'List all discovered resources',                          params: 'provider, region, type, status, limit, offset',
    example: 'curl http://localhost:3001/resources?region=us-east-1&type=ec2:instance' },
  { method: 'GET',  path: '/resources/:id',        desc: 'Get a single resource by its ID',                       params: 'id (path param)',
    example: 'curl http://localhost:3001/resources/i-0abc1234def567890' },
  { method: 'GET',  path: '/resources/summary',    desc: 'Counts by type, region, and status',                    params: '—' },
  { method: 'POST', path: '/scan',                 desc: 'Trigger a full infrastructure scan (async)',            params: '—',
    example: 'curl -X POST http://localhost:3001/scan' },
  { method: 'GET',  path: '/cost/summary',         desc: 'Full cost report with recommendations and trend data',  params: '—' },
  { method: 'GET',  path: '/cost/recommendations', desc: 'Filterable cost optimization recommendations',          params: 'action, minSavings, region, limit' },
  { method: 'GET',  path: '/drift',                desc: 'Detect drift between live AWS and Terraform state',     params: 'stateFile (required)',
    example: 'curl "http://localhost:3001/drift?stateFile=./terraform.tfstate"' },
  { method: 'GET',  path: '/policy/compliance',    desc: 'Evaluate compliance against a framework',              params: 'framework: cis-aws-1.5 | soc2 | pci-dss',
    example: 'curl "http://localhost:3001/policy/compliance?framework=cis-aws-1.5"' },
  { method: 'GET',  path: '/policy/violations',    desc: 'List active policy violations',                        params: 'framework, severity, resourceType, limit' },
  { method: 'WS',   path: '/ws/events',            desc: 'Real-time WebSocket stream of all platform events',    params: '—',
    example: 'wscat -c ws://localhost:3001/ws/events' },
  { method: 'GET',  path: '/healthz',              desc: 'Health check — returns service status',                params: '—' },
  { method: 'GET',  path: '/metrics',              desc: 'Prometheus metrics endpoint',                          params: '—' },
];

const METHOD_STYLE: Record<Method, { color: string; bg: string }> = {
  GET:  { color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  POST: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  WS:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
};

const PIPELINE = [
  { icon: Cpu,           label: 'helios-scanner',   color: '#f97316', desc: 'Rust async AWS scanner' },
  { icon: Database,      label: 'helios-core',       color: '#60a5fa', desc: 'Resource graph + ChangeTracker' },
  { icon: CloudLightning,label: 'helios-optimizer',  color: '#a78bfa', desc: 'Cost & rightsizing engine' },
  { icon: AlertTriangle, label: 'helios-drift',      color: '#eab308', desc: 'Terraform drift detection' },
  { icon: Shield,        label: 'helios-policy',     color: '#34d399', desc: 'CIS / SOC2 / PCI compliance' },
  { icon: Zap,           label: 'helios-api',        color: '#4ade80', desc: 'Fastify REST + WebSocket' },
  { icon: Eye,           label: 'helios-cli',        color: '#f97316', desc: 'CLI: scan / optimize / drift' },
];

const CLI_COMMANDS = [
  { cmd: 'helios scan',                              desc: 'Scan all AWS regions and display resource inventory' },
  { cmd: 'helios scan --region us-east-1',           desc: 'Scan a specific region only' },
  { cmd: 'helios scan --output json',                desc: 'Output results as JSON' },
  { cmd: 'helios optimize',                          desc: 'Show cost optimization recommendations' },
  { cmd: 'helios optimize --min-savings 100',        desc: 'Show only recommendations ≥ $100/mo savings' },
  { cmd: 'helios drift --state terraform.tfstate',   desc: 'Detect drift against a Terraform state file' },
  { cmd: 'helios drift --severity critical',         desc: 'Filter drift results by severity' },
  { cmd: 'helios policy --framework cis-aws-1.5',   desc: 'Evaluate CIS AWS 1.5 compliance' },
  { cmd: 'helios policy --framework soc2',           desc: 'Evaluate SOC 2 compliance' },
];

const SECTIONS = [
  { id: 'overview',   label: 'Overview',         icon: BookOpen   },
  { id: 'arch',       label: 'Architecture',     icon: GitBranch  },
  { id: 'quickstart', label: 'Quick Start',      icon: Zap        },
  { id: 'api',        label: 'REST API',         icon: Globe      },
  { id: 'cli',        label: 'CLI Reference',    icon: Terminal   },
  { id: 'sdk',        label: 'TypeScript SDK',   icon: Package    },
  { id: 'scanner',    label: 'Rust Scanner',     icon: Cpu        },
  { id: 'deploy',     label: 'Deployment',       icon: Server     },
];

/* ─── Components ─── */
function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{ background: '#0a0a12', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[10px] font-mono" style={{ color: '#6b7280' }}>{lang}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="flex items-center gap-1.5 text-[10px] font-mono transition-colors"
          style={{ color: copied ? '#4ade80' : '#6b7280' }}>
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-xs overflow-x-auto leading-relaxed"
        style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>
        {code}
      </pre>
    </div>
  );
}

function SectionHeader({ id, title, sub }: { id: string; title: string; sub: string }) {
  return (
    <div id={id} className="mb-5 pt-2">
      <h2 className="text-lg font-bold" style={{ color: 'rgb(var(--fg))' }}>{title}</h2>
      <p className="text-sm mt-1" style={{ color: 'rgb(var(--fg-muted))' }}>{sub}</p>
      <div className="divider mt-4" />
    </div>
  );
}

/* ─── Page ─── */
export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex gap-6">

        {/* ── Left Sidebar TOC ── */}
        <aside className="w-48 flex-shrink-0 hidden lg:block">
          <div className="sticky top-0 pt-1">
            <div className="section-label mb-3">Contents</div>
            <nav className="space-y-0.5">
              {SECTIONS.map(s => {
                const Icon = s.icon;
                return (
                  <a key={s.id} href={`#${s.id}`}
                    onClick={() => setActiveSection(s.id)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    style={{
                      color: activeSection === s.id ? 'rgb(var(--accent))' : 'rgb(var(--fg-muted))',
                      background: activeSection === s.id ? 'rgb(var(--accent) / 0.08)' : 'transparent',
                    }}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {s.label}
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0 space-y-10">

          {/* Overview */}
          <section>
            <SectionHeader
              id="overview"
              title="HELIOS Documentation"
              sub="Enterprise cloud infrastructure orchestration — resource inventory, cost optimization, drift detection, and policy compliance."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Server,        color: '#60a5fa', title: 'Resource Inventory', desc: 'Discover EC2, S3, Lambda, RDS, EKS, and 20+ resource types across all regions' },
                { icon: DollarSign,    color: '#4ade80', title: 'Cost Optimization',  desc: 'ML-powered rightsizing, idle detection, Savings Plans — average 25% cost reduction' },
                { icon: AlertTriangle, color: '#eab308', title: 'Drift Detection',    desc: 'Detect and auto-remediate Terraform state drift in seconds' },
                { icon: Shield,        color: '#a78bfa', title: 'Policy Compliance',  desc: 'Continuous CIS AWS 1.5, SOC 2, and PCI-DSS compliance with violation reports' },
              ].map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="card p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${f.color}12`, border: `1px solid ${f.color}22` }}>
                      <Icon style={{ width: 18, height: 18, color: f.color }} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="text-sm font-bold mb-1" style={{ color: 'rgb(var(--fg))' }}>{f.title}</div>
                      <div className="text-xs leading-relaxed" style={{ color: 'rgb(var(--fg-muted))' }}>{f.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Architecture */}
          <section>
            <SectionHeader
              id="arch"
              title="Architecture"
              sub="Seven Rust crates and one Next.js dashboard — each layer has a single responsibility."
            />

            {/* Pipeline diagram */}
            <div className="card p-5 mb-5">
              <div className="flex flex-wrap gap-2 items-center">
                {PIPELINE.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <div key={p.label} className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl"
                        style={{ background: `${p.color}08`, border: `1px solid ${p.color}1a`, minWidth: 100 }}>
                        <Icon style={{ width: 16, height: 16, color: p.color }} strokeWidth={1.8} />
                        <span className="text-[10px] font-mono font-bold text-center" style={{ color: p.color }}>{p.label}</span>
                        <span className="text-[9px] text-center leading-tight" style={{ color: 'rgb(var(--fg-dim))' }}>{p.desc}</span>
                      </div>
                      {i < PIPELINE.length - 1 && (
                        <ArrowRight style={{ width: 14, height: 14, color: 'rgb(var(--fg-dim))' }} className="flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: 'rgb(var(--fg))' }}>Workspace Structure</h3>
                <CodeBlock lang="text" code={`helios-cloud/
├── crates/
│   ├── helios-scanner/   # Rust async AWS scanner
│   ├── helios-core/      # Resource graph + types
│   ├── helios-optimizer/ # Cost analysis engine
│   ├── helios-drift/     # Terraform drift detection
│   ├── helios-policy/    # Compliance evaluation
│   ├── helios-api/       # Fastify REST + WebSocket
│   └── helios-cli/       # CLI tool
├── packages/
│   ├── dashboard/        # Next.js 14 frontend
│   ├── core/             # Shared TypeScript types
│   ├── optimizer/        # TS optimizer wrapper
│   └── drift/            # TS drift wrapper
├── charts/helios/        # Helm chart
└── terraform/            # VPC + EKS modules`} />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: 'rgb(var(--fg))' }}>Data Flow</h3>
                <CodeBlock lang="text" code={`1. Scanner polls AWS APIs every 5 minutes
   └─ Concurrent across all regions + services
   └─ Results fed into ResourceGraph

2. ChangeTracker diffs against previous state
   └─ Emits change events via event bus

3. Analysis engines run on change events:
   └─ Optimizer: rightsizing + idle detection
   └─ Drift:     compare vs Terraform state
   └─ Policy:    evaluate CIS / SOC2 / PCI rules

4. API broadcasts results via WebSocket /ws/events
   └─ Dashboard subscribes and updates live

5. Alerts triggered for critical findings
   └─ Slack webhook, email (configurable)`} />
              </div>
            </div>
          </section>

          {/* Quick Start */}
          <section>
            <SectionHeader
              id="quickstart"
              title="Quick Start"
              sub="Get HELIOS running locally in under 5 minutes."
            />

            <div className="space-y-4">
              {[
                {
                  step: '1', title: 'Clone & install dependencies',
                  code: `git clone https://github.com/vignesh2027/helios-cloud
cd helios-cloud
pnpm install`,
                },
                {
                  step: '2', title: 'Configure AWS credentials',
                  code: `# Option A: AWS profile
export AWS_PROFILE=my-profile

# Option B: Access keys
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=us-east-1`,
                },
                {
                  step: '3', title: 'Start the API server',
                  code: `# Build and run the Rust API
cargo build --release -p helios-api
./target/release/helios-api

# Or in development mode
cargo run -p helios-api`,
                },
                {
                  step: '4', title: 'Launch the dashboard',
                  code: `# In a separate terminal
cd packages/dashboard
pnpm dev

# Open http://localhost:3000`,
                },
                {
                  step: '5', title: 'Run a scan',
                  code: `# Via CLI
helios scan

# Via API
curl -X POST http://localhost:3001/scan

# Watch events in real time
wscat -c ws://localhost:3001/ws/events`,
                },
              ].map(item => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgb(var(--accent) / 0.1)', color: 'rgb(var(--accent))', border: '1px solid rgb(var(--accent) / 0.2)' }}>
                    {item.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold mb-2" style={{ color: 'rgb(var(--fg))' }}>{item.title}</div>
                    <CodeBlock code={item.code} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* REST API */}
          <section>
            <SectionHeader
              id="api"
              title="REST API Reference"
              sub="Base URL: http://localhost:3001 · All responses are JSON · OpenAPI spec at /openapi.json"
            />

            <div className="space-y-2">
              {ENDPOINTS.map(ep => {
                const style = METHOD_STYLE[ep.method];
                const isExpanded = expandedEndpoint === ep.path;
                return (
                  <div key={ep.path} className="card overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-[rgb(var(--bg-hover))]"
                      onClick={() => setExpandedEndpoint(isExpanded ? null : ep.path)}>
                      <span className="badge font-mono flex-shrink-0 text-[10px]"
                        style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}30` }}>
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono font-medium flex-1 text-left" style={{ color: 'rgb(var(--fg))' }}>
                        {ep.path}
                      </code>
                      <span className="text-xs hidden sm:block" style={{ color: 'rgb(var(--fg-muted))' }}>{ep.desc}</span>
                      <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        style={{ color: 'rgb(var(--fg-dim))' }} />
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgb(var(--border))' }}>
                        <div className="pt-3">
                          <span className="section-label">Description</span>
                          <p className="text-sm mt-1" style={{ color: 'rgb(var(--fg-muted))' }}>{ep.desc}</p>
                        </div>
                        <div>
                          <span className="section-label">Parameters</span>
                          <p className="text-xs font-mono mt-1" style={{ color: 'rgb(var(--fg-muted))' }}>{ep.params}</p>
                        </div>
                        {ep.example && (
                          <div>
                            <span className="section-label">Example</span>
                            <div className="mt-1">
                              <CodeBlock code={ep.example} lang="bash" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* CLI Reference */}
          <section>
            <SectionHeader
              id="cli"
              title="CLI Reference"
              sub="helios CLI — install via cargo install helios-cli or download from GitHub Releases."
            />

            <CodeBlock lang="bash" code={`# Install from source
cargo install --path crates/helios-cli

# Or download binary (Linux/Mac/Windows)
curl -sSL https://github.com/vignesh2027/helios-cloud/releases/latest/download/helios.tar.gz | tar xz
sudo mv helios /usr/local/bin/`} />

            <div className="mt-4 space-y-1.5">
              {CLI_COMMANDS.map(c => (
                <div key={c.cmd} className="card px-4 py-3 flex items-center gap-4">
                  <code className="text-xs font-mono flex-shrink-0 w-72" style={{ color: 'rgb(var(--accent))' }}>
                    {c.cmd}
                  </code>
                  <span className="text-xs" style={{ color: 'rgb(var(--fg-muted))' }}>{c.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* TypeScript SDK */}
          <section>
            <SectionHeader
              id="sdk"
              title="TypeScript SDK"
              sub="@helios-cloud/sdk — fluent API for integrating HELIOS into your own tools and dashboards."
            />

            <CodeBlock lang="bash" code="npm install @helios-cloud/sdk   # or: pnpm add @helios-cloud/sdk" />

            <div className="mt-4">
              <CodeBlock lang="typescript" code={`import { HeliosClient } from '@helios-cloud/sdk';

const helios = new HeliosClient({ baseUrl: 'http://localhost:3001' });

// Get resource summary
const summary = await helios.resources.summary();
console.log(\`Total: \${summary.total} resources\`);

// Get cost recommendations
const { recommendations } = await helios.cost.summary();
recommendations.forEach(r => {
  console.log(\`\${r.resourceId}: save \$\${r.estimatedMonthlySavings}/mo via \${r.action}\`);
});

// Detect Terraform drift
const drifts = await helios.drift.detect({ stateFile: './terraform.tfstate' });
drifts.forEach(d => {
  console.log(\`\${d.resourceId} [\${d.severity}]: \${d.changes.join(', ')}\`);
});

// Real-time event stream
const ws = helios.events.stream();
ws.on('drift',   e => console.log('Drift detected:', e));
ws.on('policy',  e => console.log('Violation:', e));
ws.on('scan',    e => console.log('Scan event:', e));`} />
            </div>
          </section>

          {/* Rust Scanner */}
          <section>
            <SectionHeader
              id="scanner"
              title="Rust Scanner"
              sub="helios-scanner — high-performance async AWS scanner built in Rust. Discovers 847 resources in ~3 seconds."
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Scan speed',   value: '< 3 seconds', sub: 'All regions, concurrent' },
                { label: 'Resources',    value: '20+ types',    sub: 'EC2, S3, Lambda, RDS …' },
                { label: 'Test suite',   value: '24 tests',     sub: 'cargo test -p helios-scanner' },
              ].map(m => (
                <div key={m.label} className="card p-4 text-center">
                  <div className="text-xl font-bold font-mono mb-1" style={{ color: 'rgb(var(--accent))' }}>{m.value}</div>
                  <div className="text-xs font-semibold" style={{ color: 'rgb(var(--fg))' }}>{m.label}</div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>{m.sub}</div>
                </div>
              ))}
            </div>

            <CodeBlock lang="bash" code={`# Build the scanner
cargo build --release -p helios-scanner

# Run as a standalone HTTP server (port 3030)
./target/release/helios-scanner serve

# One-shot scan to stdout
./target/release/helios-scanner scan --region us-east-1 --output json

# Run the test suite
cargo test -p helios-scanner

# Clippy lint check
cargo clippy -p helios-scanner --all-targets -- -D warnings`} />

            <div className="mt-4">
              <h3 className="text-sm font-bold mb-2" style={{ color: 'rgb(var(--fg))' }}>Supported Resource Types</h3>
              <div className="flex flex-wrap gap-2">
                {['ec2:instance', 's3:bucket', 'lambda:function', 'rds:db-instance', 'eks:cluster', 'iam:role',
                  'iam:user', 'ec2:security-group', 'ec2:volume', 'ec2:vpc', 'ec2:subnet', 'ec2:nat-gateway',
                  'elb:load-balancer', 'cloudwatch:alarm', 'sts:account'].map(t => (
                  <span key={t} className="text-[10px] font-mono px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgb(var(--bg-elevated))', color: 'rgb(var(--fg-muted))', border: '1px solid rgb(var(--border))' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Deployment */}
          <section>
            <SectionHeader
              id="deploy"
              title="Deployment"
              sub="Deploy HELIOS to Kubernetes with the included Helm chart, or to EKS using the Terraform modules."
            />

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: 'rgb(var(--fg))' }}>Docker Compose (local)</h3>
                <CodeBlock lang="bash" code={`docker compose up -d
# Services: helios-api (3001), dashboard (3000)`} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: 'rgb(var(--fg))' }}>Helm (Kubernetes)</h3>
                <CodeBlock lang="bash" code={`helm install helios ./charts/helios/ \\
  --set aws.accountId=123456789012 \\
  --set aws.region=us-east-1 \\
  --set image.tag=latest`} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: 'rgb(var(--fg))' }}>Terraform (AWS EKS)</h3>
                <CodeBlock lang="bash" code={`cd terraform/
terraform init
terraform plan -var="account_id=123456789012"
terraform apply`} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: 'rgb(var(--fg))' }}>GitHub Pages (static demo)</h3>
                <CodeBlock lang="bash" code={`# Push to main branch — GitHub Actions auto-deploys
git push origin main

# Live at: https://vignesh2027.github.io/helios-cloud/`} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: 'rgb(var(--fg))' }}>Environment Variables</h3>
                <div className="space-y-1.5">
                  {[
                    { key: 'AWS_REGION',             val: 'us-east-1',  desc: 'Primary AWS region to scan'          },
                    { key: 'AWS_PROFILE',             val: 'default',    desc: 'AWS credential profile'             },
                    { key: 'HELIOS_SCAN_INTERVAL',    val: '300',        desc: 'Scan interval in seconds (default 5m)' },
                    { key: 'HELIOS_API_PORT',         val: '3001',       desc: 'API server port'                    },
                    { key: 'HELIOS_LOG_LEVEL',        val: 'info',       desc: 'Log level: trace/debug/info/warn/error' },
                    { key: 'NEXT_PUBLIC_DEMO_MODE',   val: 'true',       desc: 'Use mock data (no AWS credentials)' },
                    { key: 'NEXT_PUBLIC_API_URL',     val: 'http://localhost:3001', desc: 'Dashboard → API base URL' },
                  ].map(e => (
                    <div key={e.key} className="card px-4 py-3 flex items-center gap-4 flex-wrap">
                      <code className="text-xs font-mono font-bold flex-shrink-0" style={{ color: 'rgb(var(--accent))' }}>{e.key}</code>
                      <code className="text-xs font-mono flex-shrink-0" style={{ color: 'rgb(var(--fg-muted))' }}>{e.val}</code>
                      <span className="text-xs flex-1" style={{ color: 'rgb(var(--fg-dim))' }}>{e.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* footer */}
          <div className="card p-5 flex items-center justify-between flex-wrap gap-4"
            style={{ background: 'rgb(var(--bg-elevated))' }}>
            <div>
              <div className="text-sm font-bold" style={{ color: 'rgb(var(--fg))' }}>Open Source · Apache-2.0</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>
                Contributions welcome · github.com/vignesh2027/helios-cloud
              </div>
            </div>
            <a href="https://github.com/vignesh2027/helios-cloud"
              className="flex items-center gap-2 btn-secondary text-xs px-4 py-2">
              View on GitHub <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
