import type { HeliosConfig } from '@helios-cloud/core';
import { HeliosConfigSchema, Orchestrator } from '@helios-cloud/core';
import { AwsProvider } from '@helios-cloud/provider-aws';
import { HeliosCostAnalyzer } from '@helios-cloud/optimizer';
import { HeliosDriftDetector } from '@helios-cloud/drift';
import type { ResourceGraph } from '@helios-cloud/core';
import type { CostSummary, CostRecommendation } from '@helios-cloud/core';
import type { DriftReport } from '@helios-cloud/core';
import type { ComplianceReport, PolicyEvaluationOptions } from '@helios-cloud/core';

export interface HeliosClientOptions {
  provider: 'aws' | 'gcp' | 'azure';
  region: string;
  regions?: string[];
  accountId?: string;
  credentials?: {
    profile?: string;
    roleArn?: string;
    externalId?: string;
  };
  config?: Partial<HeliosConfig>;
}

export class HeliosClient {
  private readonly orchestrator: Orchestrator;

  readonly resources: ResourcesAPI;
  readonly optimizer: OptimizerAPI;
  readonly drift: DriftAPI;
  readonly policy: PolicyAPI;

  constructor(private readonly opts: HeliosClientOptions) {
    const regions = opts.regions ?? [opts.region];
    const accountId = opts.accountId ?? process.env['AWS_ACCOUNT_ID'] ?? '000000000000';

    const config = HeliosConfigSchema.parse({
      version: '1' as const,
      providers: {
        aws: {
          regions,
          accounts: [{ id: accountId }],
          maxConcurrentRequests: 10,
        },
      },
      ...opts.config,
    });

    const providers = [];
    if (opts.provider === 'aws') {
      providers.push(new AwsProvider({
        profile: opts.credentials?.profile,
        roleArn: opts.credentials?.roleArn,
        externalId: opts.credentials?.externalId,
      }));
    }

    this.orchestrator = new Orchestrator({
      config,
      providers,
      costAnalyzer: new HeliosCostAnalyzer(),
      driftDetector: new HeliosDriftDetector(),
    });

    this.resources = new ResourcesAPI(this.orchestrator);
    this.optimizer = new OptimizerAPI(this.orchestrator);
    this.drift = new DriftAPI(this.orchestrator);
    this.policy = new PolicyAPI(this.orchestrator);
  }

  async scan(): Promise<ScanResult> {
    const graph = await this.orchestrator.scan();
    return {
      total: graph.size(),
      edgeCount: graph.edgeCount(),
      resources: graph.getAll(),
      graph,
    };
  }
}

export interface ScanResult {
  total: number;
  edgeCount: number;
  resources: ReturnType<ResourceGraph['getAll']>;
  graph: ResourceGraph;
}

export class ResourcesAPI {
  constructor(private readonly orchestrator: Orchestrator) {}

  getAll() {
    return this.orchestrator.getGraph().getAll();
  }

  getById(id: string) {
    return this.orchestrator.getGraph().getResource(id);
  }

  getDependencies(id: string) {
    return this.orchestrator.getGraph().getDependencies(id);
  }

  getDependents(id: string) {
    return this.orchestrator.getGraph().getDependents(id);
  }

  filter(opts: Parameters<ResourceGraph['filter']>[0]) {
    return this.orchestrator.getGraph().filter(opts);
  }

  getOrphaned() {
    return this.orchestrator.getGraph().getOrphanedResources();
  }
}

export class OptimizerAPI {
  constructor(private readonly orchestrator: Orchestrator) {}

  async analyze(): Promise<CostSummary> {
    const result = await this.orchestrator.analyzeCosts();
    if (!result) throw new Error('Cost analyzer not configured');
    return result;
  }

  async getRecommendations(): Promise<CostRecommendation[]> {
    const summary = await this.analyze();
    return summary.recommendations;
  }

  async getTopSavings(n = 10): Promise<CostRecommendation[]> {
    const recs = await this.getRecommendations();
    return recs.slice(0, n);
  }
}

export class DriftAPI {
  constructor(private readonly orchestrator: Orchestrator) {}

  async detect(stateFile: string): Promise<DriftReport> {
    const result = await this.orchestrator.detectDrift(stateFile);
    if (!result) throw new Error('Drift detector not configured');
    return result;
  }
}

export class PolicyAPI {
  constructor(private readonly orchestrator: Orchestrator) {}

  async evaluate(options: PolicyEvaluationOptions): Promise<ComplianceReport[]> {
    return this.orchestrator.evaluatePolicy(options);
  }

  async getScore(framework: string): Promise<number> {
    const reports = await this.evaluate({ framework: framework as PolicyEvaluationOptions['framework'] });
    if (reports.length === 0) return 100;
    return reports.reduce((s, r) => s + r.score, 0) / reports.length;
  }
}
