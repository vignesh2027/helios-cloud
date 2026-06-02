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
import Link from 'next/link';
import {
  Server, DollarSign, AlertTriangle, Shield,
  Activity, TrendingDown, Zap, Globe,
  ArrowUpRight, ArrowDownRight, ChevronRight,
  GitBranch, BarChart3,
  Database, Cpu, CloudLightning, Eye,
  ArrowRight, CheckCircle2,
} from 'lucide-react';

const PIPELINE = [
  {
    icon: Cpu,
    title: 'Rust Scanner',
    crate: 'helios-scanner',
    desc: 'Async AWS scanner discovers all resources across every region in under 3 seconds using concurrent API calls',
    color: '#f97316',
    step: '01',
  },
  {
    icon: Database,
    title: 'Resource Graph',
    crate: 'helios-core',
    desc: 'Builds a live dependency graph, tracks real-time changes with ChangeTracker, and indexes by type, region, and status',
    color: '#60a5fa',
    step: '02',
  },
  {
    icon: CloudLightning,
    title: 'Analysis Engine',
    crate: 'optimizer · drift · policy',
    desc: 'Runs cost optimization, Terraform drift detection, and CIS / SOC2 / PCI compliance evaluation in parallel',
    color: '#a78bfa',
    step: '03',
  },
  {
    icon: Zap,
    title: 'API + Events',
    crate: 'helios-api :3001',
    desc: 'Fastify REST API with WebSocket real-time event stream, OpenAPI docs, and Prometheus /metrics endpoint',
    color: '#4ade80',
    step: '04',
  },
  {
    icon: Eye,
    title: 'Dashboard',
    crate: 'packages/dashboard',
    desc: 'Next.js 14 app with live charts, actionable insights, multi-account support, and dark / light themes',
    color: '#f97316',
    step: '05',
  },
];

const FEATURES = [
  {
    icon: Server,
    title: 'Resource Inventory',
    desc: 'Auto-discover EC2, S3, Lambda, RDS, EKS, IAM and 20+ resource types across all regions and accounts in real time.',
    color: '#60a5fa',
    tags: ['Auto-discovery', 'Multi-region', 'Real-time'],
    href: '/resources',
    stat: '847 resources',
  },
  {
    icon: DollarSign,
    title: 'Cost Optimizer',
    desc: 'ML-powered recommendations — rightsize, terminate idle, schedule off-hours, apply Savings Plans. Average 25% savings.',
    color: '#4ade80',
    tags: ['Rightsizing', 'Anomaly Detection', 'Forecasts'],
    href: '/cost',
    stat: '$6.2k / mo saved',
  },
  {
    icon: AlertTriangle,
    title: 'Drift Detection',
    desc: 'Detect infrastructure changes made outside Terraform. Get exact terraform apply remediation commands instantly.',
    color: '#eab308',
    tags: ['Terraform IaC', 'Auto-remediation', 'State sync'],
    href: '/drift',
    stat: '7 drifted now',
  },
  {
    icon: Shield,
    title: 'Policy Compliance',
    desc: 'Continuous CIS AWS 1.5, SOC 2, and PCI-DSS compliance evaluation with per-rule violation drill-down.',
    color: '#a78bfa',
    tags: ['CIS 1.5', 'SOC 2', 'PCI-DSS'],
    href: '/policy',
    stat: '87% compliant',
  },
  {
    icon: GitBranch,
    title: 'Network Topology',
    desc: 'Interactive visual map of VPCs, subnets, load balancers, NAT gateways, and all resource relationships.',
    color: '#34d399',
    tags: ['VPC', 'Subnets', 'Visual map'],
    href: '/topology',
    stat: '15 nodes mapped',
  },
  {
    icon: BarChart3,
    title: 'Budget Tracking',
    desc: 'Set budgets per account, service, or team. Forecast spend and get Slack alerts before you overspend.',
    color: '#fb923c',
    tags: ['Per-service', 'Forecasts', 'Slack alerts'],
    href: '/budget',
    stat: '6 active budgets',
  },
];

const QUICK_ACTIONS = [
  { icon: Zap,           label: 'Trigger Scan',   sub: 'Scan all 4 regions now',  color: '#f97316' },
  { icon: TrendingDown,  label: 'Optimize Costs', sub: '5 open recommendations',  color: '#4ade80' },
  { icon: AlertTriangle, label: 'Check Drift',    sub: 'vs terraform.tfstate',    color: '#eab308' },
  { icon: Shield,        label: 'Run Compliance', sub: 'CIS AWS 1.5 benchmark',   color: '#a78bfa' },
];

