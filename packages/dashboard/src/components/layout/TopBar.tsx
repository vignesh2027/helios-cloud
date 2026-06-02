'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { heliosApi } from '../../lib/api';
import { useThemeStore } from '../../lib/theme-store';
import { RefreshCw, Bell, Search, ChevronDown, Sun, Moon, Globe, Zap } from 'lucide-react';
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
    <header className="topbar h-13 flex items-center justify-between px-5 flex-shrink-0" style={{ height: '3.25rem' }}>

      {/* ── Left: Search + Region ── */}
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: 'rgb(var(--fg-dim))' }} />
          <input
            type="text"
            placeholder="Search resources, types, regions…"
            className="input-base pl-9 pr-4 py-1.5 text-xs w-64"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono px-1 py-0.5 rounded"
            style={{ background: 'rgb(var(--bg-hover))', color: 'rgb(var(--fg-dim))', border: '1px solid rgb(var(--border))' }}>
            ⌘K
          </kbd>
        </div>

        <div className="relative flex items-center gap-1.5 input-base px-3 py-1.5">
          <Globe className="w-3 h-3 flex-shrink-0" style={{ color: 'rgb(var(--fg-dim))' }} />
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="appearance-none bg-transparent text-xs pr-5 focus:outline-none cursor-pointer font-mono"
            style={{ color: 'rgb(var(--fg))' }}>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
            style={{ color: 'rgb(var(--fg-dim))' }} />
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-2">

        {/* theme */}
        <button onClick={toggle} className="theme-toggle"
          title={theme === 'dark' ? 'Switch to warm white' : 'Switch to dark'}>
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* refresh */}
        <button onClick={() => queryClient.invalidateQueries()} className="theme-toggle" title="Refresh data">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* alerts */}
        <button className="relative theme-toggle" title="Alerts">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full flex items-center justify-center text-[7px] font-bold"
            style={{ background: '#ef4444', color: '#fff' }}>
            2
          </span>
        </button>

        <div className="w-px h-4" style={{ background: 'rgb(var(--border))' }} />

        {/* scan */}
        <button
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
          className="btn-primary text-xs px-3 py-1.5">
          {scanMutation.isPending
            ? <RefreshCw className={clsx('w-3.5 h-3.5', 'animate-spin')} />
            : <Zap className="w-3.5 h-3.5" />}
          {scanMutation.isPending ? 'Scanning…' : 'Scan Now'}
        </button>

        {/* AWS region badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono"
          style={{ background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))', color: 'rgb(var(--fg-muted))' }}>
          <span className="font-bold" style={{ color: '#FF9900' }}>AWS</span>
          <span style={{ color: 'rgb(var(--fg-dim))' }}>·</span>
          {region}
        </div>
      </div>
    </header>
  );
}
