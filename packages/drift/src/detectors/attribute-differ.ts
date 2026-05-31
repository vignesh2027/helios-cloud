import type { DriftedAttribute, DriftSeverity } from '@helios-cloud/core';

const CRITICAL_ATTRIBUTES: Record<string, string[]> = {
  'ec2:instance': ['instance_type', 'iam_instance_profile', 'user_data'],
  'ec2:security-group': ['ingress', 'egress', 'vpc_id'],
  'rds:db-instance': ['instance_class', 'multi_az', 'storage_encrypted', 'deletion_protection', 'publicly_accessible'],
  'lambda:function': ['runtime', 'handler', 'role', 'memory_size'],
  's3:bucket': ['bucket_policy', 'acl', 'versioning', 'server_side_encryption_configuration'],
};

const HIGH_ATTRIBUTES: Record<string, string[]> = {
  'ec2:instance': ['ebs_optimized', 'monitoring', 'subnet_id'],
  'rds:db-instance': ['backup_retention_period', 'engine_version'],
  'lambda:function': ['timeout', 'environment'],
  's3:bucket': ['lifecycle_rule', 'cors_rule'],
};

export function diffAttributes(
  resourceType: string,
  expected: Record<string, unknown>,
  actual: Record<string, unknown>,
): DriftedAttribute[] {
  const drifted: DriftedAttribute[] = [];
  const allKeys = new Set([...Object.keys(expected), ...Object.keys(actual)]);

  for (const key of allKeys) {
    const expectedVal = expected[key];
    const actualVal = actual[key];

    if (isIgnoredAttribute(key)) continue;
    if (deepEqual(expectedVal, actualVal)) continue;

    drifted.push({
      path: key,
      expectedValue: expectedVal,
      actualValue: actualVal,
      severity: classifyAttributeSeverity(resourceType, key),
    });
  }

  return drifted;
}

function classifyAttributeSeverity(resourceType: string, attribute: string): DriftSeverity {
  if (CRITICAL_ATTRIBUTES[resourceType]?.includes(attribute)) return 'critical';
  if (HIGH_ATTRIBUTES[resourceType]?.includes(attribute)) return 'high';
  if (attribute.includes('security') || attribute.includes('encrypt') || attribute.includes('policy')) {
    return 'high';
  }
  if (attribute.includes('tag')) return 'low';
  return 'medium';
}

function isIgnoredAttribute(key: string): boolean {
  const ignored = [
    'last_modified',
    'last_updated',
    'updated_at',
    'created_at',
    'creation_date',
    'etag',
    'version_id',
    'latest_version_id',
  ];
  return ignored.some(i => key.toLowerCase().includes(i));
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(k => deepEqual(aObj[k], bObj[k]));
}
