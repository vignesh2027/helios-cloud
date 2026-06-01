'use client';

import { useState } from 'react';
import { MetricCard } from '../../components/ui/MetricCard';
import { AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react';

const MOCK_DRIFT = [
  { id: 'i-0abc1234',    type: 'ec2:instance',      region: 'us-east-1', driftType: 'config-changed', severity: 'critical', changes: ['instance_type: m5.2xlarge → m5.xlarge', 'iam_instance_profile removed'],              detectedAt: '2026-05-31T14:22:00Z', cmd: 'terraform apply -target=aws_instance.api_server' },
  { id: 'sg-0def5678',   type: 'ec2:security-group', region: 'us-east-1', driftType: 'config-changed', severity: 'critical', changes: ['ingress rule added: 0.0.0.0/0:22 (SSH open to public)'],                            detectedAt: '2026-05-31T10:05:00Z', cmd: 'terraform apply -target=aws_security_group.web_sg' },
  { id: 's3-prod-data',  type: 's3:bucket',          region: 'us-east-1', driftType: 'config-changed', severity: 'high',     changes: ['versioning: Enabled → Suspended', 'acl: private → public-read'],                    detectedAt: '2026-05-30T22:18:00Z', cmd: 'terraform apply -target=aws_s3_bucket.prod_data' },
  { id: 'i-0ghi9012',   type: 'ec2:instance',        region: 'us-west-2', driftType: 'config-changed', severity: 'high',     changes: ['ebs_optimized: true → false', 'monitoring: detailed → basic'],                      detectedAt: '2026-05-30T18:45:00Z', cmd: 'terraform apply -target=aws_instance.worker_1' },
  { id: 'rds-prod-main', type: 'rds:db-instance',    region: 'us-east-1', driftType: 'config-changed', severity: 'high',     changes: ['backup_retention_period: 7 → 1', 'deletion_protection: true → false'],               detectedAt: '2026-05-30T12:30:00Z', cmd: 'terraform apply -target=aws_db_instance.prod' },
  { id: 'i-0unmanaged1', type: 'ec2:instance',        region: 'eu-west-1', driftType: 'resource-added', severity: 'medium',   changes: ['Resource exists in cloud but not in Terraform state'],                               detectedAt: '2026-05-29T09:10:00Z', cmd: 'terraform import aws_instance.imported i-0unmanaged1' },
  { id: 'i-0unmanaged2', type: 'lambda:function',     region: 'us-east-1', driftType: 'resource-added', severity: 'medium',   changes: ['Lambda function not tracked in any IaC state'],                                     detectedAt: '2026-05-28T15:55:00Z', cmd: 'terraform import aws_lambda_function.imported i-0unmanaged2' },
];

const SEV_META: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)'  },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' },
  medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.25)'  },
  low:      { color: '#6b7280', bg: 'rgba(107,114,128,0.1)',border: 'rgba(107,114,128,0.2)' },
};

const DRIFT_TYPE_COLOR: Record<string, string> = {
  'config-changed':  '#facc15',
  'resource-added':  '#60a5fa',
  'resource-deleted':'#ef4444',
};

