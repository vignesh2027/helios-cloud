'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

export function ScanStatusBadge() {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [lastScan, setLastScan] = useState<string>('2 min ago');

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg">
      <div className={clsx(
        'w-1.5 h-1.5 rounded-full',
        status === 'scanning' ? 'bg-orange-400 animate-pulse' : 'bg-green-400',
      )} />
      <span className="text-[11px] text-neutral-400">
        {status === 'scanning' ? 'Scanning...' : `Last scan: ${lastScan}`}
      </span>
    </div>
  );
}
