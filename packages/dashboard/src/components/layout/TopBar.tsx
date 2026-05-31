'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { heliosApi } from '../../lib/api';
import { useThemeStore } from '../../lib/theme-store';
import { RefreshCw, Bell, Search, ChevronDown, Sun, Moon, Globe } from 'lucide-react';
import { clsx } from 'clsx';

const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'];

export function TopBar() {
  const queryClient = useQueryClient();
  const [region, setRegion] = useState('us-east-1');
  const { theme, toggle } = useThemeStore();

  const scanMutation = useMutation({
    mutationFn: () => heliosApi.triggerScan(),
    onSuccess: () => setTimeout(() => queryClient.invalidateQueries(), 5000),
  });

  return (
    <header className="topbar h-14 flex items-center justify-between px-5 flex-shrink-0">
      {/* left */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: 'rgb(var(--fg-dim))' }}
          />
          <input
            type="text"
            placeholder="Search resources, regions, types…"
            className="input-base pl-9 pr-4 py-1.5 text-sm w-72"
          />
        </div>

        <div className="relative flex items-center gap-1.5 input-base px-3 py-1.5">
          <Globe className="w-3.5 h-3.5" style={{ color: 'rgb(var(--fg-dim))' }} />
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="appearance-none bg-transparent text-sm pr-5 focus:outline-none cursor-pointer"
            style={{ color: 'rgb(var(--fg))' }}
          >
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: 'rgb(var(--fg-dim))' }} />
        </div>
      </div>

      {/* right */}
      <div className="flex items-center gap-2">
        {/* theme toggle */}
        <button
          onClick={toggle}
          className="theme-toggle"
          title={theme === 'dark' ? 'Switch to warm white' : 'Switch to dark'}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={() => queryClient.invalidateQueries()}
          className="theme-toggle"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
          className="btn-primary"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5', scanMutation.isPending && 'animate-spin')} />
          {scanMutation.isPending ? 'Scanning…' : 'Scan Now'}
        </button>

        <button className="relative theme-toggle">
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: 'rgb(var(--accent))' }}
          />
        </button>

        <div className="w-px h-5" style={{ background: 'rgb(var(--border))' }} />

        {/* account badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono"
          style={{
            background: 'rgb(var(--bg-elevated))',
            border: '1px solid rgb(var(--border))',
            color: 'rgb(var(--fg-muted))',
          }}
        >
          <span className="font-bold" style={{ color: '#FF9900' }}>AWS</span>
          <span style={{ color: 'rgb(var(--fg-dim))' }}>·</span>
          {region}
        </div>
      </div>
    </header>
  );
}