export default function DriftPage() {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === 'all' ? MOCK_DRIFT : MOCK_DRIFT.filter(d => d.severity === filter);
  const bySeverity = { critical: 2, high: 3, medium: 2, low: 0 };

  const metrics = [
    { title: 'Total Drifted',   value: '7',  icon: AlertTriangle, color: 'yellow' as const },
    { title: 'Critical',        value: '2',  icon: AlertTriangle, color: 'red'    as const },
    { title: 'High',            value: '3',  icon: AlertTriangle, color: 'orange' as const },
    { title: 'Unmanaged',       value: '2',  icon: CheckCircle,   color: 'blue'   as const },
  ];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--fg))' }}>Drift Detection</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>
            Infrastructure vs Terraform state comparison
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))', color: 'rgb(var(--fg-dim))' }}>
          <Clock className="w-3.5 h-3.5" />
          Last checked: 5 min ago
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(m => <MetricCard key={m.title} {...m} />)}
      </div>

      {/* Severity breakdown */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'rgb(var(--fg))' }}>Severity Breakdown</h3>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
          {Object.entries(bySeverity).filter(([,v]) => v > 0).map(([sev, count]) => {
            const total = Object.values(bySeverity).reduce((a, b) => a + b, 0);
            return (
              <div key={sev} style={{ width: `${(count / total) * 100}%`, background: SEV_META[sev]?.color, transition: 'width 0.6s' }} />
            );
          })}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(bySeverity).map(([sev, count]) => {
            const m = SEV_META[sev]!;
            return (
              <button
                key={sev}
                onClick={() => setFilter(sev === 'low' ? 'all' : sev as typeof filter)}
                className="rounded-xl p-3 text-center transition-all"
                style={{ background: m.bg, border: `1px solid ${filter === sev ? m.color : m.border}`, cursor: 'pointer' }}
              >
                <div className="text-2xl font-bold font-mono" style={{ color: m.color }}>{count}</div>
                <div className="text-[11px] mt-1 capitalize font-medium" style={{ color: 'rgb(var(--fg-muted))' }}>{sev}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drift items */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>
            Drifted Resources
            <span className="ml-2 text-xs font-normal" style={{ color: 'rgb(var(--fg-dim))' }}>({filtered.length})</span>
          </h3>
          <div className="flex gap-1.5">
            {(['all', 'critical', 'high', 'medium'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-colors"
                style={{
                  background: filter === f ? 'rgb(var(--accent) / 0.1)' : 'rgb(var(--bg-elevated))',
                  color: filter === f ? 'rgb(var(--accent))' : 'rgb(var(--fg-muted))',
                  border: `1px solid ${filter === f ? 'rgb(var(--accent) / 0.3)' : 'rgb(var(--border))'}`,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          {filtered.map((d, i) => {
            const sm = SEV_META[d.severity]!;
            const isOpen = expanded === d.id;
            return (
              <div key={d.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgb(var(--border-soft))' : 'none' }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : d.id)}
                  className="w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[rgb(var(--bg-elevated))]"
                >
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: sm.color, boxShadow: `0 0 6px ${sm.color}` }} />
                    {i < filtered.length - 1 && <div className="w-px flex-1 min-h-[16px]" style={{ background: 'rgb(var(--border))' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold" style={{ color: 'rgb(var(--fg))' }}>{d.id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: sm.color, background: sm.bg }}>{d.severity.toUpperCase()}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: DRIFT_TYPE_COLOR[d.driftType] ?? '#6b7280', background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))' }}>{d.driftType}</span>
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: 'rgb(var(--fg-dim))' }}>{d.type} · {d.region}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>{d.changes[0]}</div>
                  </div>
                  <div className="text-[10px] font-mono flex-shrink-0" style={{ color: 'rgb(var(--fg-dim))' }}>
                    {new Date(d.detectedAt).toLocaleDateString()}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-10 pb-4" style={{ background: 'rgb(var(--bg-elevated))', borderTop: '1px solid rgb(var(--border-soft))' }}>
                    <div className="pt-3 space-y-2.5">
                      <div className="text-xs font-semibold" style={{ color: 'rgb(var(--fg-muted))' }}>All Changes</div>
                      {d.changes.map((c, ci) => (
                        <div key={ci} className="flex items-start gap-2 text-xs">
                          <span className="text-[10px] font-mono mt-0.5" style={{ color: sm.color }}>•</span>
                          <span className="font-mono" style={{ color: 'rgb(var(--fg-muted))' }}>{c}</span>
                        </div>
                      ))}
                      <div className="pt-2 flex items-center gap-3">
                        <div className="flex items-center gap-1.5 flex-1 px-3 py-2 rounded-lg font-mono text-[11px]" style={{ background: 'rgb(var(--bg))', border: '1px solid rgb(var(--border))' }}>
                          <Wrench className="w-3 h-3" style={{ color: 'rgb(var(--accent))' }} />
                          <span style={{ color: 'rgb(var(--fg-dim))' }}>$</span>
                          <span style={{ color: 'rgb(var(--fg-muted))' }}>{d.cmd}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
