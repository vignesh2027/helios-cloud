import { describe, it, expect } from 'vitest';
import { diffAttributes } from '../detectors/attribute-differ.js';

describe('diffAttributes', () => {
  it('returns empty array when attributes are identical', () => {
    const attrs = { instance_type: 'm5.large', multi_az: false, storage_encrypted: true };
    const result = diffAttributes('ec2:instance', attrs, attrs);
    expect(result).toHaveLength(0);
  });

  it('detects changed attributes', () => {
    const expected = { instance_type: 'm5.large' };
    const actual = { instance_type: 'm5.2xlarge' };
    const result = diffAttributes('ec2:instance', expected, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.path).toBe('instance_type');
    expect(result[0]?.expectedValue).toBe('m5.large');
    expect(result[0]?.actualValue).toBe('m5.2xlarge');
  });

  it('classifies instance_type as critical severity for ec2:instance', () => {
    const result = diffAttributes(
      'ec2:instance',
      { instance_type: 'm5.large' },
      { instance_type: 'm5.xlarge' },
    );
    expect(result[0]?.severity).toBe('critical');
  });

  it('classifies multi_az as critical severity for rds:db-instance', () => {
    const result = diffAttributes(
      'rds:db-instance',
      { multi_az: true },
      { multi_az: false },
    );
    expect(result[0]?.severity).toBe('critical');
  });

  it('ignores last_modified and updated_at fields', () => {
    const result = diffAttributes(
      'ec2:instance',
      { last_modified: '2024-01-01', instance_type: 'm5.large' },
      { last_modified: '2024-06-01', instance_type: 'm5.large' },
    );
    expect(result).toHaveLength(0);
  });

  it('detects nested object changes', () => {
    const expected = { tags: { env: 'prod', team: 'platform' } };
    const actual = { tags: { env: 'staging', team: 'platform' } };
    const result = diffAttributes('ec2:instance', expected, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.path).toBe('tags');
  });

  it('detects removed attributes', () => {
    const expected = { instance_type: 'm5.large', iam_instance_profile: 'MyRole' };
    const actual = { instance_type: 'm5.large' };
    const result = diffAttributes('ec2:instance', expected, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.path).toBe('iam_instance_profile');
  });

  it('detects added attributes', () => {
    const expected = { instance_type: 'm5.large' };
    const actual = { instance_type: 'm5.large', new_field: 'value' };
    const result = diffAttributes('ec2:instance', expected, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.path).toBe('new_field');
  });

  it('assigns high severity to security-related attributes', () => {
    const result = diffAttributes(
      'ec2:instance',
      { security_group_ids: ['sg-old'] },
      { security_group_ids: ['sg-new'] },
    );
    expect(['high', 'critical']).toContain(result[0]?.severity);
  });

  it('assigns low severity to tag changes', () => {
    const result = diffAttributes(
      's3:bucket',
      { tag_key: 'old-value' },
      { tag_key: 'new-value' },
    );
    expect(result[0]?.severity).toBe('low');
  });
});
