'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';

interface FeedEvent {
  id: number;
  type: 'scan' | 'drift' | 'policy' | 'cost';
  level: 'info' | 'success' | 'warning' | 'critical';
  message: string;
  time: string;
}

const BASE_EVENTS: Omit<FeedEvent, 'id'>[] = [
  { type: 'scan',   level: 'success',  message: 'Scan completed — 847 resources, 0 errors', time: 'just now' },
  { type: 'drift',  level: 'critical', message: 'i-0abc1234: instance_type drift detected',  time: '2m ago'   },
  { type: 'policy', level: 'warning',  message: 'sg-0def5678: SSH open to 0.0.0.0/0',       time: '5m ago'   },
  { type: 'cost',   level: 'info',     message: 'New recommendation: save $207/mo on i-0abc', time: '12m ago' },
  { type: 'scan',   level: 'success',  message: 'eu-west-1 scan: all CIS checks passed',     time: '18m ago'  },
];

const LEVEL_META = {
  info:     { color: '#60a5fa', icon: Info           },
  success:  { color: '#4ade80', icon: CheckCircle    },
  warning:  { color: '#eab308', icon: AlertTriangle  },
  critical: { color: '#ef4444', icon: AlertTriangle  },
};

const NEW_EVENTS: Omit<FeedEvent, 'id' | 'time'>[] = [
  { type: 'scan',   level: 'success',  message: 'us-west-2 region scan completed (218 resources)' },
  { type: 'cost',   level: 'info',     message: 'Cost anomaly: us-east-1 up 8% vs 7d avg'          },
  { type: 'drift',  level: 'warning',  message: 'rds-prod-main: backup_retention changed'           },
  { type: 'policy', level: 'critical', message: 's3-prod-data: public ACL detected'                 },
  { type: 'scan',   level: 'success',  message: 'Snapshot v15 created (checksum: b4e2f1a9)'         },
];

export function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>(
    BASE_EVENTS.map((e, i) => ({ ...e, id: i })),
  );
  const [nextId, setNextId] = useState(BASE_EVENTS.length);
  const [nextEventIdx, setNextEventIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const template = NEW_EVENTS[nextEventIdx % NEW_EVENTS.length]!;
      const newEvent: FeedEvent = {
        ...template,
        id: nextId,
        time: 'just now',
      };
      setEvents(prev => [newEvent, ...prev.slice(0, 7)]);
      setNextId(n => n + 1);
      setNextEventIdx(i => i + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, [nextId, nextEventIdx]);

  return (
    <div className="card overflow-hidden flex flex-col" style={{ height: '100%' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute h-full w-full rounded-full opacity-75" style={{ background: '#4ade80' }} />
            <span className="relative h-2 w-2 rounded-full" style={{ background: '#4ade80' }} />
          </span>
          <span className="text-xs font-semibold" style={{ color: 'rgb(var(--fg))' }}>Live Event Stream</span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>WebSocket · helios/events</span>
      </div>
      <div className="flex-1 overflow-hidden">
        {events.map((e, i) => {
          const m = LEVEL_META[e.level];
          const Icon = m.icon;
          return (
            <div
              key={e.id}
              className="flex items-center gap-3 px-4 py-2.5 transition-all"
              style={{
                borderBottom: i < events.length - 1 ? '1px solid rgb(var(--border-soft))' : 'none',
                opacity: i === 0 ? 1 : 1 - i * 0.1,
                animation: i === 0 ? 'fadeIn 0.4s ease-out' : undefined,
              }}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: m.color }} />
              <div className="flex-1 min-w-0">
                <span className="text-[11px]" style={{ color: 'rgb(var(--fg-muted))' }}>{e.message}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: m.color, background: `${m.color}18` }}>
                  {e.type}
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>{e.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
