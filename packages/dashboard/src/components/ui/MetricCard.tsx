import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'blue' | 'orange' | 'green' | 'yellow' | 'red' | 'purple';
  sub?: string;
  loading?: boolean;
  trend?: { direction: 'up' | 'down'; value: string; positive?: boolean };
  onClick?: () => void;
}

/* These use actual color values (not CSS vars) so they work in both themes */
const colorMap = {
  blue:   { dot: '#3b82f6', glow: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.22)',  text: '#3b82f6',  bg: 'rgba(59,130,246,0.07)' },
  orange: { dot: '#f97316', glow: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.22)',  text: '#f97316',  bg: 'rgba(249,115,22,0.07)' },
  green:  { dot: '#22c55e', glow: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.22)',   text: '#22c55e',  bg: 'rgba(34,197,94,0.07)'  },
  yellow: { dot: '#eab308', glow: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.22)',   text: '#ca8a04',  bg: 'rgba(234,179,8,0.07)'  },
  red:    { dot: '#ef4444', glow: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.22)',   text: '#ef4444',  bg: 'rgba(239,68,68,0.07)'  },
  purple: { dot: '#a855f7', glow: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.22)',  text: '#a855f7',  bg: 'rgba(168,85,247,0.07)' },
};

export function MetricCard({ title, value, icon: Icon, color, sub, loading, trend, onClick }: MetricCardProps) {
  const c = colorMap[color];

  return (
    <div
      className={clsx(
        'card relative p-4 transition-all duration-200',
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]',
      )}
      style={{
        borderColor: c.border,
        boxShadow: `var(--card-shadow), ${c.glow} 0 0 0 0`,
      }}
      onClick={onClick}
    >
      {/* colored top strip */}
      <div
        className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${c.dot}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="p-1.5 rounded-lg"
          style={{ background: c.bg, color: c.text }}
        >
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold"
            style={{
              background: (trend.positive ?? trend.direction === 'down') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color:      (trend.positive ?? trend.direction === 'down') ? '#22c55e' : '#ef4444',
            }}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 mt-1">
          <div className="skeleton h-6 w-24" />
          <div className="skeleton h-3 w-16" />
        </div>
      ) : (
        <>
          <div className="text-[1.375rem] font-bold font-mono leading-none" style={{ color: 'rgb(var(--fg))' }}>
            {value}
          </div>
          <div className="text-[0.6875rem] font-medium mt-1.5" style={{ color: 'rgb(var(--fg-muted))' }}>
            {title}
          </div>
          {sub && (
            <div className="text-[0.625rem] mt-0.5 font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>
              {sub}
            </div>
          )}
        </>
      )}
    </div>
  );
}
