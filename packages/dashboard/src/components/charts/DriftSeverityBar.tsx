'use client';

import { AlertTriangle } from 'lucide-react';

const SEVERITY = [
  { key: 'critical', label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  count: 2  },
  { key: 'high',     label: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.1)', count: 5  },
  { key: 'medium',   label: 'Medium',   color: '#eab308', bg: 'rgba(234,179,8,0.1)',  count: 12 },
  { key: 'low',      label: 'Low',      color: '#6b7280', bg: 'rgba(107,114,128,0.1)',count: 8  },
];

export function DriftSeverityBar() {
  const total = SEVERITY.reduce((s, d) => s + d.count, 0);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(234,179,8,0.1)' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: '#eab308' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>
              Infrastructure Drift
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>
              {total} drifted resources · checked 5 min ago
            </p>
          </div>
        </div>
        <button
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{
            background: 'rgba(var(--accent) / 0.1)',
            color: 'rgb(var(--accent))',
            border: '1px solid rgba(var(--accent) / 0.2)',
          }}
        >
          Run check →
        </button>
      </div>

      {/* stacked progress bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden gap-px mb-5">
        {SEVERITY.map(s => (
          <div
            key={s.key}
            style={{
              width: `${(s.count / total) * 100}%`,
              background: s.color,
              transition: 'width 0.6s ease',
            }}
          />
        ))}
      </div>

      {/* severity grid */}
      <div className="grid grid-cols-4 gap-3">
        {SEVERITY.map(s => (
          <div
            key={s.key}
            className="rounded-xl p-3 text-center"
            style={{ background: s.bg, border: `1px solid ${s.color}22` }}
          >
            <div className="text-2xl font-bold font-mono leading-none" style={{ color: s.color }}>
              {s.count}
            </div>
            <div className="text-[11px] mt-1.5 font-medium capitalize" style={{ color: 'rgb(var(--fg-muted))' }}>
              {s.label}
            </div>
            <div className="text-[10px] mt-0.5 font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>
              {((s.count / total) * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
