import { z } from 'zod';

const AwsAccountSchema = z.object({
  id: z.string().regex(/^\d{12}$/, 'AWS account ID must be 12 digits'),
  role: z.string().optional(),
  externalId: z.string().optional(),
});

const AwsProviderSchema = z.object({
  regions: z.array(z.string()).min(1),
  accounts: z.array(AwsAccountSchema).min(1),
  maxConcurrentRequests: z.number().int().min(1).max(50).default(10),
  requestTimeoutMs: z.number().int().default(30_000),
});

const ScanConfigSchema = z.object({
  interval: z.string().default('5m'),
  resourceTypes: z.array(z.string()).optional(),
  excludeResourceTypes: z.array(z.string()).optional(),
  excludeTags: z.record(z.string()).optional(),
});

const OptimizerConfigSchema = z.object({
  enabled: z.boolean().default(true),
  idleThresholdDays: z.number().int().min(1).default(14),
  rightsizingConfidenceThreshold: z.number().min(0).max(1).default(0.85),
  excludeResourceIds: z.array(z.string()).default([]),
});

const DriftConfigSchema = z.object({
  enabled: z.boolean().default(true),
  stateBackend: z.object({
    type: z.enum(['local', 's3', 'gcs', 'azureblob']).default('local'),
    bucket: z.string().optional(),
    prefix: z.string().optional(),
    path: z.string().optional(),
  }),
  autoRemediate: z.boolean().default(false),
  severity: z.array(z.string()).default(['critical', 'high']),
});

const PolicyConfigSchema = z.object({
  frameworks: z.array(z.string()).default(['cis-aws-1.5']),
  enforceOnScan: z.boolean().default(false),
  alerting: z.object({
    slack: z.object({
      webhook: z.string().url().optional(),
      channel: z.string().optional(),
    }).optional(),
    pagerduty: z.object({
      routingKey: z.string().optional(),
    }).optional(),
  }).optional(),
});

const ApiConfigSchema = z.object({
  port: z.number().int().min(1).max(65535).default(8080),
  host: z.string().default('0.0.0.0'),
  auth: z.object({
    type: z.enum(['jwt', 'api-key', 'none']).default('jwt'),
    issuer: z.string().url().optional(),
    audience: z.string().optional(),
  }).default({ type: 'none' }),
  cors: z.object({
    origins: z.array(z.string()).default(['*']),
  }).default({ origins: ['*'] }),
  rateLimit: z.object({
    windowMs: z.number().default(60_000),
    max: z.number().default(1000),
  }).default({}),
});

export const HeliosConfigSchema = z.object({
  version: z.literal('1').default('1'),
  providers: z.object({
    aws: AwsProviderSchema.optional(),
    gcp: z.object({ projects: z.array(z.string()) }).optional(),
    azure: z.object({ subscriptions: z.array(z.string()) }).optional(),
  }),
  scan: ScanConfigSchema.default({}),
  optimizer: OptimizerConfigSchema.default({}),
  drift: DriftConfigSchema.default({
    stateBackend: { type: 'local' },
    enabled: true,
    autoRemediate: false,
    severity: ['critical', 'high'],
  }),
  policy: PolicyConfigSchema.default({}),
  api: ApiConfigSchema.default({}),
  stateDir: z.string().default('.helios/state'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type HeliosConfig = z.infer<typeof HeliosConfigSchema>;
