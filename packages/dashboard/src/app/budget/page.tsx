'use client';

import { useState } from 'react';
import { DollarSign, Bell, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';

const BUDGETS = [
  { id: 'b1', name: 'Production Monthly',  threshold: 20000, current: 16200, forecast: 17800, period: 'Monthly', triggered: false, account: 'production'  },
  { id: 'b2', name: 'EC2 Compute',         threshold: 12000, current: 11200, forecast: 12400, period: 'Monthly', triggered: true,  account: 'production'  },
  { id: 'b3', name: 'Data Transfer',       threshold: 2000,  current: 1850,  forecast: 2100,  period: 'Monthly', triggered: true,  account: 'production'  },
  { id: 'b4', name: 'Staging Monthly',     threshold: 7000,  current: 5800,  forecast: 6100,  period: 'Monthly', triggered: false, account: 'staging'     },
  { id: 'b5', name: 'S3 Storage',          threshold: 500,   current: 380,   forecast: 410,   period: 'Monthly', triggered: false, account: 'production'  },
  { id: 'b6', name: 'Lambda Invocations',  threshold: 1000,  current: 920,   forecast: 980,   period: 'Monthly', triggered: false, account: 'staging'     },
];

const ANOMALIES = [
  { id: 'a1', service: 'Amazon EC2',    region: 'us-east-1', date: '2026-05-29', expected: 380,  actual: 510,  delta: '+34%', severity: 'high'     },
  { id: 'a2', service: 'Amazon S3',     region: 'us-east-1', date: '2026-05-28', expected: 42,   actual: 67,   delta: '+60%', severity: 'critical' },
  { id: 'a3', service: 'AWS Lambda',    region: 'us-west-2', date: '2026-05-27', expected: 18,   actual: 24,   delta: '+33%', severity: 'medium'   },
  { id: 'a4', service: 'Amazon RDS',    region: 'eu-west-1', date: '2026-05-26', expected: 520,  actual: 490,  delta: '-6%',  severity: 'info'     },
];

const SEV_META: Record<string, { color: string; bg: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
  medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.1)'   },
  info:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
};

export default function BudgetPage() {
  const [showTriggered, setShowTriggered] = useState(false);
  const visible = showTriggered ? BUDGETS.filter(b => b.triggered) : BUDGETS;
  const totalTriggered = BUDGETS.filter(b => b.triggered).length;

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--fg))' }}>Budget & Anomalies</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>
            Budget alerts, spend forecasting, and cost anomaly detection
          </p>
        </div>
        <button
          onClick={() => setShowTriggered(s => !s)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{
            background: showTriggered ? 'rgba(239,68,68,0.1)' : 'rgb(var(--bg-elevated))',
            border: `1px solid ${showTriggered ? 'rgba(239,68,68,0.3)' : 'rgb(var(--border))'}`,
            color: showTriggered ? '#ef4444' : 'rgb(var(--fg-muted))',
          }}
        >
          {showTriggered ? `Showing ${totalTriggered} triggered` : 'Show all'}
        </button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Budgets',    value: BUDGETS.length,      icon: DollarSign,   color: '#60a5fa' },
          { label: 'Triggered Alerts', value: totalTriggered,       icon: Bell,         color: '#ef4444' },
          { label: 'Total Spend',      value: 24810,               icon: TrendingUp,   color: '#f97316', prefix: '$' },
          { label: 'Anomalies',        value: ANOMALIES.length,     icon: AlertTriangle,color: '#eab308' },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: m.color }} />
                <span className="text-xs" style={{ color: 'rgb(var(--fg-muted))' }}>{m.label}</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: 'rgb(var(--fg))' }}>
                <AnimatedCounter value={m.value} prefix={m.prefix ?? ''} duration={800} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget cards */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgb(var(--fg))' }}>Budget Alerts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map(b => {
            const pct = Math.min((b.current / b.threshold) * 100, 100);
            const forecastPct = Math.min((b.forecast / b.threshold) * 100, 100);
            const barColor = pct > 90 ? '#ef4444' : pct > 75 ? '#eab308' : '#4ade80';
            return (
              <div
                key={b.id}
                className="card p-4 space-y-3"
                style={{ borderColor: b.triggered ? 'rgba(239,68,68,0.3)' : undefined }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'rgb(var(--fg))' }}>{b.name}</div>
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>{b.account}</div>
                  </div>
                  {b.triggered
                    ? <div className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                        <Bell className="w-2.5 h-2.5" />TRIGGERED
                      </div>
                    : <CheckCircle className="w-4 h-4" style={{ color: '#4ade80' }} />}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>
                    <span>Spend</span>
                    <span style={{ color: barColor }}>${b.current.toLocaleString()} / ${b.threshold.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden relative" style={{ background: 'rgb(var(--border))' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
                    <div className="absolute top-0 h-full border-l-2 border-dashed" style={{ left: `${forecastPct}%`, borderColor: '#eab30866' }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span style={{ color: 'rgb(var(--fg-dim))' }}>{pct.toFixed(0)}% used</span>
                    <span style={{ color: '#eab308' }}>Forecast: ${b.forecast.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anomalies */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>Cost Anomalies</h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>Detected deviations from expected spend</p>
        </div>
        <div>
          {ANOMALIES.map((a, i) => {
            const m = SEV_META[a.severity]!;
            const isPositive = a.delta.startsWith('-');
            return (
              <div
                key={a.id}
                className="flex items-center gap-4 px-5 py-3"
                style={{ borderBottom: i < ANOMALIES.length - 1 ? '1px solid rgb(var(--border-soft))' : 'none' }}
              >
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded w-16 text-center"
                  style={{ color: m.color, background: m.bg }}>
                  {a.severity.toUpperCase()}
                </span>
                <div className="flex-1">
                  <div className="text-xs font-medium" style={{ color: 'rgb(var(--fg))' }}>{a.service}</div>
                  <div className="text-[11px]" style={{ color: 'rgb(var(--fg-dim))' }}>{a.region} · {a.date}</div>
                </div>
                <div className="text-xs font-mono text-right">
                  <div style={{ color: 'rgb(var(--fg-muted))' }}>${a.expected}/day expected</div>
                  <div style={{ color: 'rgb(var(--fg))' }}>${a.actual}/day actual</div>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold font-mono"
                  style={{ color: isPositive ? '#4ade80' : m.color }}>
                  {isPositive ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  {a.delta}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
