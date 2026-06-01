import pino from 'pino';
import type { HeliosConfig } from '../config/schema.js';
import type { ScanResult, Resource } from '../types/resource.js';
import type { CostSummary } from '../types/cost.js';
import type { DriftReport } from '../types/drift.js';
import type { ComplianceReport, PolicyEvaluationOptions } from '../types/policy.js';
import { ResourceGraph } from '../graph/resource-graph.js';
import { StateManager } from '../state/state-manager.js';
import { eventBus } from '../events/bus.js';

export interface ProviderAdapter {
  readonly name: string;
  scan(options: { regions: string[]; accountId: string }): Promise<ScanResult>;
  getResourceCost(resourceId: string): Promise<number | undefined>;
}

export interface CostAnalyzer {
  analyze(resources: Resource[], config: HeliosConfig): Promise<CostSummary>;
}

export interface DriftDetector {
  detect(resources: Resource[], stateFile: string): Promise<DriftReport>;
}

export interface PolicyEvaluator {
  evaluate(resources: Resource[], options: PolicyEvaluationOptions): Promise<ComplianceReport[]>;
}

export interface OrchestratorOptions {
  config: HeliosConfig;
  providers: ProviderAdapter[];
  costAnalyzer?: CostAnalyzer;
  driftDetector?: DriftDetector;
  policyEvaluator?: PolicyEvaluator;
}

export class Orchestrator {
  private readonly log: pino.Logger;
  private readonly graph: ResourceGraph = new ResourceGraph();
  private readonly stateManagers: Map<string, StateManager> = new Map();

  constructor(private readonly opts: OrchestratorOptions) {
    const pinoOpts: pino.LoggerOptions = { level: opts.config.logLevel };
    if (process.env['NODE_ENV'] !== 'production') {
      pinoOpts['transport'] = { target: 'pino-pretty', options: { colorize: true } };
    }
    this.log = pino(pinoOpts);
  }

  async scan(): Promise<ResourceGraph> {
    const { config, providers } = this.opts;
    const startTime = Date.now();

    this.log.info({ providers: providers.map(p => p.name) }, 'Starting infrastructure scan');

    const results = await Promise.allSettled(
      providers.flatMap(provider => {
        const providerConfig = config.providers[provider.name as keyof typeof config.providers];
        if (!providerConfig) return [];

        if (provider.name === 'aws' && config.providers.aws) {
          return config.providers.aws.accounts.map(account =>
            provider.scan({
              regions: config.providers.aws!.regions,
              accountId: account.id,
            }),
          );
        }
        return [];
      }),
    );

    let totalResources = 0;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const scanResult = result.value;
        for (const resource of scanResult.resources) {
          this.graph.addResource(resource);
        }
        for (const edge of scanResult.edges) {
          this.graph.addEdge(edge);
        }
        totalResources += scanResult.resources.length;
        eventBus.emit('scan:completed', {
          totalResources: scanResult.resources.length,
          durationMs: scanResult.durationMs,
        });
      } else {
        this.log.error({ err: result.reason }, 'Scan failed for provider/region');
      }
    }

    const durationMs = Date.now() - startTime;
    this.log.info(
      { totalResources, durationMs, edgeCount: this.graph.edgeCount() },
      'Scan completed',
    );

    return this.graph;
  }

  async analyzeCosts(): Promise<CostSummary | null> {
    if (!this.opts.costAnalyzer) {
      this.log.warn('No cost analyzer configured');
      return null;
    }
    const resources = this.graph.getAll();
    return this.opts.costAnalyzer.analyze(resources, this.opts.config);
  }

  async detectDrift(stateFile: string): Promise<DriftReport | null> {
    if (!this.opts.driftDetector) {
      this.log.warn('No drift detector configured');
      return null;
    }
    const resources = this.graph.getAll();
    const report = await this.opts.driftDetector.detect(resources, stateFile);

    for (const dr of report.driftedResources) {
      eventBus.emit('drift:detected', { driftedResource: dr });
    }

    return report;
  }

  async evaluatePolicy(options: PolicyEvaluationOptions): Promise<ComplianceReport[]> {
    if (!this.opts.policyEvaluator) {
      this.log.warn('No policy evaluator configured');
      return [];
    }
    const resources = this.graph.getAll();
    const reports = await this.opts.policyEvaluator.evaluate(resources, options);

    for (const report of reports) {
      for (const violation of report.violations) {
        eventBus.emit('policy:violation', { violation });
      }
    }

    return reports;
  }

  getGraph(): ResourceGraph {
    return this.graph;
  }

  getConfig(): HeliosConfig {
    return this.opts.config;
  }
}
