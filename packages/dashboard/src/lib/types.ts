export interface Resource {
  id: string;
  type: string;
  provider: 'aws' | 'gcp' | 'azure';
  region: string;
  accountId: string;
  name?: string;
  status: 'active' | 'stopped' | 'terminated' | 'pending' | 'error' | 'unknown';
  tags: Record<string, string>;
  metadata: Record<string, unknown>;
  costPerMonth?: number;
  arn?: string;
  createdAt?: string;
}

export interface CostRecommendation {
  resourceId: string;
  resourceType: string;
  region: string;
  action: string;
  currentConfig: string;
  recommendedConfig: string;
  currentMonthlyCost: number;
  projectedMonthlyCost: number;
  monthlySavings: number;
  annualSavings: number;
  confidenceScore: number;
  rationale: string;
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  implementationSteps: string[];
}

export interface CostTrendPoint {
  date: string;
  amount: number;
  provider: string;
}

export interface CostSummary {
  totalMonthlyCost: number;
  totalAnnualCost: number;
  potentialMonthlySavings: number;
  potentialAnnualSavings: number;
  savingsPercentage: number;
  recommendations: CostRecommendation[];
  byProvider: Record<string, number>;
  byRegion: Record<string, number>;
  byResourceType: Record<string, number>;
  trend: CostTrendPoint[];
}

export interface DriftedResource {
  resourceId: string;
  resourceType: string;
  region: string;
  driftType: 'config-changed' | 'resource-deleted' | 'resource-added' | 'tag-drift';
  severity: 'critical' | 'high' | 'medium' | 'low';
  attributes: Array<{ path: string; expectedValue: unknown; actualValue: unknown; severity: string }>;
  detectedAt: string;
  remediationAvailable: boolean;
  remediationCommand?: string;
}

export interface DriftReport {
  hasDrift: boolean;
  totalDrifted: number;
  bySeverity: Record<string, number>;
  driftedResources: DriftedResource[];
  stateFile: string;
  checkedAt: string;
  durationMs: number;
}

export interface PolicyViolation {
  ruleId: string;
  ruleName: string;
  resourceId: string;
  resourceType: string;
  region: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  message: string;
  evidence: Record<string, unknown>;
  detectedAt: string;
  remediationGuidance: string;
  autoRemediatable: boolean;
}

export interface ComplianceReport {
  framework: string;
  score: number;
  grade: string;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  violations: PolicyViolation[];
  evaluatedAt: string;
}
