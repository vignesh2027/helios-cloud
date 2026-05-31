import EventEmitter from 'eventemitter3';
import type { Resource } from '../types/resource.js';
import type { DriftedResource } from '../types/drift.js';
import type { PolicyViolation } from '../types/policy.js';
import type { CostRecommendation } from '../types/cost.js';

export interface HeliosEvents {
  'scan:started': [payload: { provider: string; region: string }];
  'scan:completed': [payload: { totalResources: number; durationMs: number }];
  'scan:error': [payload: { error: Error; provider: string; region: string }];
  'resource:discovered': [payload: { resource: Resource }];
  'resource:updated': [payload: { resource: Resource; previous: Resource }];
  'resource:deleted': [payload: { resourceId: string; type: string }];
  'drift:detected': [payload: { driftedResource: DriftedResource }];
  'drift:remediated': [payload: { resourceId: string; success: boolean }];
  'policy:violation': [payload: { violation: PolicyViolation }];
  'policy:resolved': [payload: { violationId: string }];
  'cost:recommendation': [payload: { recommendation: CostRecommendation }];
  'cost:anomaly': [payload: { resourceId: string; expectedCost: number; actualCost: number }];
  'apply:started': [payload: { changeSetId: string; changes: number }];
  'apply:completed': [payload: { changeSetId: string; success: boolean }];
  'apply:failed': [payload: { changeSetId: string; error: Error; rollback: boolean }];
}

export const eventBus = new EventEmitter<HeliosEvents>();
