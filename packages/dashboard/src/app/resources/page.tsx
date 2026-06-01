'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { heliosApi } from '../../lib/api';
import { MetricCard } from '../../components/ui/MetricCard';
import { Server, Filter, ChevronDown, ExternalLink, Activity, HardDrive, Globe } from 'lucide-react';
import { clsx } from 'clsx';

const TYPE_OPTIONS = ['All', 'ec2:instance', 's3:bucket', 'lambda:function', 'rds:db-instance', 'ec2:security-group', 'ec2:volume'];
const STATUS_OPTIONS = ['All', 'active', 'stopped', 'terminated'];
const REGION_OPTIONS = ['All', 'us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

const STATUS_COLOR: Record<string, string> = {
  active:     '#22c55e',
  stopped:    '#eab308',
  terminated: '#ef4444',
  pending:    '#60a5fa',
  error:      '#ef4444',
  unknown:    '#6b7280',
};

const TYPE_ICON: Record<string, typeof Server> = {
  'ec2:instance': Server,
  'lambda:function': Activity,
  'ec2:volume': HardDrive,
  's3:bucket': Globe,
};

export default function ResourcesPage() {
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['resources', 'summary'],
    queryFn: () => heliosApi.getResourceSummary(),
  });

  // Build mock resource list from summary data
  const allResources = buildMockResources(summary?.byType ?? {}, summary?.byRegion ?? {});

  let filtered = allResources;
  if (typeFilter !== 'All') filtered = filtered.filter(r => r.type === typeFilter);
  if (statusFilter !== 'All') filtered = filtered.filter(r => r.status === statusFilter);
  if (regionFilter !== 'All') filtered = filtered.filter(r => r.region === regionFilter);
  if (search) filtered = filtered.filter(r =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.type.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const metrics = [
    { title: 'Total Resources',  value: String(summary?.total ?? '—'),      icon: Server,    color: 'blue'   as const },
    { title: 'Active',           value: String(summary?.byStatus?.['active']   ?? '—'), icon: Activity,  color: 'green'  as const },
    { title: 'Stopped',          value: String(summary?.byStatus?.['stopped']  ?? '—'), icon: Server,    color: 'yellow' as const },
    { title: 'Orphaned',         value: String(summary?.orphaned ?? '—'),    icon: HardDrive, color: 'red'    as const },
  ];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto animate-fade-in">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--fg))' }}>Resource Inventory</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>
          All discovered cloud resources across providers
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(m => <MetricCard key={m.title} {...m} loading={sumLoading} />)}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5" style={{ color: 'rgb(var(--fg-muted))' }}>
          <Filter className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Filter</span>
        </div>

        <input
          type="text"
          placeholder="Search by ID, name, or type…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="input-base px-3 py-1.5 text-xs flex-1 min-w-48"
        />

        {[
          { label: 'Type', value: typeFilter, options: TYPE_OPTIONS, set: (v: string) => { setTypeFilter(v); setPage(0); } },
          { label: 'Status', value: statusFilter, options: STATUS_OPTIONS, set: (v: string) => { setStatusFilter(v); setPage(0); } },
          { label: 'Region', value: regionFilter, options: REGION_OPTIONS, set: (v: string) => { setRegionFilter(v); setPage(0); } },
        ].map(f => (
          <div key={f.label} className="relative flex items-center input-base px-2.5 py-1.5 gap-1">
            <select
              value={f.value}
              onChange={e => f.set(e.target.value)}
              className="appearance-none bg-transparent text-xs focus:outline-none cursor-pointer pr-4"
              style={{ color: 'rgb(var(--fg))' }}
            >
              {f.options.map(o => <option key={o} value={o}>{o === 'All' ? `${f.label}: All` : o}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: 'rgb(var(--fg-dim))' }} />
          </div>
        ))}

        <span className="text-xs font-mono ml-auto" style={{ color: 'rgb(var(--fg-dim))' }}>
          {filtered.length.toLocaleString()} results
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgb(var(--border))', background: 'rgb(var(--bg-elevated))' }}>
                {['Resource ID', 'Name', 'Type', 'Region', 'Status', 'Cost/mo', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'rgb(var(--fg-muted))' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map((r, i) => {
                const Icon = TYPE_ICON[r.type] ?? Server;
                return (
                  <tr
                    key={r.id}
                    className="group transition-colors"
                    style={{
                      borderBottom: i < pageData.length - 1 ? '1px solid rgb(var(--border-soft))' : 'none',
                      background: i % 2 === 0 ? 'transparent' : 'rgb(var(--bg-elevated) / 0.4)',
                    }}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>
                        {r.id.slice(0, 22)}…
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgb(var(--accent))' }} />
                        <span style={{ color: 'rgb(var(--fg))' }}>{r.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-mono px-2 py-0.5 rounded text-[11px]"
                        style={{ background: 'rgb(var(--bg-elevated))', color: 'rgb(var(--fg-muted))', border: '1px solid rgb(var(--border))' }}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px]" style={{ color: 'rgb(var(--fg-muted))' }}>{r.region}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[r.status] ?? '#6b7280' }} />
                        <span style={{ color: 'rgb(var(--fg-muted))' }}>{r.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: r.costPerMonth ? '#22c55e' : 'rgb(var(--fg-dim))' }}>
                      {r.costPerMonth ? `$${r.costPerMonth}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'rgb(var(--fg-dim))' }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgb(var(--border))' }}>
          <span className="text-xs" style={{ color: 'rgb(var(--fg-dim))' }}>
            Page {page + 1} of {Math.max(1, totalPages)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-40"
              style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--fg-muted))' }}
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-40"
              style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--fg-muted))' }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate representative resource list from summary counts
function buildMockResources(byType: Record<string, number>, byRegion: Record<string, number>) {
  const resources: Array<{ id: string; name: string | null; type: string; region: string; status: string; costPerMonth: number | null; tags: Record<string, string> }> = [];
  const regions = Object.keys(byRegion).length ? Object.keys(byRegion) : ['us-east-1'];
  const statuses = ['active', 'active', 'active', 'active', 'stopped', 'terminated'];

  let idx = 0;
  for (const [type, count] of Object.entries(byType)) {
    const prefix = type.split(':')[1]?.slice(0, 3) ?? 'res';
    for (let i = 0; i < Math.min(count, 30); i++) {
      const region = regions[idx % regions.length] ?? 'us-east-1';
      const status = statuses[idx % statuses.length] ?? 'active';
      resources.push({
        id: `${prefix}-${String(idx).padStart(4, '0')}${Math.random().toString(16).slice(2, 8)}`,
        name: `${type.split(':')[1]}-${String(i + 1).padStart(3, '0')}`,
        type,
        region,
        status,
        costPerMonth: type === 'ec2:instance' ? Number((Math.random() * 300 + 30).toFixed(2)) :
                      type === 'rds:db-instance' ? Number((Math.random() * 500 + 100).toFixed(2)) : null,
        tags: { Environment: i % 3 === 0 ? 'production' : i % 3 === 1 ? 'staging' : 'dev', Team: 'platform' },
      });
      idx++;
    }
  }
  return resources;
}
