export type DriftSeverity = 'critical' | 'high' | 'medium' | 'low';
export type DriftType = 'config-changed' | 'resource-deleted' | 'resource-added' | 'tag-drift';

export interface DriftedAttribute {
  path: string;
  expectedValue: unknown;
  actualValue: unknown;
  severity: DriftSeverity;
}

export interface DriftedResource {
  resourceId: string;
  resourceType: string;
  region: string;
  driftType: DriftType;
  severity: DriftSeverity;
  attributes: DriftedAttribute[];
  detectedAt: Date;
  lastKnownGoodAt?: Date;
  remediationAvailable: boolean;
  remediationCommand?: string;
}

export interface DriftReport {
  hasDrift: boolean;
  totalDrifted: number;
  bySeverity: Record<DriftSeverity, number>;
  driftedResources: DriftedResource[];
  stateFile: string;
  checkedAt: Date;
  durationMs: number;
}

export interface RemediationPlan {
  resourceId: string;
  steps: RemediationStep[];
  estimatedDurationSeconds: number;
  requiresDowntime: boolean;
  approved: boolean;
}

export interface RemediationStep {
  order: number;
  description: string;
  command?: string;
  rollbackCommand?: string;
  automated: boolean;
}
