'use client';

import { Network } from 'lucide-react';

const NODES = [
  { id: 'vpc-main',    label: 'VPC',           sub: '10.0.0.0/16',        type: 'vpc',      x: 420, y: 80   },
  { id: 'igw-main',    label: 'Internet GW',   sub: 'igw-0abc123',        type: 'igw',      x: 420, y: 10   },
  { id: 'sub-pub-1',   label: 'Public Subnet', sub: 'us-east-1a',         type: 'subnet',   x: 200, y: 180  },
  { id: 'sub-pub-2',   label: 'Public Subnet', sub: 'us-east-1b',         type: 'subnet',   x: 420, y: 180  },
  { id: 'sub-priv-1',  label: 'Private Subnet',sub: 'us-east-1a',         type: 'subnet',   x: 200, y: 310  },
  { id: 'sub-priv-2',  label: 'Private Subnet',sub: 'us-east-1b',         type: 'subnet',   x: 420, y: 310  },
  { id: 'alb-main',    label: 'App Load Balancer', sub: 'alb-0def456',    type: 'elb',      x: 310, y: 250  },
  { id: 'ec2-api-1',   label: 'API Server',    sub: 'i-0abc · m5.xlarge', type: 'ec2',      x: 160, y: 400  },
  { id: 'ec2-api-2',   label: 'API Server',    sub: 'i-0def · m5.xlarge', type: 'ec2',      x: 310, y: 400  },
  { id: 'ec2-worker',  label: 'Worker',        sub: 'i-0ghi · m5.2xl',    type: 'ec2',      x: 460, y: 400  },
  { id: 'rds-main',    label: 'RDS Primary',   sub: 'db.r5.xl · MySQL',   type: 'rds',      x: 620, y: 400  },
  { id: 'rds-read',    label: 'RDS Replica',   sub: 'db.r5.lg · Read',    type: 'rds',      x: 620, y: 310  },
  { id: 'nat-gw',      label: 'NAT Gateway',   sub: 'nat-0abc123',        type: 'nat',      x: 620, y: 180  },
  { id: 'lambda-fn',   label: 'Lambda',        sub: 'proc-events · 512MB',type: 'lambda',   x: 620, y: 80   },
  { id: 's3-data',     label: 'S3 Bucket',     sub: 'prod-data-store',    type: 's3',       x: 760, y: 180  },
];

const EDGES = [
  ['igw-main','vpc-main'],['vpc-main','sub-pub-1'],['vpc-main','sub-pub-2'],['vpc-main','sub-priv-1'],['vpc-main','sub-priv-2'],
  ['sub-pub-1','alb-main'],['sub-pub-2','alb-main'],['alb-main','ec2-api-1'],['alb-main','ec2-api-2'],
  ['sub-priv-1','ec2-api-1'],['sub-priv-2','ec2-api-2'],['sub-priv-2','ec2-worker'],
  ['ec2-api-1','rds-main'],['ec2-api-2','rds-main'],['rds-main','rds-read'],
  ['sub-pub-1','nat-gw'],['nat-gw','lambda-fn'],['lambda-fn','s3-data'],['ec2-worker','s3-data'],
];

const TYPE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  vpc:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',    label: 'VPC'     },
  igw:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)',   label: 'IGW'     },
  subnet: { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)',   label: 'Subnet'  },
  ec2:    { color: '#f97316', bg: 'rgba(249,115,22,0.15)',    label: 'EC2'     },
  rds:    { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',     label: 'RDS'     },
  elb:    { color: '#facc15', bg: 'rgba(250,204,21,0.15)',    label: 'ELB'     },
  nat:    { color: '#f472b6', bg: 'rgba(244,114,182,0.15)',   label: 'NAT'     },
  lambda: { color: '#fb923c', bg: 'rgba(251,146,60,0.15)',    label: 'Lambda'  },
  s3:     { color: '#4ade80', bg: 'rgba(74,222,128,0.15)',    label: 'S3'      },
};

export default function TopologyPage() {
  const nodeMap = new Map(NODES.map(n => [n.id, n]));

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--fg))' }}>Resource Topology</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>
            Dependency graph — us-east-1 production VPC
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))', color: 'rgb(var(--fg-dim))' }}>
          <Network className="w-3.5 h-3.5" />
          {NODES.length} nodes · {EDGES.length} edges
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          {Object.entries(TYPE_STYLE).map(([type, s]) => (
            <div key={type} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded" style={{ background: s.bg, border: `1.5px solid ${s.color}` }} />
              <span style={{ color: 'rgb(var(--fg-muted))' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG topology map */}
      <div className="card p-4 overflow-auto">
        <svg width="860" height="490" viewBox="0 0 860 490" className="w-full" style={{ minWidth: 600 }}>
          <defs>
            <marker id="arrow-topo" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="rgb(var(--border))" />
            </marker>
          </defs>

          {/* Edges */}
          {EDGES.map(([a, b], i) => {
            const na = nodeMap.get(a); const nb = nodeMap.get(b);
            if (!na || !nb) return null;
            return (
              <line key={i}
                x1={na.x + 60} y1={na.y + 20} x2={nb.x + 60} y2={nb.y + 20}
                stroke="rgb(var(--border))" strokeWidth="1.5" strokeDasharray="5,3"
                markerEnd="url(#arrow-topo)" opacity="0.6"
              />
            );
          })}

          {/* Nodes */}
          {NODES.map(node => {
            const s = TYPE_STYLE[node.type]!;
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className="cursor-pointer">
                <rect x="0" y="0" width="120" height="40" rx="8"
                  fill={s.bg} stroke={s.color} strokeWidth="1.5" />
                <text x="10" y="14" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono, monospace" fill={s.color}>{node.label}</text>
                <text x="10" y="28" fontSize="9" fontFamily="JetBrains Mono, monospace" fill="rgb(var(--fg-dim))">{node.sub}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>All Nodes</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'rgb(var(--border))' }}>
          {NODES.map(node => {
            const s = TYPE_STYLE[node.type]!;
            return (
              <div key={node.id} className="flex items-center gap-3 p-4" style={{ background: 'rgb(var(--bg-card))' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono"
                  style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}33` }}>
                  {s.label.slice(0, 2)}
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: 'rgb(var(--fg))' }}>{node.label}</div>
                  <div className="text-[11px] font-mono" style={{ color: 'rgb(var(--fg-dim))' }}>{node.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
