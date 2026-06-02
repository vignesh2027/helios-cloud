'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Server, DollarSign, AlertTriangle,
  Shield, Network, Settings, BookOpen, Zap,
  Activity, Users, PiggyBank, ChevronRight,
} from 'lucide-react';

const NAV = [
  { href: '/',          label: 'Overview',       icon: LayoutDashboard, badge: null,    alert: false },
  { href: '/resources', label: 'Resources',      icon: Server,          badge: '847',   alert: false },
  { href: '/cost',      label: 'Cost Optimizer', icon: DollarSign,      badge: '$6.2k', alert: false },
  { href: '/budget',    label: 'Budget',         icon: PiggyBank,       badge: null,    alert: false },
  { href: '/drift',     label: 'Drift',          icon: AlertTriangle,   badge: '7',     alert: true  },
  { href: '/policy',    label: 'Compliance',     icon: Shield,          badge: '14',    alert: true  },
  { href: '/topology',  label: 'Topology',       icon: Network,         badge: null,    alert: false },
  { href: '/accounts',  label: 'Accounts',       icon: Users,           badge: '3',     alert: false },
  { href: '/activity',  label: 'Activity',       icon: Activity,        badge: null,    alert: false },
];

const SECONDARY_NAV = [
  { href: '/docs',     label: 'Docs & API', icon: BookOpen },
  { href: '/settings', label: 'Settings',   icon: Settings },
];

const ACCOUNT_PILLS = [
  { id: '12…9012', env: 'prod',  color: '#ef4444' },
  { id: '23…0123', env: 'stage', color: '#eab308' },
  { id: '34…1234', env: 'dev',   color: '#60a5fa' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar w-56 flex flex-col flex-shrink-0 h-full">

      {/* ── Logo ── */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgb(var(--sidebar-border))' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-widest" style={{ color: 'rgb(var(--fg))' }}>
              HELIOS
            </div>
            <div className="text-[9px] font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>
              v0.1.0 · Cloud Platform
            </div>
          </div>
        </div>

        {/* multi-account strip */}
        <div className="flex gap-1.5 mt-3">
          {ACCOUNT_PILLS.map(a => (
            <div key={a.id}
              className="flex-1 px-1.5 py-1 rounded-lg text-center cursor-pointer"
              style={{ background: `${a.color}10`, border: `1px solid ${a.color}22` }}
              title={`Account ${a.id}`}>
              <div className="text-[8px] font-mono font-bold" style={{ color: a.color }}>{a.env}</div>
              <div className="text-[7px] font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>{a.id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Primary Nav ── */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        <div className="section-label px-2 pb-2">Platform</div>
        {NAV.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={clsx('nav-item group', active && 'active')}>
              <Icon className="w-[15px] h-[15px] flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: item.alert ? 'rgba(239,68,68,0.1)' : 'rgb(var(--bg-elevated))',
                    color: item.alert ? '#ef4444' : 'rgb(var(--fg-dim))',
                    border: item.alert ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgb(var(--border))',
                  }}>
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'rgb(var(--accent))' }} />}
            </Link>
          );
        })}

        <div className="section-label px-2 pt-4 pb-2">System</div>
        {SECONDARY_NAV.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={clsx('nav-item', active && 'active')}>
              <Icon className="w-[15px] h-[15px] flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Scanner Status ── */}
      <div className="mx-2.5 mb-2 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
        <div className="flex items-center gap-2">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
          <span className="text-[10px] font-semibold" style={{ color: '#22c55e' }}>Scanner Active</span>
        </div>
        <div className="text-[9px] font-mono mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>
          Last: 2 min ago · next in 3m
        </div>
      </div>

      {/* ── User ── */}
      <div className="px-2.5 pb-3" style={{ borderTop: '1px solid rgb(var(--sidebar-border))', paddingTop: '0.75rem' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl cursor-pointer transition-colors hover:bg-[rgb(var(--bg-hover))]"
          style={{}}>

          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
            V
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--fg))' }}>Vigneshwar L</div>
            <div className="text-[9px] font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>Platform Admin</div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#22c55e' }} />
        </div>
      </div>

    </aside>
  );
}
