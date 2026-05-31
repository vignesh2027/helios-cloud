'use client';

import { useQuery } from '@tanstack/react-query';
import { heliosApi } from '../../lib/api';
import { Shield, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const severityStyles: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  informational: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export function RecentViolations() {
  const { data, isLoading } = useQuery({
    queryKey: ['policy', 'violations'],
    queryFn: () => heliosApi.getPolicyViolations({ limit: 5 }),
    refetchInterval: 60_000,
  });

  return (
    <div className="bg-[#111111] border border-neutral-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold text-white">Recent Policy Violations</h3>
        </div>
        <button className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
          View all →
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !data || data.violations.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="w-8 h-8 text-green-700 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">No violations found</p>
          <p className="text-xs text-neutral-600 mt-1">Your infrastructure is compliant</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.violations.map(v => (
            <div
              key={`${v.ruleId}-${v.resourceId}`}
              className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={clsx(
                    'text-[10px] font-mono px-1.5 py-0.5 rounded border',
                    severityStyles[v.severity],
                  )}>
                    {v.severity}
                  </span>
                  <span className="text-[11px] text-neutral-300 font-medium truncate">{v.ruleName}</span>
                </div>
                <p className="text-xs text-neutral-500 truncate">{v.message}</p>
              </div>
              <ChevronRight className="w-3 h-3 text-neutral-600 group-hover:text-neutral-400 transition-colors ml-3 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
