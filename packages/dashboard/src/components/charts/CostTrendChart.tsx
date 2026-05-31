'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { CostTrendPoint } from '../../lib/types';

interface CostTrendChartProps {
  data: CostTrendPoint[];
  loading?: boolean;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const val = payload[0]?.value ?? 0;
  return (
    <div
      className="card px-3 py-2.5 shadow-xl"
      style={{ minWidth: 130 }}
    >
      <div className="text-xs font-mono mb-1" style={{ color: 'rgb(var(--fg-dim))' }}>
        {label}
      </div>
      <div className="text-base font-bold font-mono" style={{ color: 'rgb(var(--fg))' }}>
        ${val.toLocaleString('en-US', { minimumFractionDigits: 0 })}
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>monthly spend</div>
    </div>
  );
}

export function CostTrendChart({ data, loading }: CostTrendChartProps) {
  const avg = data.length ? data.reduce((s, d) => s + d.amount, 0) / data.length : 0;

  return (
    <div className="card p-5 h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>
            Monthly Cloud Spend
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>
            6-month trend · all providers
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>avg / month</div>
          <div className="text-sm font-bold font-mono" style={{ color: 'rgb(var(--fg))' }}>
            {avg > 0 ? `$${avg.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-52 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgb(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: 'rgb(var(--fg-dim))', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgb(var(--fg-dim))', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
              width={42}
            />
            <ReferenceLine
              y={avg}
              stroke="rgb(var(--fg-dim))"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgb(var(--border))', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#costGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#f97316', stroke: 'rgb(var(--bg-card))', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
