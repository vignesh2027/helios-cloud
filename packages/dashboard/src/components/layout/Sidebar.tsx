'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Server,
  DollarSign,
  AlertTriangle,
  Shield,
  Network,
  Settings,
  BookOpen,
  Zap,
} from 'lucide-react';

const nav = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/resources', label: 'Resources', icon: Server },
  { href: '/cost', label: 'Cost Optimizer', icon: DollarSign },
  { href: '/drift', label: 'Drift Detection', icon: AlertTriangle },
  { href: '/policy', label: 'Compliance', icon: Shield },
  { href: '/topology', label: 'Topology', icon: Network },
];

const secondaryNav = [
  { href: '/docs', label: 'API Docs', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex flex-col flex-shrink-0 bg-[#111111] border-r border-neutral-800">
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">HELIOS</div>
            <div className="text-[10px] text-neutral-500 font-mono">v0.1.0</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest px-2 py-2">
          Platform
        </div>
        {nav.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5',
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest px-2 py-2 mt-4">
          System
        </div>
        {secondaryNav.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-orange-500/10 text-orange-400'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5',
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-neutral-800">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center text-[10px] font-bold text-white">
            V
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-white truncate">Vigneshwar L</div>
            <div className="text-[10px] text-neutral-500 truncate">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
