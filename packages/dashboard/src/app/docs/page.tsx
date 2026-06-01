'use client';

import { BookOpen, Terminal, Server, DollarSign, AlertTriangle, Shield, Zap, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const ENDPOINTS = [
  { method: 'GET',  path: '/resources',          desc: 'List all discovered resources',           params: 'provider, region, type, status, limit, offset' },
  { method: 'GET',  path: '/resources/:id',       desc: 'Get resource by ID',                      params: 'id (path)' },
  { method: 'GET',  path: '/resources/summary',   desc: 'Inventory counts by type/region/status',  params: '—' },
  { method: 'POST', path: '/scan',                desc: 'Trigger infrastructure scan (async)',     params: '—' },
  { method: 'GET',  path: '/cost/summary',        desc: 'Full cost report with recommendations',   params: '—' },
  { method: 'GET',  path: '/cost/recommendations',desc: 'Filterable cost recommendations',         params: 'action, minSavings, region, limit' },
  { method: 'GET',  path: '/drift',               desc: 'Run drift detection vs Terraform state',  params: 'stateFile (required)' },
  { method: 'GET',  path: '/policy/compliance',   desc: 'Evaluate CIS/SOC2/PCI compliance',        params: 'framework (required)' },
  { method: 'GET',  path: '/policy/violations',   desc: 'List active policy violations',           params: 'framework, severity, resourceType, limit' },
  { method: 'WS',   path: '/ws/events',           desc: 'Real-time drift/violation/scan events',   params: '—' },
  { method: 'GET',  path: '/healthz',             desc: 'Health check',                            params: '—' },
  { method: 'GET',  path: '/metrics',             desc: 'Prometheus metrics endpoint',             params: '—' },
];

const METHOD_COLOR: Record<string, { color: string; bg: string }> = {
  GET:  { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  POST: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  WS:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)'},
};

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group rounded-xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[10px] font-mono" style={{ color: '#6b7280' }}>{lang}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="flex items-center gap-1 text-[10px] font-mono transition-colors"
          style={{ color: copied ? '#4ade80' : '#6b7280' }}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-xs overflow-x-auto" style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6 }}>
        {code}
      </pre>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--fg))' }}>API Reference</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>
          HELIOS REST API · Base URL: <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgb(var(--bg-elevated))' }}>http://localhost:8080/api/v1</code>
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: Terminal,      label: 'CLI Docs',          sub: 'helios --help' },
          { icon: Server,        label: 'Resource API',      sub: 'CRUD + scanning' },
          { icon: DollarSign,    label: 'Cost API',          sub: 'Recommendations' },
          { icon: AlertTriangle, label: 'Drift API',         sub: 'State comparison' },
          { icon: Shield,        label: 'Policy API',        sub: 'CIS / SOC2' },
          { icon: Zap,           label: 'WebSocket',         sub: 'Real-time events' },
        ].map(item => (
          <div key={item.label} className="card p-4 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform">
            <div className="p-2 rounded-lg" style={{ background: 'rgb(var(--bg-elevated))' }}>
              <item.icon className="w-4 h-4" style={{ color: 'rgb(var(--accent))' }} />
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: 'rgb(var(--fg))' }}>{item.label}</div>
              <div className="text-[11px]" style={{ color: 'rgb(var(--fg-dim))' }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick start */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>Quick Start</h3>
        <CodeBlock lang="bash" code={`# Install HELIOS CLI
npm install -g @helios-cloud/cli

# Configure AWS credentials
helios config init

# Scan infrastructure
helios scan --provider aws --region us-east-1

# Get cost recommendations
helios optimize --top 10

# Detect drift
helios drift --state-file ./terraform.tfstate --remediate

# Check policy compliance
helios policy check --framework cis-aws-1.5`} />
      </div>

      {/* SDK usage */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>SDK Usage</h3>
        <CodeBlock lang="typescript" code={`import { HeliosClient } from '@helios-cloud/sdk';

const helios = new HeliosClient({
  provider: 'aws',
  region: 'us-east-1',
  credentials: { profile: 'default' },
});

// Scan all resources
const { total, graph } = await helios.scan();
console.log(\`Discovered \${total} resources\`);

// Get top cost recommendations
const recs = await helios.optimizer.getTopSavings(5);
for (const r of recs) {
  console.log(\`\${r.action}: save \$\${r.monthlySavings.toFixed(0)}/mo\`);
}

// Detect infrastructure drift
const drift = await helios.drift.detect('./terraform.tfstate');
if (drift.hasDrift) {
  console.log(\`\${drift.totalDrifted} drifted resources\`);
  console.log(\`Critical: \${drift.bySeverity.critical}\`);
}

// Evaluate policy compliance
const score = await helios.policy.getScore('cis-aws-1.5');
console.log(\`CIS compliance: \${score.toFixed(0)}%\`);`} />
      </div>

      {/* REST endpoints */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>REST Endpoints</h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>All endpoints available at <code className="font-mono">/api/v1</code></p>
        </div>
        <div>
          {ENDPOINTS.map((e, i) => {
            const m = METHOD_COLOR[e.method]!;
            return (
              <div key={e.path} className="flex items-start gap-3 px-5 py-3"
                style={{ borderBottom: i < ENDPOINTS.length - 1 ? '1px solid rgb(var(--border-soft))' : 'none' }}>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 w-10 text-center"
                  style={{ color: m.color, background: m.bg }}>{e.method}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono" style={{ color: 'rgb(var(--fg))' }}>{e.path}</code>
                    <ExternalLink className="w-3 h-3" style={{ color: 'rgb(var(--fg-dim))' }} />
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>{e.desc}</div>
                  {e.params !== '—' && (
                    <div className="text-[10px] mt-0.5 font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>params: {e.params}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Links */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgb(var(--fg))' }}>External Resources</h3>
        <div className="space-y-2">
          {[
            { label: 'GitHub Repository',    href: 'https://github.com/vignesh2027/helios-cloud' },
            { label: 'OpenAPI / Swagger UI', href: 'http://localhost:8080/docs' },
            { label: 'Prometheus Metrics',   href: 'http://localhost:8080/metrics' },
            { label: 'Architecture Diagram', href: 'https://github.com/vignesh2027/helios-cloud/blob/main/docs/assets/architecture.svg' },
          ].map(link => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs transition-colors hover:underline"
              style={{ color: 'rgb(var(--accent))' }}>
              <ExternalLink className="w-3 h-3" />
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
