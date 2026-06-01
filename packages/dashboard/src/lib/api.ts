import axios from 'axios';
import type { Resource } from './types';
import {
  MOCK_RESOURCE_SUMMARY,
  MOCK_COST_SUMMARY,
  MOCK_VIOLATIONS,
} from './mock-data';

const DEMO_MODE =
  process.env['NEXT_PUBLIC_DEMO_MODE'] === 'true' ||
  (typeof window !== 'undefined' && window.location.hostname.includes('github.io'));

const BASE = process.env['NEXT_PUBLIC_HELIOS_API_URL'] ?? '/api/v1';

const client = axios.create({
  baseURL: BASE,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  r => r.data,
  err => {
    const message = err.response?.data?.error ?? err.message ?? 'Unknown error';
    throw new Error(message);
  },
);

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const heliosApi = {
  async getResources(params?: {
    provider?: string; region?: string; type?: string;
    status?: string; limit?: number; offset?: number;
  }) {
    if (DEMO_MODE) {
      await delay(400);
      return { resources: [] as Resource[], total: MOCK_RESOURCE_SUMMARY.total };
    }
    return client.get<never, { resources: Resource[]; total: number }>('/resources', { params });
  },

  async getResourceById(id: string) {
    if (DEMO_MODE) { await delay(200); return null; }
    return client.get<never, Resource>(`/resources/${encodeURIComponent(id)}`);
  },

  async getResourceDependencies(id: string) {
    if (DEMO_MODE) { await delay(200); return null; }
    return client.get<never, { resource: Resource; dependencies: Resource[]; dependents: Resource[] }>(
      `/resources/${encodeURIComponent(id)}/dependencies`,
    );
  },

  async getResourceSummary() {
    if (DEMO_MODE) { await delay(600); return MOCK_RESOURCE_SUMMARY; }
    return client.get<never, typeof MOCK_RESOURCE_SUMMARY>('/resources/summary');
  },

  async triggerScan() {
    if (DEMO_MODE) { await delay(1200); return { message: 'Demo mode — scan simulated', startedAt: new Date().toISOString() }; }
    return client.post<never, { message: string; startedAt: string }>('/scan');
  },

  async getCostSummary() {
    if (DEMO_MODE) { await delay(700); return MOCK_COST_SUMMARY; }
    return client.get<never, typeof MOCK_COST_SUMMARY>('/cost/summary');
  },

  async getCostRecommendations(params?: { action?: string; minSavings?: number; region?: string; limit?: number }) {
    if (DEMO_MODE) {
      await delay(400);
      let recs = MOCK_COST_SUMMARY.recommendations;
      if (params?.action) recs = recs.filter(r => r.action === params.action);
      if (params?.minSavings) recs = recs.filter(r => r.monthlySavings >= (params.minSavings ?? 0));
      return { total: recs.length, recommendations: recs.slice(0, params?.limit ?? 50), totalMonthlySavings: recs.reduce((s, r) => s + r.monthlySavings, 0) };
    }
    return client.get<never, { total: number; recommendations: import('./types').CostRecommendation[]; totalMonthlySavings: number }>(
      '/cost/recommendations', { params },
    );
  },

  async getCostTrend() {
    if (DEMO_MODE) { await delay(300); return { trend: MOCK_COST_SUMMARY.trend, byProvider: MOCK_COST_SUMMARY.byProvider, byRegion: MOCK_COST_SUMMARY.byRegion }; }
    return client.get<never, { trend: import('./types').CostTrendPoint[]; byProvider: Record<string, number>; byRegion: Record<string, number> }>('/cost/trend');
  },

  async getDrift(stateFile: string) {
    if (DEMO_MODE) { await delay(500); return null as import('./types').DriftReport | null; }
    return client.get<never, import('./types').DriftReport>('/drift', { params: { stateFile } });
  },

  async getCompliance(framework: string) {
    if (DEMO_MODE) { await delay(400); return { framework, reports: [] }; }
    return client.get<never, { framework: string; reports: import('./types').ComplianceReport[] }>(
      '/policy/compliance', { params: { framework } },
    );
  },

  async getPolicyViolations(params?: { framework?: string; severity?: string; resourceType?: string; limit?: number }) {
    if (DEMO_MODE) { await delay(500); return MOCK_VIOLATIONS; }
    return client.get<never, { total: number; violations: import('./types').PolicyViolation[] }>(
      '/policy/violations', { params },
    );
  },
};
