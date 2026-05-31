import axios from 'axios';
import type { Resource } from './types';

const BASE = process.env['NEXT_PUBLIC_HELIOS_API_URL'] ?? 'http://localhost:8080/api/v1';

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

export const heliosApi = {
  async getResources(params?: {
    provider?: string;
    region?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    return client.get<never, { resources: Resource[]; total: number }>('/resources', { params });
  },

  async getResourceById(id: string) {
    return client.get<never, Resource>(`/resources/${encodeURIComponent(id)}`);
  },

  async getResourceDependencies(id: string) {
    return client.get<never, { resource: Resource; dependencies: Resource[]; dependents: Resource[] }>(
      `/resources/${encodeURIComponent(id)}/dependencies`,
    );
  },

  async getResourceSummary() {
    return client.get<never, {
      total: number;
      edgeCount: number;
      byType: Record<string, number>;
      byRegion: Record<string, number>;
      byStatus: Record<string, number>;
      orphaned: number;
    }>('/resources/summary');
  },

  async triggerScan() {
    return client.post<never, { message: string; startedAt: string }>('/scan');
  },

  async getCostSummary() {
    return client.get<never, import('./types').CostSummary>('/cost/summary');
  },

  async getCostRecommendations(params?: {
    action?: string;
    minSavings?: number;
    region?: string;
    limit?: number;
  }) {
    return client.get<never, {
      total: number;
      recommendations: import('./types').CostRecommendation[];
      totalMonthlySavings: number;
    }>('/cost/recommendations', { params });
  },

  async getCostTrend() {
    return client.get<never, {
      trend: import('./types').CostTrendPoint[];
      byProvider: Record<string, number>;
      byRegion: Record<string, number>;
    }>('/cost/trend');
  },

  async getDrift(stateFile: string) {
    return client.get<never, import('./types').DriftReport>('/drift', { params: { stateFile } });
  },

  async getCompliance(framework: string) {
    return client.get<never, { framework: string; reports: import('./types').ComplianceReport[] }>(
      '/policy/compliance',
      { params: { framework } },
    );
  },

  async getPolicyViolations(params?: {
    framework?: string;
    severity?: string;
    resourceType?: string;
    limit?: number;
  }) {
    return client.get<never, {
      total: number;
      violations: import('./types').PolicyViolation[];
    }>('/policy/violations', { params });
  },
};
