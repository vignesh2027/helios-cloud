import type { FastifyInstance } from 'fastify';
import type { Orchestrator } from '@helios-cloud/core';
import type { PolicyFramework } from '@helios-cloud/core';

export async function policyRoutes(fastify: FastifyInstance, opts: { orchestrator: Orchestrator }) {
  const { orchestrator } = opts;

  fastify.get(
    '/policy/compliance',
    {
      schema: {
        tags: ['policy'],
        summary: 'Run compliance evaluation',
        querystring: {
          type: 'object',
          properties: {
            framework: {
              type: 'string',
              enum: ['cis-aws-1.4', 'cis-aws-1.5', 'soc2', 'pci-dss-3.2', 'hipaa', 'nist-800-53'],
            },
          },
          required: ['framework'],
        },
      },
    },
    async (request) => {
      const { framework } = request.query as { framework: PolicyFramework };
      const reports = await orchestrator.evaluatePolicy({ framework });
      return { framework, reports };
    },
  );

  fastify.get(
    '/policy/violations',
    {
      schema: {
        tags: ['policy'],
        summary: 'List active policy violations',
        querystring: {
          type: 'object',
          properties: {
            framework: { type: 'string' },
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'informational'] },
            resourceType: { type: 'string' },
            limit: { type: 'integer', default: 100 },
          },
        },
      },
    },
    async (request) => {
      const q = request.query as {
        framework?: string;
        severity?: string;
        resourceType?: string;
        limit: number;
      };

      const frameworks: PolicyFramework[] = q.framework
        ? [q.framework as PolicyFramework]
        : ['cis-aws-1.5'];

      const reports = await orchestrator.evaluatePolicy({ framework: frameworks });
      let violations = reports.flatMap(r => r.violations);

      if (q.severity) violations = violations.filter(v => v.severity === q.severity);
      if (q.resourceType) violations = violations.filter(v => v.resourceType === q.resourceType);

      violations.sort((a, b) => {
        const order = { critical: 4, high: 3, medium: 2, low: 1, informational: 0 };
        return (order[b.severity] ?? 0) - (order[a.severity] ?? 0);
      });

      return {
        total: violations.length,
        violations: violations.slice(0, q.limit),
      };
    },
  );
}
