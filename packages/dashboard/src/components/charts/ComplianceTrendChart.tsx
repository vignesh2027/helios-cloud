'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const COMPLIANCE_HISTORY = [
  { month: 'Dec', score: 72, violations: 22 },
  { month: 'Jan', score: 75, violations: 19 },
  { month: 'Feb', score: 79, violations: 16 },
  { month: 'Mar', score: 82, violations: 13 },
  { month: 'Apr', score: 85, violations: 11 },
  { month: 'May', score: 87, violations: 9  },
];

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs font-mono shadow-xl">
      <div className="font-semibold mb-1" style={{ color: 'rgb(var(--fg))' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name === 'score' ? `${p.value}%` : p.value}
        </div>
      ))}
    </div>
  );
}

export function ComplianceTrendChart() {
  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>Compliance Score Trend</h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>CIS AWS 1.5 · 6 months</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold font-mono" style={{ color: '#4ade80' }}>87%</div>
          <div className="text-[10px]" style={{ color: '#4ade80' }}>↑ +15% from Dec</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={COMPLIANCE_HISTORY} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: 'rgb(var(--fg-dim))', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="score" domain={[60, 100]} tick={{ fill: 'rgb(var(--fg-dim))', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={36} />
          <YAxis yAxisId="violations" orientation="right" tick={{ fill: 'rgb(var(--fg-dim))', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} width={24} />
          <ReferenceLine yAxisId="score" y={80} stroke="rgb(var(--fg-dim))" strokeDasharray="4 4" strokeWidth={1} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgb(var(--border))' }} />
          <Line yAxisId="score" type="monotone" dataKey="score" stroke="#4ade80" strokeWidth={2.5} dot={{ r: 3, fill: '#4ade80', strokeWidth: 0 }} name="score" />
          <Line yAxisId="violations" type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="violations" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
