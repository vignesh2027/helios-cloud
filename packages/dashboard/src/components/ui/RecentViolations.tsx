'use client';

import { useQuery } from '@tanstack/react-query';
import { heliosApi } from '../../lib/api';
import { Shield, ArrowRight, CheckCircle } from 'lucide-react';

const SEVERITY_META: Record<string, { color: string; bg: string }> = {
  critical:      { color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
  high:          { color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
  medium:        { color: '#eab308', bg: 'rgba(234,179,8,0.1)'   },
  low:           { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  informational: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
};

export function RecentViolations() {
  const { data, isLoading } = useQuery({
    queryKey: ['policy', 'violations'],
    queryFn: () => heliosApi.getPolicyViolations({ limit: 5 }),
    refetchInterval: 60_000,
  });

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <Shield className="w-4 h-4" style={{ color: '#ef4444' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>
              Policy Violations
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>
              CIS AWS 1.5 · real-time
            </p>
          </div>
        </div>
        <button
          className="text-xs font-medium flex items-center gap-1"
          style={{ color: 'rgb(var(--accent))' }}
        >
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : !data || data.violations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(74,222,128,0.1)' }}>
            <CheckCircle className="w-5 h-5" style={{ color: '#4ade80' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'rgb(var(--fg-muted))' }}>
            No violations
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--fg-dim))' }}>
            Infrastructure is compliant ✓
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.violations.map((v, i) => {
            const meta = SEVERITY_META[v.severity] ?? SEVERITY_META['low']!;
            return (
              <div
                key={`${v.ruleId}-${i}`}
                className="group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                style={{
                  background: 'rgb(var(--bg-elevated))',
                  border: '1px solid rgb(var(--border-soft))',
                }}
              >
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                  style={{ color: meta.color, background: meta.bg }}
                >
                  {v.severity.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: 'rgb(var(--fg))' }}>
                    {v.ruleName}
                  </div>
                  <div className="text-[11px] truncate mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>
                    {v.message}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'rgb(var(--fg-dim))' }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
