import type { Resource, DriftReport, DriftedResource, DriftDetector } from '@helios-cloud/core';
import { parseTerraformState, buildStateIndex, extractResourceId } from './parsers/terraform-state.js';
import { diffAttributes } from './detectors/attribute-differ.js';
import type { DriftSeverity } from '@helios-cloud/core';

const RESOURCE_TYPE_MAP: Record<string, string[]> = {
  'aws_instance': ['ec2:instance'],
  'aws_ebs_volume': ['ec2:volume'],
  'aws_security_group': ['ec2:security-group'],
  'aws_db_instance': ['rds:db-instance'],
  'aws_rds_cluster': ['rds:db-cluster'],
  'aws_lambda_function': ['lambda:function'],
  'aws_s3_bucket': ['s3:bucket'],
};

function mapTerraformTypeToHelios(tfType: string): string | undefined {
  return Object.entries(RESOURCE_TYPE_MAP)
    .find(([k]) => k === tfType)?.[1]?.[0];
}

function resourceToFlatAttrs(resource: Resource): Record<string, unknown> {
  return {
    ...resource.metadata,
    status: resource.status,
    tags: resource.tags,
  };
}

export class HeliosDriftDetector implements DriftDetector {
  async detect(resources: Resource[], stateFile: string): Promise<DriftReport> {
    const startTime = Date.now();

    const state = await parseTerraformState(stateFile);
    const stateIndex = buildStateIndex(state);

    const driftedResources: DriftedResource[] = [];

    for (const tfResource of state.resources) {
      const heliosType = mapTerraformTypeToHelios(tfResource.type);
      if (!heliosType) continue;

      const resourceId = extractResourceId(tfResource);
      if (!resourceId) continue;

      const liveResource = resources.find(r => r.id === resourceId || r.arn === resourceId);

      if (!liveResource) {
        driftedResources.push({
          resourceId,
          resourceType: heliosType,
          region: (tfResource.instances[0]?.attributes['region'] as string | undefined) ?? 'unknown',
          driftType: 'resource-deleted',
          severity: 'critical',
          attributes: [],
          detectedAt: new Date(),
          remediationAvailable: true,
          remediationCommand: `terraform apply -target=${tfResource.address}`,
        });
        continue;
      }

      const expectedAttrs = tfResource.instances[0]?.attributes ?? {};
      const actualAttrs = resourceToFlatAttrs(liveResource);

      const driftedAttrs = diffAttributes(heliosType, expectedAttrs as Record<string, unknown>, actualAttrs);
      if (driftedAttrs.length > 0) {
        const maxSeverity = driftedAttrs.reduce<DriftSeverity>((max, attr) => {
          const order: DriftSeverity[] = ['low', 'medium', 'high', 'critical'];
          return order.indexOf(attr.severity) > order.indexOf(max) ? attr.severity : max;
        }, 'low');

        driftedResources.push({
          resourceId: liveResource.id,
          resourceType: liveResource.type,
          region: liveResource.region,
          driftType: 'config-changed',
          severity: maxSeverity,
          attributes: driftedAttrs,
          detectedAt: new Date(),
          remediationAvailable: true,
          remediationCommand: `terraform apply -target=${tfResource.address}`,
        });
      }
    }

    const unmanagedResources = resources.filter(r => {
      const found = state.resources.some(tfr => {
        const id = extractResourceId(tfr);
        return id === r.id || id === r.arn;
      });
      return !found && mapTerraformTypeToHelios(r.type.replace(':', '_').replace('-', '_'));
    });

    for (const unmanaged of unmanagedResources) {
      driftedResources.push({
        resourceId: unmanaged.id,
        resourceType: unmanaged.type,
        region: unmanaged.region,
        driftType: 'resource-added',
        severity: 'medium',
        attributes: [],
        detectedAt: new Date(),
        remediationAvailable: false,
      });
    }

    const bySeverity = driftedResources.reduce<Record<DriftSeverity, number>>(
      (acc, r) => ({ ...acc, [r.severity]: (acc[r.severity] ?? 0) + 1 }),
      { critical: 0, high: 0, medium: 0, low: 0 },
    );

    return {
      hasDrift: driftedResources.length > 0,
      totalDrifted: driftedResources.length,
      bySeverity,
      driftedResources,
      stateFile,
      checkedAt: new Date(),
      durationMs: Date.now() - startTime,
    };
  }
}
