'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const PALETTE = ['#f97316','#facc15','#4ade80','#60a5fa','#a78bfa','#f472b6','#34d399','#fb923c'];

interface ResourceTypeDonutProps {
  data: Record<string, number>;
  loading?: boolean;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 shadow-xl text-xs font-mono">
      <span style={{ color: 'rgb(var(--fg-muted))' }}>{payload[0]?.name}</span>
      <span className="ml-2 font-bold" style={{ color: 'rgb(var(--fg))' }}>{payload[0]?.value}</span>
    </div>
  );
}

export function ResourceTypeDonut({ data, loading }: ResourceTypeDonutProps) {
  const chartData = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>
          Resource Distribution
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>
          By resource type
        </p>
      </div>

      {loading ? (
        <div className="skeleton flex-1 rounded-xl" />
      ) : (
        <div className="flex flex-col gap-4 flex-1">
          <div className="relative">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={74}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PALETTE[i % PALETTE.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-bold font-mono leading-none" style={{ color: 'rgb(var(--fg))' }}>
                  {total.toLocaleString()}
                </div>
                <div className="text-[10px] mt-1 font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>
                  resources
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 overflow-hidden">
            {chartData.slice(0, 6).map((item, i) => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: PALETTE[i % PALETTE.length] }}
                  />
                  <span className="text-[11px] font-mono truncate" style={{ color: 'rgb(var(--fg-muted))' }}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] font-bold font-mono" style={{ color: 'rgb(var(--fg))' }}>
                    {item.value.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-mono w-8 text-right" style={{ color: 'rgb(var(--fg-dim))' }}>
                    {total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : '0%'}
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
