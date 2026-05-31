'use client';

export function DriftSeverityBar() {
  const mockData = [
    { severity: 'critical', count: 2, color: '#ef4444' },
    { severity: 'high', count: 5, color: '#f97316' },
    { severity: 'medium', count: 12, color: '#eab308' },
    { severity: 'low', count: 8, color: '#6b7280' },
  ];

  const total = mockData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-[#111111] border border-neutral-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Infrastructure Drift Status</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {total} drifted resources detected • Last checked 5 min ago
          </p>
        </div>
        <button className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
          Run check →
        </button>
      </div>

      <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-4">
        {mockData.map(d => (
          <div
            key={d.severity}
            style={{ width: `${(d.count / total) * 100}%`, background: d.color }}
            className="transition-all"
          />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {mockData.map(d => (
          <div key={d.severity} className="text-center">
            <div className="text-lg font-bold font-mono" style={{ color: d.color }}>{d.count}</div>
            <div className="text-[11px] text-neutral-500 capitalize">{d.severity}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
