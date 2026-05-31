import pLimit from 'p-limit';
import pRetry from 'p-retry';
import type { ProviderAdapter, ScanResult, Resource, DependencyEdge } from '@helios-cloud/core';
import { ProviderError, RateLimitError } from '@helios-cloud/core';
import { buildClientConfig } from './client.js';
import { EC2Scanner } from './ec2/scanner.js';
import { LambdaScanner } from './lambda/scanner.js';
import { S3Scanner } from './s3/scanner.js';
import { RDSScanner } from './rds/scanner.js';

export interface AwsProviderOptions {
  roleArn?: string;
  externalId?: string;
  profile?: string;
  maxConcurrentRequests?: number;
  maxRetries?: number;
  enabledServices?: string[];
}

const DEFAULT_SERVICES = [
  'ec2:instance',
  'ec2:volume',
  'ec2:security-group',
  'lambda:function',
  's3:bucket',
  'rds:db-instance',
  'rds:db-cluster',
];

export class AwsProvider implements ProviderAdapter {
  readonly name = 'aws';

  constructor(private readonly opts: AwsProviderOptions = {}) {}

  async scan(options: { regions: string[]; accountId: string }): Promise<ScanResult> {
    const startTime = Date.now();
    const allResources: Resource[] = [];
    const allEdges: DependencyEdge[] = [];
    const errors: ScanResult['errors'] = [];

    const limit = pLimit(this.opts.maxConcurrentRequests ?? 10);
    const services = this.opts.enabledServices ?? DEFAULT_SERVICES;

    const regionTasks = options.regions.map(region =>
      limit(() => this.scanRegion(region, options.accountId, services)),
    );

    const results = await Promise.allSettled(regionTasks);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allResources.push(...result.value.resources);
        allEdges.push(...result.value.edges);
      } else {
        const err = result.reason as Error;
        errors.push({ resourceType: 'region', message: err.message });
      }
    }

    return {
      provider: 'aws',
      region: options.regions.join(','),
      accountId: options.accountId,
      resources: allResources,
      edges: allEdges,
      scannedAt: new Date(),
      durationMs: Date.now() - startTime,
      errors,
    };
  }

  private async scanRegion(
    region: string,
    accountId: string,
    services: string[],
  ): Promise<{ resources: Resource[]; edges: DependencyEdge[] }> {
    const config = buildClientConfig({
      region,
      accountId,
      roleArn: this.opts.roleArn,
      externalId: this.opts.externalId,
      profile: this.opts.profile,
      maxRetries: this.opts.maxRetries ?? 3,
    });

    const resources: Resource[] = [];
    const edges: DependencyEdge[] = [];

    const tasks: Array<() => Promise<void>> = [];

    if (services.some(s => s.startsWith('ec2:'))) {
      const ec2 = new EC2Scanner(config, accountId);
      if (services.includes('ec2:instance')) {
        tasks.push(async () => {
          const r = await this.withRetry(() => ec2.scanInstances(), 'ec2:instance');
          resources.push(...r.resources);
          edges.push(...r.edges);
        });
      }
      if (services.includes('ec2:volume')) {
        tasks.push(async () => {
          const r = await this.withRetry(() => ec2.scanVolumes(), 'ec2:volume');
          resources.push(...r.resources);
        });
      }
      if (services.includes('ec2:security-group')) {
        tasks.push(async () => {
          const r = await this.withRetry(() => ec2.scanSecurityGroups(), 'ec2:security-group');
          resources.push(...r.resources);
        });
      }
    }

    if (services.includes('lambda:function')) {
      const lambda = new LambdaScanner(config, accountId);
      tasks.push(async () => {
        const r = await this.withRetry(() => lambda.scanFunctions(), 'lambda:function');
        resources.push(...r.resources);
        edges.push(...r.edges);
      });
    }

    if (services.includes('s3:bucket') && region === 'us-east-1') {
      const s3 = new S3Scanner(config, accountId);
      tasks.push(async () => {
        const r = await this.withRetry(() => s3.scanBuckets(), 's3:bucket');
        resources.push(...r.resources);
      });
    }

    if (services.some(s => s.startsWith('rds:'))) {
      const rds = new RDSScanner(config, accountId);
      if (services.includes('rds:db-instance')) {
        tasks.push(async () => {
          const r = await this.withRetry(() => rds.scanInstances(), 'rds:db-instance');
          resources.push(...r.resources);
          edges.push(...r.edges);
        });
      }
      if (services.includes('rds:db-cluster')) {
        tasks.push(async () => {
          const r = await this.withRetry(() => rds.scanClusters(), 'rds:db-cluster');
          resources.push(...r.resources);
        });
      }
    }

    await Promise.allSettled(tasks.map(t => t()));

    return { resources, edges };
  }

  private async withRetry<T>(fn: () => Promise<T>, resourceType: string): Promise<T> {
    return pRetry(fn, {
      retries: this.opts.maxRetries ?? 3,
      onFailedAttempt: err => {
        if (err.message.includes('ThrottlingException') || err.message.includes('RequestLimitExceeded')) {
          throw new RateLimitError('aws');
        }
        if (err.attemptNumber >= (this.opts.maxRetries ?? 3)) {
          throw new ProviderError('aws', `Failed to scan ${resourceType}: ${err.message}`);
        }
      },
      minTimeout: 1000,
      maxTimeout: 10_000,
      factor: 2,
    });
  }

  async getResourceCost(_resourceId: string): Promise<number | undefined> {
    return undefined;
  }
}
