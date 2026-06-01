'use client';

import { useQuery } from '@tanstack/react-query';
import { heliosApi } from '../lib/api';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { LiveFeed } from '../components/ui/LiveFeed';
import { CostTrendChart } from '../components/charts/CostTrendChart';
import { ResourceTypeDonut } from '../components/charts/ResourceTypeDonut';
import { DriftSeverityBar } from '../components/charts/DriftSeverityBar';
import { ComplianceTrendChart } from '../components/charts/ComplianceTrendChart';
import { TopRecommendations } from '../components/ui/TopRecommendations';
import { ScanStatusBadge } from '../components/ui/ScanStatusBadge';
import {
  Server, DollarSign, AlertTriangle, Shield,
  Activity, TrendingDown, Zap, Globe,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { icon: Zap,           label: 'Trigger Scan',      sub: 'Scan all regions',      color: '#f97316' },
  { icon: TrendingDown,  label: 'Optimize Costs',    sub: '5 recommendations',     color: '#4ade80' },
  { icon: AlertTriangle, label: 'Check Drift',        sub: 'vs terraform.tfstate',  color: '#eab308' },
  { icon: Shield,        label: 'Run Compliance',    sub: 'CIS AWS 1.5',           color: '#60a5fa' },
];

export default function DashboardPage() {
  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['resources', 'summary'],
    queryFn: () => heliosApi.getResourceSummary(),
    refetchInterval: 30_000,
  });

  const { data: costData, isLoading: costLoading } = useQuery({
    queryKey: ['cost', 'summary'],
    queryFn: () => heliosApi.getCostSummary(),
    refetchInterval: 120_000,
  });

  const statsLoading = sumLoading || costLoading;

  const kpis = [
    {
      label: 'Total Resources',
      value: summary?.total ?? 0,
      icon: Server,
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.1)',
      border: 'rgba(96,165,250,0.2)',
      prefix: '',
      suffix: '',
      sub: `${(summary?.byStatus?.['active'] ?? 0).toLocaleString()} active`,
    },
    {
      label: 'Monthly Spend',
      value: costData?.totalMonthlyCost ?? 0,
      icon: DollarSign,
      color: '#f97316',
      bg: 'rgba(249,115,22,0.1)',
      border: 'rgba(249,115,22,0.2)',
      prefix: '$',
      suffix: '',
      sub: `$${((costData?.totalAnnualCost ?? 0) / 1000).toFixed(0)}k annual`,
    },
    {
      label: 'Potential Savings',
      value: costData?.potentialMonthlySavings ?? 0,
      icon: TrendingDown,
      color: '#4ade80',
      bg: 'rgba(74,222,128,0.1)',
      border: 'rgba(74,222,128,0.2)',
      prefix: '$',
      suffix: '/mo',
      sub: `${(costData?.savingsPercentage ?? 0).toFixed(1)}% of spend`,
    },
    {
      label: 'Compliance Score',
      value: 87,
      icon: Shield,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.1)',
      border: 'rgba(167,139,250,0.2)',
      prefix: '',
      suffix: '%',
      sub: 'CIS AWS 1.5 · Grade B+',
    },
    {
      label: 'Drifted Resources',
      value: 7,
      icon: AlertTriangle,
      color: '#eab308',
      bg: 'rgba(234,179,8,0.1)',
      border: 'rgba(234,179,8,0.2)',
      prefix: '',
      suffix: '',
      sub: '2 critical · 3 high',
    },
    {
      label: 'Policy Violations',
      value: 14,
      icon: Activity,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.2)',
      prefix: '',
      suffix: '',
      sub: 'Across 3 frameworks',
    },
    {
      label: 'Regions Covered',
      value: Object.keys(summary?.byRegion ?? {}).length || 4,
      icon: Globe,
      color: '#34d399',
      bg: 'rgba(52,211,153,0.1)',
      border: 'rgba(52,211,153,0.2)',
      prefix: '',
      suffix: '',
      sub: 'us, eu, ap',
    },
    {
      label: 'Orphaned Resources',
      value: summary?.orphaned ?? 23,
      icon: Server,
      color: '#fb923c',
      bg: 'rgba(251,146,60,0.1)',
      border: 'rgba(251,146,60,0.2)',
      prefix: '',
      suffix: '',
      sub: 'No dependencies',
    },
  ];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--fg))' }}>
            Infrastructure Overview
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--fg-muted))' }}>
            Real-time view across AWS · Multi-account · 4 regions
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <ScanStatusBadge />
        </div>
      </div>

      {/* ── Hero KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="card p-3.5 relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.03]"
              style={{ border: `1px solid ${kpi.border}` }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${kpi.color}, transparent)` }} />
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg" style={{ background: kpi.bg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                </div>
              </div>
              {statsLoading ? (
                <div className="skeleton h-6 w-16 mt-1 rounded" />
              ) : (
                <div className="text-[1.25rem] font-bold font-mono leading-none" style={{ color: 'rgb(var(--fg))' }}>
                  <AnimatedCounter
                    value={kpi.value}
                    prefix={kpi.prefix}
                    suffix={kpi.suffix}
                    decimals={0}
                    duration={1000}
                  />
                </div>
              )}
              <div className="text-[10px] mt-1.5 font-medium" style={{ color: 'rgb(var(--fg-muted))' }}>
                {kpi.label}
              </div>
              <div className="text-[9px] mt-0.5 font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {QUICK_ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              className="card p-3.5 flex items-center gap-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ cursor: 'pointer' }}
            >
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${action.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: action.color }} />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'rgb(var(--fg))' }}>{action.label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>{action.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Charts Row 1: Cost + Donut + Live Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <CostTrendChart data={costData?.trend ?? []} loading={costLoading} />
        </div>
        <div className="lg:col-span-3">
          <ResourceTypeDonut data={summary?.byType ?? {}} loading={sumLoading} />
        </div>
        <div className="lg:col-span-4" style={{ minHeight: 280 }}>
          <LiveFeed />
        </div>
      </div>

      {/* ── Charts Row 2: Drift + Compliance Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DriftSeverityBar />
        <ComplianceTrendChart />
      </div>

      {/* ── Recommendations ── */}
      <TopRecommendations
        recommendations={costData?.recommendations?.slice(0, 5) ?? []}
        loading={costLoading}
      />

      {/* ── Account summary footer ── */}
      <div className="card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'AWS Account',      value: '123456789012', mono: true },
            { label: 'Scanner Engine',   value: 'helios-scanner (Rust 1.95)', mono: true },
            { label: 'Last Full Scan',   value: '2 min ago',    mono: false },
            { label: 'Next Scheduled',   value: 'in 3 min',     mono: false },
          ].map(item => (
            <div key={item.label}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'rgb(var(--fg-dim))' }}>
                {item.label}
              </div>
              <div className={`text-xs ${item.mono ? 'font-mono' : ''}`} style={{ color: 'rgb(var(--fg-muted))' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
