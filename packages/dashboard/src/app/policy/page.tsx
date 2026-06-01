'use client';

import { useState } from 'react';
import { MetricCard } from '../../components/ui/MetricCard';
import { Shield, CheckCircle, XCircle, Info } from 'lucide-react';

const CIS_RULES = [
  { id: '1.1',  section: 'IAM',     name: 'Avoid root account usage',                   passed: true,  violations: 0,  severity: 'critical' },
  { id: '1.2',  section: 'IAM',     name: 'MFA enabled for all IAM users with console',  passed: true,  violations: 0,  severity: 'high'     },
  { id: '1.4',  section: 'IAM',     name: 'Access keys rotated within 90 days',          passed: false, violations: 3,  severity: 'high'     },
  { id: '1.5',  section: 'IAM',     name: 'IAM password policy requires uppercase',      passed: true,  violations: 0,  severity: 'medium'   },
  { id: '1.14', section: 'IAM',     name: 'Hardware MFA for root account',               passed: true,  violations: 0,  severity: 'critical' },
  { id: '2.1',  section: 'Storage', name: 'Ensure CloudTrail is enabled in all regions', passed: false, violations: 2,  severity: 'critical' },
  { id: '2.2',  section: 'Storage', name: 'CloudTrail log file validation enabled',      passed: true,  violations: 0,  severity: 'medium'   },
  { id: '2.6',  section: 'Storage', name: 'S3 bucket for CloudTrail access logs',        passed: true,  violations: 0,  severity: 'medium'   },
  { id: '2.9',  section: 'Storage', name: 'S3 block public access setting enabled',      passed: false, violations: 2,  severity: 'critical' },
  { id: '3.1',  section: 'Logging', name: 'Unauthorized API calls alarm exists',         passed: true,  violations: 0,  severity: 'medium'   },
  { id: '3.2',  section: 'Logging', name: 'CloudWatch alarm for console sign-in without MFA', passed: true, violations: 0, severity: 'medium' },
  { id: '4.1',  section: 'Network', name: 'No unrestricted SSH ingress (port 22)',       passed: false, violations: 1,  severity: 'critical' },
  { id: '4.2',  section: 'Network', name: 'No unrestricted RDP ingress (port 3389)',     passed: true,  violations: 0,  severity: 'critical' },
  { id: '4.3',  section: 'Network', name: 'No unrestricted ingress on port 0-65535',     passed: true,  violations: 0,  severity: 'high'     },
  { id: '5.1',  section: 'Network', name: 'Network ACLs: no unrestricted traffic',       passed: true,  violations: 0,  severity: 'high'     },
];

const SEV_COLOR: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#6b7280' };

const passed = CIS_RULES.filter(r => r.passed).length;
const total  = CIS_RULES.length;
const score  = Math.round((passed / total) * 100);
const grade  = score >= 90 ? 'A' : score >= 80 ? 'B+' : score >= 70 ? 'B' : 'C+';

const sections = [...new Set(CIS_RULES.map(r => r.section))];

export default function PolicyPage() {
  const [section, setSection] = useState('All');

  const rules = section === 'All' ? CIS_RULES : CIS_RULES.filter(r => r.section === section);
  const violations = CIS_RULES.flatMap(r => r.passed ? [] : [r]);

  const metrics = [
    { title: 'Compliance Score', value: `${score}%`,            icon: Shield,      color: score >= 80 ? 'green' as const : 'yellow' as const },
    { title: 'Grade',            value: grade,                   icon: Shield,      color: 'blue'   as const },
    { title: 'Rules Passed',     value: `${passed}/${total}`,   icon: CheckCircle, color: 'green'  as const },
    { title: 'Violations',       value: String(violations.length), icon: XCircle,  color: 'red'    as const },
  ];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto animate-fade-in">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--fg))' }}>Policy Compliance</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>CIS AWS Foundations Benchmark v1.5</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(m => <MetricCard key={m.title} {...m} />)}
      </div>

      {/* Score gauge */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>Overall Score</h3>
          <span className="text-2xl font-bold font-mono" style={{ color: score >= 80 ? '#4ade80' : '#eab308' }}>{score}/100</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border))' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, background: `linear-gradient(90deg, ${score >= 80 ? '#22c55e' : '#eab308'}, ${score >= 80 ? '#4ade80' : '#f97316'})` }} />
        </div>
        <div className="flex justify-between text-[11px] mt-2 font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>
          <span>0</span><span>50</span><span>100</span>
        </div>
      </div>

      {/* Rules table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>Rule Details</h3>
          <div className="flex gap-1.5 flex-wrap">
            {['All', ...sections].map(s => (
              <button key={s} onClick={() => setSection(s)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                style={{
                  background: section === s ? 'rgb(var(--accent) / 0.1)' : 'rgb(var(--bg-elevated))',
                  color: section === s ? 'rgb(var(--accent))' : 'rgb(var(--fg-muted))',
                  border: `1px solid ${section === s ? 'rgb(var(--accent) / 0.3)' : 'rgb(var(--border))'}`,
                }}
              >{s}</button>
            ))}
          </div>
        </div>
        <div>
          {rules.map((r, i) => (
            <div key={r.id}
              className="flex items-center gap-4 px-5 py-3"
              style={{ borderBottom: i < rules.length - 1 ? '1px solid rgb(var(--border-soft))' : 'none' }}
            >
              {r.passed
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                : <XCircle    className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />}
              <span className="text-xs font-mono w-10 flex-shrink-0" style={{ color: 'rgb(var(--fg-dim))' }}>{r.id}</span>
              <span className="flex-1 text-xs" style={{ color: 'rgb(var(--fg-muted))' }}>{r.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: SEV_COLOR[r.severity] ?? '#6b7280', background: `${SEV_COLOR[r.severity] ?? '#6b7280'}18` }}>{r.severity}</span>
              {!r.passed && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  {r.violations} violation{r.violations !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
