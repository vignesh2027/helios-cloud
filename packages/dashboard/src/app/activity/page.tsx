'use client';

import { Activity, CheckCircle, AlertTriangle, Info, Zap } from 'lucide-react';

const EVENTS = [
  { id: 1, type: 'scan',    level: 'info',    title: 'Infrastructure scan completed',       detail: '847 resources discovered across 4 regions in 3.2s',        time: '2 min ago',  icon: Zap },
  { id: 2, type: 'drift',   level: 'critical',title: 'Critical drift detected',              detail: 'i-0abc1234 instance_type changed outside Terraform',        time: '8 min ago',  icon: AlertTriangle },
  { id: 3, type: 'policy',  level: 'high',    title: 'Policy violation: SSH open',          detail: 'sg-0def5678 allows port 22 from 0.0.0.0/0',               time: '14 min ago', icon: AlertTriangle },
  { id: 4, type: 'cost',    level: 'info',    title: 'Cost anomaly detected',               detail: 'us-west-2 spend increased 23% vs prior 7-day avg',         time: '1h ago',     icon: Info },
  { id: 5, type: 'scan',    level: 'success', title: 'Scan completed: no new violations',   detail: 'eu-west-1 scan passed all CIS checks',                     time: '2h ago',     icon: CheckCircle },
  { id: 6, type: 'drift',   level: 'high',    title: 'Drift remediated',                    detail: 'rds-prod-main backup_retention restored to 7 days',        time: '3h ago',     icon: CheckCircle },
  { id: 7, type: 'policy',  level: 'medium',  title: 'New policy violation',                detail: 'vpc-0def456 in eu-west-1 missing flow logs',               time: '5h ago',     icon: AlertTriangle },
  { id: 8, type: 'cost',    level: 'success', title: 'Savings Plan applied',                detail: 'Compute Savings Plan activated — saving $102/mo on i-0ghi', time: '8h ago',     icon: CheckCircle },
  { id: 9, type: 'scan',    level: 'info',    title: 'Scheduled scan started',              detail: 'Full infrastructure scan triggered by cron (every 5m)',    time: '10h ago',    icon: Zap },
  { id: 10,type: 'policy',  level: 'critical',title: 'S3 bucket made public',               detail: 'my-public-bucket: public-read ACL detected',              time: '12h ago',    icon: AlertTriangle },
  { id: 11,type: 'cost',    level: 'info',    title: 'New rightsizing recommendation',      detail: 'i-0abc123: downsize m5.2xlarge → m5.large, save $207/mo',  time: '1d ago',     icon: Info },
  { id: 12,type: 'scan',    level: 'success', title: 'Baseline snapshot created',           detail: 'State snapshot v14 committed (847 resources, checksum: a3f8b2c1)', time: '1d ago', icon: CheckCircle },
];

const LEVEL_META: Record<string, { color: string; bg: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  info:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  success:  { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
};

const TYPE_FILTER_OPTIONS = ['All', 'scan', 'drift', 'policy', 'cost'];

export default function ActivityPage() {
  return (
    <div className="space-y-5 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--fg))' }}>Activity Log</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>Real-time event stream from all platform components</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#4ade80' }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#4ade80' }} />
          </span>
          <span style={{ color: 'rgb(var(--fg-muted))' }}>Live</span>
        </div>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Events', value: EVENTS.length, color: '#60a5fa' },
          { label: 'Critical',     value: EVENTS.filter(e => e.level === 'critical').length, color: '#ef4444' },
          { label: 'High',         value: EVENTS.filter(e => e.level === 'high').length,     color: '#f97316' },
          { label: 'Resolved',     value: EVENTS.filter(e => e.level === 'success').length,  color: '#4ade80' },
          { label: 'Info',         value: EVENTS.filter(e => e.level === 'info').length,     color: '#94a3b8' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] mt-1" style={{ color: 'rgb(var(--fg-muted))' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>Event Timeline</h3>
        </div>
        <div className="p-5 space-y-1">
          {EVENTS.map((event, i) => {
            const m = LEVEL_META[event.level]!;
            const Icon = event.icon;
            return (
              <div key={event.id} className="flex items-start gap-4 group">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center gap-0 flex-shrink-0" style={{ width: 20 }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: m.bg }}>
                    <Icon className="w-2.5 h-2.5" style={{ color: m.color }} />
                  </div>
                  {i < EVENTS.length - 1 && (
                    <div className="w-px flex-1 min-h-[12px]" style={{ background: 'rgb(var(--border))' }} />
                  )}
                </div>

                {/* Content */}
                <div
                  className="flex-1 flex items-start gap-3 pb-4 -mt-0.5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: 'rgb(var(--fg))' }}>{event.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase" style={{ color: m.color, background: m.bg }}>{event.level}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: 'rgb(var(--fg-dim))', background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))' }}>{event.type}</span>
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>{event.detail}</div>
                  </div>
                  <span className="text-[10px] font-mono flex-shrink-0 mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>{event.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
