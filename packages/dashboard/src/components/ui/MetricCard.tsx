import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'blue' | 'orange' | 'green' | 'yellow' | 'red' | 'purple';
  sub?: string;
  loading?: boolean;
  trend?: { direction: 'up' | 'down'; value: string };
}

const colorMap = {
  blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
  orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/20 text-orange-400',
  green: 'from-green-500/20 to-green-600/5 border-green-500/20 text-green-400',
  yellow: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/20 text-yellow-400',
  red: 'from-red-500/20 to-red-600/5 border-red-500/20 text-red-400',
  purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
};

export function MetricCard({ title, value, icon: Icon, color, sub, loading, trend }: MetricCardProps) {
  return (
    <div className={clsx(
      'relative rounded-xl border bg-gradient-to-br p-4 transition-all hover:scale-[1.02] cursor-default',
      colorMap[color],
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('p-1.5 rounded-lg bg-black/30', colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className={clsx(
            'text-[10px] font-mono px-1.5 py-0.5 rounded',
            trend.direction === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400',
          )}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-7 bg-white/5 rounded-md animate-pulse w-20" />
          <div className="h-3 bg-white/5 rounded-md animate-pulse w-14" />
        </div>
      ) : (
        <>
          <div className="text-xl font-bold text-white font-mono">{value}</div>
          <div className="text-[11px] text-neutral-400 mt-1">{title}</div>
          {sub && <div className="text-[10px] text-neutral-500 mt-0.5">{sub}</div>}
        </>
      )}
    </div>
  );
}
