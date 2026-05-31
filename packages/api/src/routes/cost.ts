import type { FastifyInstance } from 'fastify';
import type { Orchestrator } from '@helios-cloud/core';

export async function costRoutes(fastify: FastifyInstance, opts: { orchestrator: Orchestrator }) {
  const { orchestrator } = opts;

  fastify.get(
    '/cost/summary',
    {
      schema: {
        tags: ['cost'],
        summary: 'Get cost optimization summary',
      },
    },
    async (_request, reply) => {
      const summary = await orchestrator.analyzeCosts();
      if (!summary) return reply.code(503).send({ error: 'Cost analyzer not configured' });
      return summary;
    },
  );

  fastify.get(
    '/cost/recommendations',
    {
      schema: {
        tags: ['cost'],
        summary: 'List cost optimization recommendations',
        querystring: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            minSavings: { type: 'number' },
            region: { type: 'string' },
            limit: { type: 'integer', default: 50 },
          },
        },
      },
    },
    async (request, reply) => {
      const q = request.query as {
        action?: string;
        minSavings?: number;
        region?: string;
        limit: number;
      };

      const summary = await orchestrator.analyzeCosts();
      if (!summary) return reply.code(503).send({ error: 'Cost analyzer not configured' });

      let recs = summary.recommendations;
      if (q.action) recs = recs.filter(r => r.action === q.action);
      if (q.minSavings) recs = recs.filter(r => r.monthlySavings >= q.minSavings!);
      if (q.region) recs = recs.filter(r => r.region === q.region);

      return {
        total: recs.length,
        recommendations: recs.slice(0, q.limit),
        totalMonthlySavings: recs.reduce((s, r) => s + r.monthlySavings, 0),
      };
    },
  );

  fastify.get(
    '/cost/trend',
    {
      schema: {
        tags: ['cost'],
        summary: 'Get cost trend data',
      },
    },
    async (_request, reply) => {
      const summary = await orchestrator.analyzeCosts();
      if (!summary) return reply.code(503).send({ error: 'Cost analyzer not configured' });
      return { trend: summary.trend, byProvider: summary.byProvider, byRegion: summary.byRegion };
    },
  );
}
