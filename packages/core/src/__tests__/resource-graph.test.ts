import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceGraph } from '../graph/resource-graph.js';
import type { Resource } from '../types/resource.js';

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 'r-default',
    type: 'ec2:instance',
    provider: 'aws',
    region: 'us-east-1',
    accountId: '123456789012',
    status: 'active',
    tags: {},
    metadata: {},
    ...overrides,
  };
}

describe('ResourceGraph', () => {
  let graph: ResourceGraph;

  beforeEach(() => {
    graph = new ResourceGraph();
  });

  describe('addResource', () => {
    it('adds a resource and increments size', () => {
      graph.addResource(makeResource({ id: 'r-1' }));
      expect(graph.size()).toBe(1);
    });

    it('updates existing resource on duplicate add', () => {
      const r1 = makeResource({ id: 'r-1', status: 'active' });
      const r2 = makeResource({ id: 'r-1', status: 'stopped' });
      graph.addResource(r1);
      graph.addResource(r2);
      expect(graph.size()).toBe(1);
      expect(graph.getResource('r-1')?.status).toBe('stopped');
    });
  });

  describe('addEdge', () => {
    it('adds dependency edges between resources', () => {
      graph.addResource(makeResource({ id: 'instance-1' }));
      graph.addResource(makeResource({ id: 'vpc-1', type: 'ec2:vpc' }));
      graph.addEdge({ sourceId: 'instance-1', targetId: 'vpc-1', type: 'contains' });
      expect(graph.edgeCount()).toBe(1);
      expect(graph.getDependencies('instance-1')).toHaveLength(1);
    });

    it('ignores edges for non-existent resources', () => {
      graph.addResource(makeResource({ id: 'r-1' }));
      graph.addEdge({ sourceId: 'r-1', targetId: 'nonexistent', type: 'contains' });
      expect(graph.edgeCount()).toBe(0);
    });
  });

  describe('getDependencies and getDependents', () => {
    beforeEach(() => {
      graph.addResource(makeResource({ id: 'instance-1' }));
      graph.addResource(makeResource({ id: 'vpc-1', type: 'ec2:vpc' }));
      graph.addResource(makeResource({ id: 'sg-1', type: 'ec2:security-group' }));
      graph.addEdge({ sourceId: 'instance-1', targetId: 'vpc-1', type: 'contains' });
      graph.addEdge({ sourceId: 'instance-1', targetId: 'sg-1', type: 'network' });
    });

    it('returns all dependencies of a resource', () => {
      const deps = graph.getDependencies('instance-1');
      expect(deps).toHaveLength(2);
      expect(deps.map(d => d.id)).toContain('vpc-1');
      expect(deps.map(d => d.id)).toContain('sg-1');
    });

    it('returns all dependents of a resource', () => {
      const dependents = graph.getDependents('vpc-1');
      expect(dependents).toHaveLength(1);
      expect(dependents[0]?.id).toBe('instance-1');
    });
  });

  describe('filter', () => {
    beforeEach(() => {
      graph.addResource(makeResource({ id: 'r-1', provider: 'aws', region: 'us-east-1', type: 'ec2:instance' }));
      graph.addResource(makeResource({ id: 'r-2', provider: 'aws', region: 'eu-west-1', type: 's3:bucket' }));
      graph.addResource(makeResource({ id: 'r-3', provider: 'gcp', region: 'us-central1', type: 'compute:instance' }));
    });

    it('filters by provider', () => {
      expect(graph.filter({ provider: 'aws' })).toHaveLength(2);
      expect(graph.filter({ provider: 'gcp' })).toHaveLength(1);
    });

    it('filters by region', () => {
      expect(graph.filter({ region: 'us-east-1' })).toHaveLength(1);
      expect(graph.filter({ region: 'eu-west-1' })).toHaveLength(1);
    });

    it('filters by type', () => {
      expect(graph.filter({ type: 'ec2:instance' })).toHaveLength(1);
      expect(graph.filter({ type: ['ec2:instance', 's3:bucket'] })).toHaveLength(2);
    });
  });

  describe('topologicalSort', () => {
    it('returns resources in dependency order', () => {
      const vpc = makeResource({ id: 'vpc-1', type: 'ec2:vpc' });
      const subnet = makeResource({ id: 'subnet-1', type: 'ec2:subnet' });
      const instance = makeResource({ id: 'i-1', type: 'ec2:instance' });

      graph.addResource(vpc);
      graph.addResource(subnet);
      graph.addResource(instance);
      graph.addEdge({ sourceId: 'subnet-1', targetId: 'vpc-1', type: 'contains' });
      graph.addEdge({ sourceId: 'i-1', targetId: 'subnet-1', type: 'contains' });

      const sorted = graph.topologicalSort();
      const vpcIdx = sorted.findIndex(r => r.id === 'vpc-1');
      const subnetIdx = sorted.findIndex(r => r.id === 'subnet-1');
      const instanceIdx = sorted.findIndex(r => r.id === 'i-1');

      expect(vpcIdx).toBeLessThan(subnetIdx);
      expect(subnetIdx).toBeLessThan(instanceIdx);
    });
  });

  describe('getOrphanedResources', () => {
    it('identifies resources with no edges', () => {
      graph.addResource(makeResource({ id: 'r-1' }));
      graph.addResource(makeResource({ id: 'r-2' }));
      graph.addResource(makeResource({ id: 'r-3' }));
      graph.addEdge({ sourceId: 'r-1', targetId: 'r-2', type: 'contains' });

      const orphans = graph.getOrphanedResources();
      expect(orphans.map(r => r.id)).toContain('r-3');
      expect(orphans.map(r => r.id)).not.toContain('r-1');
      expect(orphans.map(r => r.id)).not.toContain('r-2');
    });
  });

  describe('merge', () => {
    it('merges two graphs without duplicates', () => {
      const g2 = new ResourceGraph();
      graph.addResource(makeResource({ id: 'r-1' }));
      g2.addResource(makeResource({ id: 'r-2' }));
      g2.addResource(makeResource({ id: 'r-3' }));

      graph.merge(g2);
      expect(graph.size()).toBe(3);
    });
  });
});
