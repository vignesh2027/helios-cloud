import { describe, it, expect } from 'vitest';
import { analyzeEC2Instances, type EC2Metrics } from '../analyzers/ec2.js';
import type { Resource } from '@helios-cloud/core';

function makeEC2Resource(id: string, instanceType: string, region = 'us-east-1'): Resource {
  return {
    id,
    type: 'ec2:instance',
    provider: 'aws',
    region,
    accountId: '123456789012',
    status: 'active',
    tags: {},
    metadata: { instanceType },
  };
}

function makeMetrics(resourceId: string, overrides: Partial<EC2Metrics> = {}): EC2Metrics {
  return {
    resourceId,
    avgCpuPercent: 5,
    maxCpuPercent: 15,
    avgNetworkInMbps: 1,
    avgNetworkOutMbps: 0.5,
    idleDays: 0,
    ...overrides,
  };
}

describe('analyzeEC2Instances', () => {
  describe('rightsizing', () => {
    it('recommends downsize for low CPU utilization', () => {
      const resources = [makeEC2Resource('i-001', 'm5.2xlarge')];
      const metrics = [makeMetrics('i-001', { avgCpuPercent: 8, maxCpuPercent: 20 })];

      const recs = analyzeEC2Instances(resources, metrics, 14, 0.7);
      expect(recs).toHaveLength(1);
      expect(recs[0]?.action).toBe('rightsize');
      expect(recs[0]?.recommendedConfig).toBe('m5.xlarge');
    });

    it('recommends savings plan for high CPU utilization', () => {
      const resources = [makeEC2Resource('i-001', 'm5.2xlarge')];
      const metrics = [makeMetrics('i-001', { avgCpuPercent: 90, maxCpuPercent: 98 })];

      const recs = analyzeEC2Instances(resources, metrics, 14, 0.7);
      expect(recs.some(r => r.action === 'savings-plan')).toBe(true);
    });

    it('does not recommend downsize if already smallest instance', () => {
      const resources = [makeEC2Resource('i-001', 'm5.large')];
      const metrics = [makeMetrics('i-001', { avgCpuPercent: 5, maxCpuPercent: 10 })];

      const recs = analyzeEC2Instances(resources, metrics, 14, 0.7);
      expect(recs.filter(r => r.action === 'rightsize')).toHaveLength(0);
    });
  });

  describe('idle detection', () => {
    it('recommends terminate for idle instances', () => {
      const resources = [makeEC2Resource('i-001', 'm5.xlarge')];
      const metrics = [makeMetrics('i-001', { avgCpuPercent: 0.5, maxCpuPercent: 1, idleDays: 30 })];

      const recs = analyzeEC2Instances(resources, metrics, 14, 0.7);
      const terminateRec = recs.find(r => r.action === 'terminate');
      expect(terminateRec).toBeDefined();
      expect(terminateRec?.monthlySavings).toBeGreaterThan(0);
    });

    it('does not recommend terminate below idle threshold', () => {
      const resources = [makeEC2Resource('i-001', 'm5.xlarge')];
      const metrics = [makeMetrics('i-001', { avgCpuPercent: 2, maxCpuPercent: 5, idleDays: 5 })];

      const recs = analyzeEC2Instances(resources, metrics, 14, 0.7);
      expect(recs.filter(r => r.action === 'terminate')).toHaveLength(0);
    });
  });

  describe('confidence threshold', () => {
    it('filters out recommendations below confidence threshold', () => {
      const resources = [makeEC2Resource('i-001', 'm5.2xlarge')];
      const metrics = [makeMetrics('i-001', { avgCpuPercent: 19, maxCpuPercent: 38 })];

      const lowConfRecs = analyzeEC2Instances(resources, metrics, 14, 0.99);
      const normalRecs = analyzeEC2Instances(resources, metrics, 14, 0.5);

      expect(lowConfRecs.filter(r => r.action === 'rightsize')).toHaveLength(0);
      expect(normalRecs.filter(r => r.action === 'rightsize')).toHaveLength(1);
    });
  });

  describe('monthly savings calculation', () => {
    it('computes positive savings for downsize recommendation', () => {
      const resources = [makeEC2Resource('i-001', 'm5.2xlarge')];
      const metrics = [makeMetrics('i-001', { avgCpuPercent: 5, maxCpuPercent: 12 })];

      const recs = analyzeEC2Instances(resources, metrics, 14, 0.7);
      const rightsize = recs.find(r => r.action === 'rightsize');
      expect(rightsize?.monthlySavings).toBeGreaterThan(0);
      expect(rightsize?.annualSavings).toBe(rightsize!.monthlySavings * 12);
      expect(rightsize?.currentMonthlyCost).toBeGreaterThan(rightsize!.projectedMonthlyCost);
    });
  });

  describe('skips non-active instances', () => {
    it('does not analyze stopped instances', () => {
      const resource = makeEC2Resource('i-001', 'm5.2xlarge');
      resource.status = 'stopped';
      const metrics = [makeMetrics('i-001', { avgCpuPercent: 5, maxCpuPercent: 10 })];

      const recs = analyzeEC2Instances([resource], metrics, 14, 0.7);
      expect(recs).toHaveLength(0);
    });
  });
});
