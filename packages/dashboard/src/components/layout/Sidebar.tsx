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
  Activity,
} from 'lucide-react';

const nav = [
  { href: '/',          label: 'Overview',     icon: LayoutDashboard },
  { href: '/resources', label: 'Resources',    icon: Server },
  { href: '/cost',      label: 'Cost Optimizer', icon: DollarSign },
  { href: '/drift',     label: 'Drift',        icon: AlertTriangle },
  { href: '/policy',    label: 'Compliance',   icon: Shield },
  { href: '/topology',  label: 'Topology',     icon: Network },
  { href: '/activity',  label: 'Activity',     icon: Activity },
];

const secondaryNav = [
  { href: '/docs',     label: 'API Docs', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar w-56 flex flex-col flex-shrink-0">
      {/* logo */}
      <div className="p-4" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold text-fg tracking-wide" style={{ color: 'rgb(var(--fg))' }}>
              HELIOS
            </div>
            <div className="text-[10px] font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>
              v0.1.0 · aws
            </div>
          </div>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <div
          className="text-[10px] font-semibold uppercase tracking-widest px-2 py-2"
          style={{ color: 'rgb(var(--fg-dim))' }}
        >
          Platform
        </div>
        {nav.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={clsx('nav-item', active && 'active')}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div
          className="text-[10px] font-semibold uppercase tracking-widest px-2 py-2 mt-4"
          style={{ color: 'rgb(var(--fg-dim))' }}
        >
          System
        </div>
        {secondaryNav.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={clsx('nav-item', active && 'active')}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* user */}
      <div className="p-3" style={{ borderTop: '1px solid rgb(var(--border))' }}>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            V
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--fg))' }}>
              Vigneshwar L
            </div>
            <div className="text-[10px] font-mono truncate" style={{ color: 'rgb(var(--fg-dim))' }}>
              Platform Admin
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
