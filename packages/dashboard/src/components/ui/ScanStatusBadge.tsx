'use client';

export function ScanStatusBadge() {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
      style={{
        background: 'rgb(var(--bg-elevated))',
        border: '1px solid rgb(var(--border))',
      }}
    >
      <span className="relative flex h-2 w-2">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ background: '#4ade80' }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#4ade80' }} />
      </span>
      <span style={{ color: 'rgb(var(--fg-muted))' }}>
        Last scan: <span className="font-mono" style={{ color: 'rgb(var(--fg))' }}>2 min ago</span>
      </span>
    </div>
  );
}
