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
import { clsx } from 'clsx';

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
      value: summary?.total?.toLocaleString() ?? '—',
      icon: Server,
      color: 'blue' as const,
      sub: summary ? `${summary.byStatus?.active ?? 0} active` : undefined,
    },
    {
      title: 'Monthly Spend',
      value: costSummary ? `$${costSummary.totalMonthlyCost.toLocaleString('en-US', { minimumFractionDigits: 0 })}` : '—',
      icon: DollarSign,
      color: 'orange' as const,
      sub: costSummary ? `$${costSummary.totalAnnualCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}/yr` : undefined,
    },
    {
      title: 'Potential Savings',
      value: costSummary ? `$${costSummary.potentialMonthlySavings.toLocaleString('en-US', { minimumFractionDigits: 0 })}/mo` : '—',
      icon: TrendingDown,
      color: 'green' as const,
      sub: costSummary ? `${costSummary.savingsPercentage.toFixed(1)}% of spend` : undefined,
    },
    {
      title: 'Drifted Resources',
      value: '—',
      icon: AlertTriangle,
      color: 'yellow' as const,
      sub: 'Run drift check',
    },
    {
      title: 'Policy Violations',
      value: '—',
      icon: Shield,
      color: 'red' as const,
      sub: 'CIS AWS 1.5',
    },
    {
      title: 'Orphaned Resources',
      value: summary?.orphaned?.toLocaleString() ?? '—',
      icon: Activity,
      color: 'purple' as const,
      sub: 'No dependencies',
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Infrastructure Overview</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time view of your cloud infrastructure
          </p>
        </div>
        <ScanStatusBadge />
      </div>

      <div className={clsx(
        'grid gap-4',
        'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6',
      )}>
        {metrics.map(m => (
          <MetricCard key={m.title} {...m} loading={isLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CostTrendChart data={costSummary?.trend ?? []} loading={costLoading} />
        </div>
        <div>
          <ResourceTypeDonut data={summary?.byType ?? {}} loading={summaryLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopRecommendations recommendations={costSummary?.recommendations?.slice(0, 5) ?? []} loading={costLoading} />
        <RecentViolations />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <DriftSeverityBar />
      </div>
    </div>
  );
}
