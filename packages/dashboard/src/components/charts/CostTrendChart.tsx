'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CostTrendPoint } from '../../lib/types';

interface CostTrendChartProps {
  data: CostTrendPoint[];
  loading?: boolean;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-xl">
      <div className="text-xs text-neutral-400 mb-1">{label}</div>
      <div className="text-sm font-bold text-white font-mono">
        ${(payload[0]?.value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
}

export function CostTrendChart({ data, loading }: CostTrendChartProps) {
  return (
    <div className="bg-[#111111] border border-neutral-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Monthly Cloud Spend</h3>
          <p className="text-xs text-neutral-500 mt-0.5">6-month trend across all providers</p>
        </div>
        <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-2 py-1 rounded border border-neutral-700">
          USD/month
        </span>
      </div>

      {loading ? (
        <div className="h-48 bg-white/5 rounded-lg animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#737373', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#737373', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#costGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