const SYSTEM_HEALTH = [
  { label: 'Scanner',    status: 'healthy', value: 'Running · last 2m ago'   },
  { label: 'API',        status: 'healthy', value: 'Healthy · port 3001'     },
  { label: 'WebSocket',  status: 'healthy', value: 'Connected · 3 clients'   },
  { label: 'Alerts',     status: 'warn',    value: '2 open · 1 critical'     },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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
      value: summary?.total ?? 847,
      icon: Server,
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.08)',
      border: 'rgba(96,165,250,0.16)',
      prefix: '', suffix: '',
      sub: `${(summary?.byStatus?.['active'] ?? 821).toLocaleString()} active`,
      trend: +2.3,
    },
    {
      label: 'Monthly Spend',
      value: costData?.totalMonthlyCost ?? 24810,
      icon: DollarSign,
      color: '#f97316',
      bg: 'rgba(249,115,22,0.08)',
      border: 'rgba(249,115,22,0.16)',
      prefix: '$', suffix: '',
      sub: `$${((costData?.totalAnnualCost ?? 297720) / 1000).toFixed(0)}k annual`,
      trend: -1.8,
    },
    {
      label: 'Savings',
      value: costData?.potentialMonthlySavings ?? 6200,
      icon: TrendingDown,
      color: '#4ade80',
      bg: 'rgba(74,222,128,0.08)',
      border: 'rgba(74,222,128,0.16)',
      prefix: '$', suffix: '/mo',
      sub: `${(costData?.savingsPercentage ?? 25).toFixed(1)}% of spend`,
      trend: +5.1,
    },
    {
      label: 'Compliance',
      value: 87,
      icon: Shield,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.08)',
      border: 'rgba(167,139,250,0.16)',
      prefix: '', suffix: '%',
      sub: 'CIS AWS 1.5 · B+',
      trend: +1.2,
    },
    {
      label: 'Drifted',
      value: 7,
      icon: AlertTriangle,
      color: '#eab308',
      bg: 'rgba(234,179,8,0.08)',
      border: 'rgba(234,179,8,0.16)',
      prefix: '', suffix: '',
      sub: '2 critical · 3 high',
      trend: -3,
    },
    {
      label: 'Violations',
      value: 14,
      icon: Activity,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.16)',
      prefix: '', suffix: '',
      sub: 'Across 3 frameworks',
      trend: -2,
    },
    {
      label: 'Regions',
      value: Object.keys(summary?.byRegion ?? {}).length || 4,
      icon: Globe,
      color: '#34d399',
      bg: 'rgba(52,211,153,0.08)',
      border: 'rgba(52,211,153,0.16)',
      prefix: '', suffix: '',
      sub: 'us · eu · ap',
      trend: 0,
    },
    {
      label: 'Orphaned',
      value: summary?.orphaned ?? 23,
      icon: Server,
      color: '#fb923c',
      bg: 'rgba(251,146,60,0.08)',
      border: 'rgba(251,146,60,0.16)',
      prefix: '', suffix: '',
      sub: 'No dependencies',
      trend: -8.2,
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">

      {/* ── Header ── */}
      <div className="animate-fade-in flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold"
              style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
              LIVE
            </span>
            <span className="text-xs font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>
              3 accounts · 4 regions · scanning every 5 min
            </span>
          </div>
          <h1 className="text-[1.65rem] font-bold tracking-tight" style={{ color: 'rgb(var(--fg))' }}>
            {getGreeting()}, Vignesh
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--fg-muted))' }}>
            Infrastructure is{' '}
            <span style={{ color: '#22c55e', fontWeight: 600 }}>healthy</span>.
            {' '}7 resources drifted since last scan · $6.2k in savings available.
          </p>
        </div>
        <ScanStatusBadge />
      </div>

      {/* ── System Health Bar ── */}
      <div className="animate-fade-in-delay-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SYSTEM_HEALTH.map(s => (
          <div key={s.label} className="card px-4 py-3 flex items-center gap-3">
            <div className={`status-dot ${s.status === 'healthy' ? 'active' : 'stopped'}`} />
            <div className="min-w-0">
              <div className="text-xs font-semibold" style={{ color: 'rgb(var(--fg))' }}>{s.label}</div>
              <div className="text-[10px] font-mono truncate" style={{ color: 'rgb(var(--fg-dim))' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── KPI Strip ── */}
      <div className="animate-fade-in-delay-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          const trendUp = kpi.trend > 0;
          const trendNeutral = kpi.trend === 0;
          return (
            <div key={kpi.label}
              className="card p-3.5 relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.03]"
              style={{ border: `1px solid ${kpi.border}` }}>
              <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${kpi.color}80, transparent)` }} />

              <div className="flex items-center justify-between mb-2.5">
                <div className="p-1.5 rounded-lg" style={{ background: kpi.bg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                </div>
                {!trendNeutral && (
                  <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold"
                    style={{ color: trendUp ? '#4ade80' : '#ef4444' }}>
                    {trendUp
                      ? <ArrowUpRight style={{ width: 10, height: 10 }} />
                      : <ArrowDownRight style={{ width: 10, height: 10 }} />}
                    {Math.abs(kpi.trend)}%
                  </span>
                )}
              </div>

              {statsLoading ? (
                <div className="skeleton h-6 w-14 rounded mb-1.5" />
              ) : (
                <div className="text-[1.15rem] font-bold font-mono leading-none" style={{ color: 'rgb(var(--fg))' }}>
                  <AnimatedCounter value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} decimals={0} duration={900} />
                </div>
              )}
              <div className="text-[10px] mt-1.5 font-semibold" style={{ color: 'rgb(var(--fg-muted))' }}>{kpi.label}</div>
              <div className="text-[9px] mt-0.5 font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── How HELIOS Works ── */}
      <div className="card p-6 animate-fade-in-delay-3">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'rgb(var(--fg))' }}>How HELIOS Works</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>
              Five-layer architecture — from AWS APIs to actionable insights in real time
            </p>
          </div>
          <Link href="/docs"
            className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'rgb(var(--accent))' }}>
            Full docs <ChevronRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch gap-0">
          {PIPELINE.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex lg:flex-col items-center flex-1 min-w-0">
                <div className="flex-1 w-full rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: `${step.color}08`, border: `1px solid ${step.color}1a` }}>
                  <div className="flex items-start gap-3 lg:flex-col lg:gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${step.color}14`, border: `1px solid ${step.color}25` }}>
                      <Icon style={{ width: 18, height: 18, color: step.color }} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                          style={{ background: `${step.color}15`, color: step.color }}>
                          {step.step}
                        </span>
                        <span className="text-xs font-bold" style={{ color: 'rgb(var(--fg))' }}>{step.title}</span>
                      </div>
                      <div className="text-[9px] font-mono mb-2" style={{ color: step.color }}>{step.crate}</div>
                      <div className="text-[10px] leading-relaxed hidden lg:block" style={{ color: 'rgb(var(--fg-muted))' }}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className="flex items-center justify-center w-8 h-8 lg:w-full lg:h-7 flex-shrink-0">
                    <ArrowRight style={{ width: 14, height: 14, color: 'rgb(var(--fg-dim))' }}
                      className="rotate-90 lg:rotate-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Platform Capabilities ── */}
      <div className="animate-fade-in-delay-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'rgb(var(--fg))' }}>Platform Capabilities</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>
              6 modules · all live in demo mode · click any card to explore
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 style={{ width: 13, height: 13, color: '#22c55e' }} />
            <span className="text-xs" style={{ color: 'rgb(var(--fg-dim))' }}>All systems operational</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map(feat => {
            const Icon = feat.icon;
            return (
              <Link key={feat.title} href={feat.href}
                className="card p-5 group cursor-pointer transition-all duration-200 hover:scale-[1.015] block"
                style={{ borderColor: `${feat.color}1a` }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `${feat.color}10`, border: `1px solid ${feat.color}20` }}>
                    <Icon style={{ width: 19, height: 19, color: feat.color }} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold" style={{ color: 'rgb(var(--fg))' }}>{feat.title}</span>
                      <ChevronRight style={{ width: 14, height: 14, color: feat.color }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0" />
                    </div>
                    <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'rgb(var(--fg-muted))' }}>
                      {feat.desc}
                    </p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex flex-wrap gap-1.5">
                        {feat.tags.map(tag => (
                          <span key={tag} className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                            style={{ background: `${feat.color}0e`, color: feat.color, border: `1px solid ${feat.color}1a` }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] font-mono font-bold flex-shrink-0"
                        style={{ color: feat.color }}>{feat.stat}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Charts Row 1 ── */}
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

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DriftSeverityBar />
        <ComplianceTrendChart />
      </div>

      {/* ── Recommendations ── */}
      <TopRecommendations
        recommendations={costData?.recommendations?.slice(0, 5) ?? []}
        loading={costLoading}
      />

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'rgb(var(--fg))' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <button key={action.label}
                className="card p-4 flex items-center gap-3 text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer w-full">
                <div className="p-2 rounded-xl flex-shrink-0"
                  style={{ background: `${action.color}12`, border: `1px solid ${action.color}20` }}>
                  <Icon style={{ width: 16, height: 16, color: action.color }} />
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: 'rgb(var(--fg))' }}>{action.label}</div>
                  <div className="text-[10px] mt-0.5 font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>{action.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── System Info Footer ── */}
      <div className="card p-5" style={{ background: 'rgb(var(--bg-elevated))' }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[
            { label: 'AWS Account',    value: '123456789012 (production)',    mono: true  },
            { label: 'Scanner Engine', value: 'helios-scanner · Rust 1.87',  mono: true  },
            { label: 'Last Full Scan', value: '2 minutes ago',                mono: false },
            { label: 'Next Scheduled', value: 'in 3 minutes',                 mono: false },
          ].map(item => (
            <div key={item.label}>
              <div className="section-label mb-1.5">{item.label}</div>
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
