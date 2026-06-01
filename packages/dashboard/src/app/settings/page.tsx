'use client';

import { useState } from 'react';
import { useThemeStore } from '../../lib/theme-store';
import { Settings, Sun, Moon, Globe, Shield, Bell, Key, Save } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const [region, setRegion] = useState('us-east-1');
  const [scanInterval, setScanInterval] = useState('5');
  const [idleThreshold, setIdleThreshold] = useState('14');
  const [confidenceThreshold, setConfidenceThreshold] = useState('85');
  const [slackWebhook, setSlackWebhook] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Section = ({ title, icon: Icon, children }: { title: string; icon: typeof Settings; children: React.ReactNode }) => (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
        <div className="p-1.5 rounded-lg" style={{ background: 'rgb(var(--bg-elevated))' }}>
          <Icon className="w-4 h-4" style={{ color: 'rgb(var(--accent))' }} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--fg))' }}>{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

  const Field = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="text-xs font-medium" style={{ color: 'rgb(var(--fg))' }}>{label}</div>
        {sub && <div className="text-[11px] mt-0.5" style={{ color: 'rgb(var(--fg-dim))' }}>{sub}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--fg))' }}>Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--fg-muted))' }}>Configure HELIOS platform preferences</p>
        </div>
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-3.5 h-3.5" />
          {saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>

      {/* Appearance */}
      <Section title="Appearance" icon={Sun}>
        <Field label="Theme" sub="Switch between dark and warm-white modes">
          <div className="flex gap-1.5">
            {(['dark', 'warm'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: theme === t ? 'rgb(var(--accent) / 0.12)' : 'rgb(var(--bg-elevated))',
                  border: `1px solid ${theme === t ? 'rgb(var(--accent) / 0.3)' : 'rgb(var(--border))'}`,
                  color: theme === t ? 'rgb(var(--accent))' : 'rgb(var(--fg-muted))',
                }}
              >
                {t === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                {t === 'dark' ? 'Dark' : 'Warm White'}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Provider */}
      <Section title="Cloud Provider" icon={Globe}>
        <Field label="Default Region" sub="Primary AWS region for scans and queries">
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="input-base px-3 py-1.5 text-xs"
          >
            {['us-east-1','us-west-2','eu-west-1','eu-central-1','ap-southeast-1','ap-northeast-1'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Scan Interval" sub="How often to scan for new resources (minutes)">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={scanInterval}
              onChange={e => setScanInterval(e.target.value)}
              min="1" max="60"
              className="input-base px-3 py-1.5 text-xs w-20 text-center"
            />
            <span className="text-xs" style={{ color: 'rgb(var(--fg-dim))' }}>min</span>
          </div>
        </Field>
      </Section>

      {/* Optimizer */}
      <Section title="Cost Optimizer" icon={Shield}>
        <Field label="Idle Detection Threshold" sub="Days before a resource is considered idle">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={idleThreshold}
              onChange={e => setIdleThreshold(e.target.value)}
              min="1" max="90"
              className="input-base px-3 py-1.5 text-xs w-20 text-center"
            />
            <span className="text-xs" style={{ color: 'rgb(var(--fg-dim))' }}>days</span>
          </div>
        </Field>
        <Field label="Confidence Threshold" sub="Minimum confidence % to show a recommendation">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={confidenceThreshold}
              onChange={e => setConfidenceThreshold(e.target.value)}
              min="50" max="99"
              className="input-base px-3 py-1.5 text-xs w-20 text-center"
            />
            <span className="text-xs" style={{ color: 'rgb(var(--fg-dim))' }}>%</span>
          </div>
        </Field>
      </Section>

      {/* Alerts */}
      <Section title="Alerting" icon={Bell}>
        <Field label="Slack Webhook" sub="Receive drift and policy violation alerts in Slack">
          <input
            type="url"
            value={slackWebhook}
            onChange={e => setSlackWebhook(e.target.value)}
            placeholder="https://hooks.slack.com/services/…"
            className="input-base px-3 py-1.5 text-xs w-72"
          />
        </Field>
        <Field label="Alert on Drift Severity" sub="Minimum severity to trigger an alert">
          <select className="input-base px-3 py-1.5 text-xs" defaultValue="high">
            {['critical', 'high', 'medium', 'low'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </Section>

      {/* API */}
      <Section title="API Access" icon={Key}>
        <Field label="API Key" sub="Use this key to authenticate with the HELIOS REST API">
          <div className="flex items-center gap-2">
            <input
              type="password"
              defaultValue="hlx_sk_demo_a1b2c3d4e5f6"
              readOnly
              className="input-base px-3 py-1.5 text-xs font-mono w-52"
            />
            <button className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--fg-muted))' }}>
              Rotate
            </button>
          </div>
        </Field>
        <Field label="API Endpoint" sub="Base URL for the HELIOS REST API">
          <input
            type="text"
            defaultValue="http://localhost:8080/api/v1"
            readOnly
            className="input-base px-3 py-1.5 text-xs font-mono w-64"
          />
        </Field>
      </Section>
    </div>
  );
}
