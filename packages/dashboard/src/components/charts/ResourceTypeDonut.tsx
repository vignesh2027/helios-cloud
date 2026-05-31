'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#f97316', '#facc15', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fb923c'];

interface ResourceTypeDonutProps {
  data: Record<string, number>;
  loading?: boolean;
}

export function ResourceTypeDonut({ data, loading }: ResourceTypeDonutProps) {
  const chartData = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.replace(':', '\n'), value }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-[#111111] border border-neutral-800 rounded-xl p-5 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Resource Distribution</h3>
        <p className="text-xs text-neutral-500 mt-0.5">By resource type</p>
      </div>

      {loading ? (
        <div className="h-48 bg-white/5 rounded-lg animate-pulse" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#171717',
                    border: '1px solid #262626',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: '#d4d4d4' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xl font-bold text-white font-mono">{total}</div>
                <div className="text-[10px] text-neutral-500">total</div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            {chartData.slice(0, 5).map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-[11px] text-neutral-400 font-mono truncate max-w-[120px]">
                    {item.name.replace('\n', ':')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-neutral-300">{item.value}</span>
                  <span className="text-[10px] text-neutral-600">
                    {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
