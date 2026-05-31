import { z } from 'zod';

export const CloudProvider = z.enum(['aws', 'gcp', 'azure']);
export type CloudProvider = z.infer<typeof CloudProvider>;

export const ResourceStatus = z.enum([
  'active',
  'stopped',
  'terminated',
  'pending',
  'error',
  'unknown',
]);
export type ResourceStatus = z.infer<typeof ResourceStatus>;

export const ResourceSchema = z.object({
  id: z.string(),
  type: z.string(),
  provider: CloudProvider,
  region: z.string(),
  accountId: z.string(),
  name: z.string().optional(),
  status: ResourceStatus,
  tags: z.record(z.string()),
  metadata: z.record(z.unknown()),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  costPerMonth: z.number().optional(),
  arn: z.string().optional(),
});

export type Resource = z.infer<typeof ResourceSchema>;

export const DependencyEdgeSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  type: z.enum(['depends_on', 'contains', 'references', 'network', 'iam']),
});

export type DependencyEdge = z.infer<typeof DependencyEdgeSchema>;

export const ScanResultSchema = z.object({
  provider: CloudProvider,
  region: z.string(),
  accountId: z.string(),
  resources: z.array(ResourceSchema),
  edges: z.array(DependencyEdgeSchema),
  scannedAt: z.date(),
  durationMs: z.number(),
  errors: z.array(z.object({
    resourceType: z.string(),
    message: z.string(),
  })),
});

export type ScanResult = z.infer<typeof ScanResultSchema>;

export interface ResourceFilter {
  provider?: CloudProvider;
  region?: string;
  accountId?: string;
  type?: string | string[];
  tags?: Record<string, string>;
  status?: ResourceStatus;
  namePattern?: string;
}

export interface ResourceGroup {
  key: string;
  label: string;
  resources: Resource[];
  totalCost: number;
}
