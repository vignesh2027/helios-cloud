'use client';

import type { CostRecommendation } from '../../lib/types';
import { TrendingDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const actionColors: Record<string, string> = {
  rightsize: 'bg-blue-500/10 text-blue-400',
  terminate: 'bg-red-500/10 text-red-400',
  schedule: 'bg-purple-500/10 text-purple-400',
  'savings-plan': 'bg-green-500/10 text-green-400',
  'storage-tier': 'bg-yellow-500/10 text-yellow-400',
  'delete-snapshot': 'bg-red-500/10 text-red-400',
};

interface TopRecommendationsProps {
  recommendations: CostRecommendation[];
  loading?: boolean;
}

export function TopRecommendations({ recommendations, loading }: TopRecommendationsProps) {
  return (
    <div className="bg-[#111111] border border-neutral-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-semibold text-white">Top Cost Recommendations</h3>
        </div>
        <button className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
          View all →
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-8">
          <TrendingDown className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">No recommendations available</p>
          <p className="text-xs text-neutral-600 mt-1">Run a scan to analyze costs</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recommendations.map(rec => (
            <div
              key={rec.resourceId}
              className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={clsx(
                    'text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold',
                    actionColors[rec.action] ?? 'bg-neutral-800 text-neutral-400',
                  )}>
                    {rec.action}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono truncate">
                    {rec.currentConfig} → {rec.recommendedConfig}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 truncate">{rec.rationale}</p>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-green-400">
                    ${rec.monthlySavings.toFixed(0)}/mo
                  </div>
                  <div className="text-[10px] text-neutral-600">
                    {(rec.confidenceScore * 100).toFixed(0)}% conf
                  </div>
                </div>
                <ChevronRight className="w-3 h-3 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
