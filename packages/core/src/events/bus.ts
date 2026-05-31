import EventEmitter from 'eventemitter3';
import type { Resource } from '../types/resource.js';
import type { DriftedResource } from '../types/drift.js';
import type { PolicyViolation } from '../types/policy.js';
import type { CostRecommendation } from '../types/cost.js';

export interface HeliosEvents {
  'scan:started': { provider: string; region: string };
  'scan:completed': { totalResources: number; durationMs: number };
  'scan:error': { error: Error; provider: string; region: string };
  'resource:discovered': { resource: Resource };
  'resource:updated': { resource: Resource; previous: Resource };
  'resource:deleted': { resourceId: string; type: string };
  'drift:detected': { driftedResource: DriftedResource };
  'drift:remediated': { resourceId: string; success: boolean };
  'policy:violation': { violation: PolicyViolation };
  'policy:resolved': { violationId: string };
  'cost:recommendation': { recommendation: CostRecommendation };
  'cost:anomaly': { resourceId: string; expectedCost: number; actualCost: number };
  'apply:started': { changeSetId: string; changes: number };
  'apply:completed': { changeSetId: string; success: boolean };
  'apply:failed': { changeSetId: string; error: Error; rollback: boolean };
}

class TypedEventBus extends EventEmitter<HeliosEvents> {
  emit<K extends keyof HeliosEvents>(
    event: K,
    payload: HeliosEvents[K],
  ): boolean {
    return super.emit(event, payload);
  }

  on<K extends keyof HeliosEvents>(
    event: K,
    listener: (payload: HeliosEvents[K]) => void,
  ): this {
    return super.on(event, listener);
  }

  once<K extends keyof HeliosEvents>(
    event: K,
    listener: (payload: HeliosEvents[K]) => void,
  ): this {
    return super.once(event, listener);
  }
}

export const eventBus = new TypedEventBus();
export type { TypedEventBus };
