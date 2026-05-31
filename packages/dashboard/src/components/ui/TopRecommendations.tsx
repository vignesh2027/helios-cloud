'use client';

import type { CostRecommendation } from '../../lib/types';
import { TrendingDown, ArrowRight, Zap } from 'lucide-react';

const ACTION_META: Record<string, { label: string; color: string; bg: string }> = {
  'rightsize':     { label: 'RIGHTSIZE',    color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  'terminate':     { label: 'TERMINATE',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
  'schedule':      { label: 'SCHEDULE',     color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  'savings-plan':  { label: 'SAVINGS PLAN', color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  'storage-tier':  { label: 'STORAGE',      color: '#facc15', bg: 'rgba(250,204,21,0.1)'  },
  'delete-snapshot':{ label: 'DELETE',      color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
};

const RISK_COLOR: Record<string, string> = {
  low: '#4ade80', medium: '#eab308', high: '#ef4444',
};

interface TopRecommendationsProps {
  recommendations: CostRecommendation[];
  loading?: boolean;
}

export function TopRecommendations({ recommendations, loading }: TopRecommendationsProps) {
  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(74,222,128,0.1)' }}>
            <TrendingDown className="w-4 h-4" style={{ color: '#4ade80' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>
              Cost Recommendations
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>
              Top savings opportunities
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

      {loading ? (
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(74,222,128,0.1)' }}>
            <Zap className="w-5 h-5" style={{ color: '#4ade80' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'rgb(var(--fg-muted))' }}>
            No recommendations
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--fg-dim))' }}>
            Run a scan to analyze costs
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recommendations.map((rec, i) => {
            const meta = ACTION_META[rec.action] ?? { label: rec.action.toUpperCase(), color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
            return (
              <div
                key={`${rec.resourceId}-${i}`}
                className="group flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer"
                style={{
                  background: 'rgb(var(--bg-elevated))',
                  border: '1px solid rgb(var(--border-soft))',
                }}
              >
                {/* rank */}
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0"
                  style={{ background: 'rgb(var(--border))', color: 'rgb(var(--fg-dim))' }}
                >
                  {i + 1}
                </div>

                {/* action badge */}
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ color: meta.color, background: meta.bg }}
                >
                  {meta.label}
                </span>

                {/* desc */}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono truncate" style={{ color: 'rgb(var(--fg-muted))' }}>
                    {rec.currentConfig}
                    <span className="mx-1" style={{ color: 'rgb(var(--fg-dim))' }}>→</span>
                    {rec.recommendedConfig}
                  </div>
                  <div className="text-[10px] truncate mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>
                    {rec.rationale.slice(0, 60)}{rec.rationale.length > 60 ? '…' : ''}
                  </div>
                </div>

                {/* savings */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold font-mono" style={{ color: '#4ade80' }}>
                    ${rec.monthlySavings.toFixed(0)}
                  </div>
                  <div className="text-[9px] font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>
                    /mo · <span style={{ color: RISK_COLOR[rec.risk] ?? '#6b7280' }}>{rec.risk} risk</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
