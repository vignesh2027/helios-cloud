'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { heliosApi } from '../../lib/api';
import { RefreshCw, Bell, Search, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

export function TopBar() {
  const queryClient = useQueryClient();
  const [region, setRegion] = useState('us-east-1');

  const scanMutation = useMutation({
    mutationFn: () => heliosApi.triggerScan(),
    onSuccess: () => {
      setTimeout(() => queryClient.invalidateQueries(), 5000);
    },
  });

  const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1'];

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-[#111111] border-b border-neutral-800 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search resources..."
            className="pl-9 pr-4 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-neutral-300 placeholder-neutral-500 focus:outline-none focus:border-orange-500/50 w-64"
          />
        </div>

        <div className="relative">
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-neutral-300 focus:outline-none focus:border-orange-500/50"
          >
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500 pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => queryClient.invalidateQueries()}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            scanMutation.isPending
              ? 'bg-orange-500/50 text-orange-200 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600',
          )}
        >
          <RefreshCw className={clsx('w-3.5 h-3.5', scanMutation.isPending && 'animate-spin')} />
          {scanMutation.isPending ? 'Scanning...' : 'Scan Now'}
        </button>

        <button className="relative p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
        </button>

        <div className="w-px h-5 bg-neutral-700" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700">
            AWS
          </span>
          <span className="text-xs text-neutral-400">us-east-1</span>
        </div>
      </div>
    </header>
  );
}
