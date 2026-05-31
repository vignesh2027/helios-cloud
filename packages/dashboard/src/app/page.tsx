'use client';

import { useQuery } from '@tanstack/react-query';
import { heliosApi } from '../lib/api';
import { MetricCard } from '../components/ui/MetricCard';
import { CostTrendChart } from '../components/charts/CostTrendChart';
import { ResourceTypeDonut } from '../components/charts/ResourceTypeDonut';
import { DriftSeverityBar } from '../components/charts/DriftSeverityBar';
import { RecentViolations } from '../components/ui/RecentViolations';
import { TopRecommendations } from '../components/ui/TopRecommendations';
import { ScanStatusBadge } from '../components/ui/ScanStatusBadge';
import {
  Server,
  DollarSign,
  AlertTriangle,
  Shield,
  Activity,
  TrendingDown,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['resources', 'summary'],
    queryFn: () => heliosApi.getResourceSummary(),
    refetchInterval: 30_000,
  });

  const { data: costSummary, isLoading: costLoading } = useQuery({
    queryKey: ['cost', 'summary'],
    queryFn: () => heliosApi.getCostSummary(),
    refetchInterval: 120_000,
  });

  const isLoading = summaryLoading || costLoading;

  const metrics = [
    {
      title: 'Total Resources',
      value: summary?.total != null ? summary.total.toLocaleString() : '—',
      icon: Server,
      color: 'blue' as const,
      sub: summary ? `${(summary.byStatus?.['active'] ?? 0).toLocaleString()} active` : undefined,
    },
    {
      title: 'Monthly Spend',
      value: costSummary
        ? `$${costSummary.totalMonthlyCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        : '—',
      icon: DollarSign,
      color: 'orange' as const,
      sub: costSummary
        ? `$${(costSummary.totalAnnualCost / 1000).toFixed(0)}k annual`
        : undefined,
    },
    {
      title: 'Potential Savings',
      value: costSummary
        ? `$${costSummary.potentialMonthlySavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo`
        : '—',
      icon: TrendingDown,
      color: 'green' as const,
      sub: costSummary ? `${costSummary.savingsPercentage.toFixed(1)}% of spend` : undefined,
      trend: costSummary ? { direction: 'down' as const, value: `${costSummary.savingsPercentage.toFixed(0)}%`, positive: true } : undefined,
    },
    {
      title: 'Drifted Resources',
      value: '27',
      icon: AlertTriangle,
      color: 'yellow' as const,
      sub: 'vs last snapshot',
    },
    {
      title: 'Policy Violations',
      value: '14',
      icon: Shield,
      color: 'red' as const,
      sub: 'CIS AWS 1.5',
    },
    {
      title: 'Orphaned Resources',
      value: summary?.orphaned != null ? summary.orphaned.toLocaleString() : '—',
      icon: Activity,
      color: 'purple' as const,
      sub: 'No dependencies',
    },
  ];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto animate-fade-in">

      {/* ── page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--fg))' }}>
            Infrastructure Overview
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>
            Real-time view across all cloud providers
          </p>
        </div>
        <ScanStatusBadge />
      </div>

      {/* ── metric cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {metrics.map(m => (
          <MetricCard key={m.title} {...m} loading={isLoading} />
        ))}
      </div>

      {/* ── main charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CostTrendChart data={costSummary?.trend ?? []} loading={costLoading} />
        </div>
        <div>
          <ResourceTypeDonut data={summary?.byType ?? {}} loading={summaryLoading} />
        </div>
      </div>

      {/* ── recommendations + violations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopRecommendations
          recommendations={costSummary?.recommendations?.slice(0, 5) ?? []}
          loading={costLoading}
        />
        <RecentViolations />
      </div>

      {/* ── drift bar ── */}
      <DriftSeverityBar />
    </div>
  );
}
