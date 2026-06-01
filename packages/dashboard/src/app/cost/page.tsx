'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { heliosApi } from '../../lib/api';
import { MetricCard } from '../../components/ui/MetricCard';
import { CostTrendChart } from '../../components/charts/CostTrendChart';
import { DollarSign, TrendingDown, Zap, ChevronDown, ChevronRight } from 'lucide-react';

const ACTION_META: Record<string, { label: string; color: string; bg: string }> = {
  rightsize:       { label: 'RIGHTSIZE',    color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  terminate:       { label: 'TERMINATE',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
  schedule:        { label: 'SCHEDULE',     color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  'savings-plan':  { label: 'SAVINGS PLAN', color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  'storage-tier':  { label: 'STORAGE TIER', color: '#facc15', bg: 'rgba(250,204,21,0.1)'  },
  'delete-snapshot': { label: 'DELETE',     color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
};

export default function CostPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['cost', 'summary'],
    queryFn: () => heliosApi.getCostSummary(),
    refetchInterval: 120_000,
  });

  const allRecs = data?.recommendations ?? [];
  const filtered = actionFilter === 'All' ? allRecs : allRecs.filter(r => r.action === actionFilter);
  const actions = ['All', ...new Set(allRecs.map(r => r.action))];

  const metrics = [
    { title: 'Monthly Spend',     value: data ? `$${data.totalMonthlyCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—',       icon: DollarSign,  color: 'orange' as const },
    { title: 'Annual Spend',      value: data ? `$${(data.totalAnnualCost / 1000).toFixed(0)}k`                : '—',       icon: DollarSign,  color: 'red'    as const },
    { title: 'Potential Savings', value: data ? `$${data.potentialMonthlySavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo` : '—', icon: TrendingDown, color: 'green' as const, sub: data ? `${data.savingsPercentage.toFixed(1)}% of total` : undefined },
    { title: 'Recommendations',   value: String(allRecs.length),                                                 icon: Zap,         color: 'blue'   as const },
  ];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto animate-fade-in">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--fg))' }}>Cost Optimizer</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>
          ML-driven rightsizing, idle detection, and savings opportunities
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(m => <MetricCard key={m.title} {...m} loading={isLoading} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CostTrendChart data={data?.trend ?? []} loading={isLoading} />

        {/* By Region breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'rgb(var(--fg))' }}>Spend by Region</h3>
          {isLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(data?.byRegion ?? {}).sort((a, b) => b[1] - a[1]).map(([region, amount]) => {
                const max = Math.max(...Object.values(data?.byRegion ?? {}));
                const pct = max > 0 ? (amount / max) * 100 : 0;
                return (
                  <div key={region} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono" style={{ color: 'rgb(var(--fg-muted))' }}>{region}</span>
                      <span className="font-bold font-mono" style={{ color: 'rgb(var(--fg))' }}>${amount.toLocaleString()}/mo</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border))' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f97316, #facc15)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>All Recommendations</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>
              {filtered.length} opportunities · ${filtered.reduce((s, r) => s + r.monthlySavings, 0).toFixed(0)}/mo total savings
            </p>
          </div>
          <div className="relative flex items-center input-base px-2.5 py-1.5 gap-1">
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="appearance-none bg-transparent text-xs focus:outline-none cursor-pointer pr-5"
              style={{ color: 'rgb(var(--fg))' }}
            >
              {actions.map(a => <option key={a} value={a}>{a === 'All' ? 'All actions' : ACTION_META[a]?.label ?? a}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: 'rgb(var(--fg-dim))' }} />
          </div>
        </div>

        <div className="divide-y" style={{ '--tw-divide-opacity': '1' } as React.CSSProperties}>
          {isLoading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center" style={{ color: 'rgb(var(--fg-dim))' }}>No recommendations found</div>
          ) : (
            filtered.map((rec, i) => {
              const meta = ACTION_META[rec.action] ?? { label: rec.action, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
              const isOpen = expanded === rec.resourceId;
              return (
                <div key={`${rec.resourceId}-${i}`} style={{ borderColor: 'rgb(var(--border-soft))' }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : rec.resourceId)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[rgb(var(--bg-elevated))]"
                    style={{ background: 'transparent' }}
                  >
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded flex-shrink-0" style={{ color: meta.color, background: meta.bg }}>
                      {meta.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono" style={{ color: 'rgb(var(--fg-muted))' }}>
                        {rec.currentConfig} <span style={{ color: 'rgb(var(--fg-dim))' }}>→</span> {rec.recommendedConfig}
                      </div>
                      <div className="text-[11px] truncate mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>{rec.rationale}</div>
                    </div>
                    <div className="text-right flex-shrink-0 mr-2">
                      <div className="text-sm font-bold font-mono" style={{ color: '#4ade80' }}>${rec.monthlySavings.toFixed(0)}/mo</div>
                      <div className="text-[10px]" style={{ color: 'rgb(var(--fg-dim))' }}>{(rec.confidenceScore * 100).toFixed(0)}% confidence</div>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} style={{ color: 'rgb(var(--fg-dim))' }} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4" style={{ background: 'rgb(var(--bg-elevated))', borderTop: '1px solid rgb(var(--border-soft))' }}>
                      <div className="pt-3 space-y-2">
                        <div className="text-xs font-semibold" style={{ color: 'rgb(var(--fg-muted))' }}>Implementation Steps</div>
                        {rec.implementationSteps.map((step, si) => (
                          <div key={si} className="flex gap-2.5 text-xs">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{ background: meta.bg, color: meta.color }}>{si + 1}</span>
                            <span className="font-mono" style={{ color: 'rgb(var(--fg-muted))' }}>{step}</span>
                          </div>
                        ))}
                        <div className="flex gap-4 pt-2 text-[11px]">
                          <span style={{ color: 'rgb(var(--fg-dim))' }}>Effort: <span style={{ color: 'rgb(var(--fg-muted))' }}>{rec.effort}</span></span>
                          <span style={{ color: 'rgb(var(--fg-dim))' }}>Risk: <span style={{ color: rec.risk === 'low' ? '#4ade80' : rec.risk === 'medium' ? '#eab308' : '#ef4444' }}>{rec.risk}</span></span>
                          <span style={{ color: 'rgb(var(--fg-dim))' }}>Annual savings: <span style={{ color: '#4ade80' }}>${rec.annualSavings.toFixed(0)}</span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
