'use client';

import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { Server, DollarSign, AlertTriangle, Shield, CheckCircle, Globe } from 'lucide-react';

const ACCOUNTS = [
  {
    id: '123456789012', alias: 'production',  env: 'Production', region: 'us-east-1',
    resources: 547, monthlyCost: 16200, violations: 8, drifted: 5,
    complianceScore: 87, status: 'healthy' as const,
  },
  {
    id: '234567890123', alias: 'staging',     env: 'Staging',    region: 'us-east-1',
    resources: 213, monthlyCost: 5800,  violations: 3, drifted: 2,
    complianceScore: 91, status: 'healthy' as const,
  },
  {
    id: '345678901234', alias: 'dev-sandbox', env: 'Development', region: 'us-west-2',
    resources: 87,  monthlyCost: 2810,  violations: 3, drifted: 0,
    complianceScore: 79, status: 'warning' as const,
  },
];

const ENV_COLOR: Record<string, string> = {
  Production:  '#ef4444',
  Staging:     '#eab308',
  Development: '#60a5fa',
};

const STATUS_META = {
  healthy: { color: '#4ade80', label: 'Healthy' },
  warning: { color: '#eab308', label: 'Warning' },
  critical:{ color: '#ef4444', label: 'Critical' },
};

export default function AccountsPage() {
  const totals = {
    resources:     ACCOUNTS.reduce((s, a) => s + a.resources, 0),
    monthlyCost:   ACCOUNTS.reduce((s, a) => s + a.monthlyCost, 0),
    violations:    ACCOUNTS.reduce((s, a) => s + a.violations, 0),
    drifted:       ACCOUNTS.reduce((s, a) => s + a.drifted, 0),
    avgCompliance: Math.round(ACCOUNTS.reduce((s, a) => s + a.complianceScore, 0) / ACCOUNTS.length),
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto animate-fade-in">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--fg))' }}>Multi-Account View</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>
          Aggregated view across {ACCOUNTS.length} AWS accounts
        </p>
      </div>

      {/* Aggregate totals */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Resources', value: totals.resources,   icon: Server,        color: '#60a5fa' },
          { label: 'Monthly Spend',   value: totals.monthlyCost, icon: DollarSign,    color: '#f97316', prefix: '$' },
          { label: 'Violations',      value: totals.violations,  icon: AlertTriangle, color: '#ef4444' },
          { label: 'Drift',           value: totals.drifted,     icon: Globe,         color: '#eab308' },
          { label: 'Avg Compliance',  value: totals.avgCompliance, icon: Shield,      color: '#a78bfa', suffix: '%' },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: m.color }} />
                <span className="text-xs" style={{ color: 'rgb(var(--fg-muted))' }}>{m.label}</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: 'rgb(var(--fg))' }}>
                <AnimatedCounter value={m.value} prefix={m.prefix ?? ''} suffix={m.suffix ?? ''} duration={800} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Spend comparison bar */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'rgb(var(--fg))' }}>Spend by Account</h3>
        <div className="space-y-3">
          {ACCOUNTS.sort((a, b) => b.monthlyCost - a.monthlyCost).map(acct => {
            const pct = (acct.monthlyCost / totals.monthlyCost) * 100;
            const envColor = ENV_COLOR[acct.env] ?? '#6b7280';
            return (
              <div key={acct.id}>
                <div className="flex justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                      style={{ color: envColor, background: `${envColor}18`, border: `1px solid ${envColor}33` }}>
                      {acct.env}
                    </span>
                    <span className="font-mono" style={{ color: 'rgb(var(--fg-muted))' }}>{acct.alias}</span>
                    <span style={{ color: 'rgb(var(--fg-dim))' }}>{acct.id}</span>
                  </div>
                  <span className="font-bold font-mono" style={{ color: 'rgb(var(--fg))' }}>
                    ${acct.monthlyCost.toLocaleString()}/mo
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border))' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${envColor}, ${envColor}88)` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-account cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {ACCOUNTS.map(acct => {
          const sm = STATUS_META[acct.status];
          const envColor = ENV_COLOR[acct.env] ?? '#6b7280';
          return (
            <div key={acct.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded font-mono font-bold"
                      style={{ color: envColor, background: `${envColor}18`, border: `1px solid ${envColor}33` }}>
                      {acct.env}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: sm.color }} />
                  </div>
                  <div className="text-base font-bold font-mono" style={{ color: 'rgb(var(--fg))' }}>{acct.alias}</div>
                  <div className="text-[11px] font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>{acct.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono" style={{ color: '#f97316' }}>
                    ${acct.monthlyCost.toLocaleString()}
                  </div>
                  <div className="text-[10px]" style={{ color: 'rgb(var(--fg-dim))' }}>/month</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Resources', value: acct.resources,         icon: Server,        color: '#60a5fa' },
                  { label: 'Violations',value: acct.violations,        icon: AlertTriangle, color: '#ef4444' },
                  { label: 'Drifted',   value: acct.drifted,           icon: Globe,         color: '#eab308' },
                  { label: 'Compliance',value: `${acct.complianceScore}%`, icon: CheckCircle, color: '#4ade80' },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="p-2.5 rounded-xl" style={{ background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border-soft))' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3" style={{ color: stat.color }} />
                        <span className="text-[10px]" style={{ color: 'rgb(var(--fg-dim))' }}>{stat.label}</span>
                      </div>
                      <div className="text-sm font-bold font-mono" style={{ color: 'rgb(var(--fg))' }}>{stat.value}</div>
                    </div>
                  );
                })}
              </div>

              {/* Compliance bar */}
              <div>
                <div className="flex justify-between text-[10px] mb-1 font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>
                  <span>CIS Compliance</span>
                  <span style={{ color: acct.complianceScore >= 85 ? '#4ade80' : '#eab308' }}>{acct.complianceScore}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border))' }}>
                  <div className="h-full rounded-full" style={{ width: `${acct.complianceScore}%`, background: acct.complianceScore >= 85 ? '#4ade80' : '#eab308', transition: 'width 0.8s ease' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
