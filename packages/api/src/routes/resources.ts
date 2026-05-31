import type { FastifyInstance } from 'fastify';
import type { Orchestrator } from '@helios-cloud/core';

export async function resourceRoutes(fastify: FastifyInstance, opts: { orchestrator: Orchestrator }) {
  const { orchestrator } = opts;

  fastify.get(
    '/resources',
    {
      schema: {
        tags: ['resources'],
        summary: 'List all discovered resources',
        querystring: {
          type: 'object',
          properties: {
            provider: { type: 'string', enum: ['aws', 'gcp', 'azure'] },
            region: { type: 'string' },
            type: { type: 'string' },
            status: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              resources: { type: 'array' },
              offset: { type: 'integer' },
              limit: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request) => {
      const q = request.query as {
        provider?: string;
        region?: string;
        type?: string;
        status?: string;
        limit: number;
        offset: number;
      };

      const graph = orchestrator.getGraph();
      let resources = graph.getAll();

      if (q.provider) resources = resources.filter(r => r.provider === q.provider);
      if (q.region) resources = resources.filter(r => r.region === q.region);
      if (q.type) resources = resources.filter(r => r.type === q.type);
      if (q.status) resources = resources.filter(r => r.status === q.status);

      const total = resources.length;
      const page = resources.slice(q.offset, q.offset + q.limit);

      return { total, resources: page, offset: q.offset, limit: q.limit };
    },
  );

  fastify.get(
    '/resources/:id',
    {
      schema: {
        tags: ['resources'],
        summary: 'Get a resource by ID',
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const resource = orchestrator.getGraph().getResource(id);
      if (!resource) return reply.code(404).send({ error: 'Resource not found', resourceId: id });
      return resource;
    },
  );

  fastify.get(
    '/resources/:id/dependencies',
    {
      schema: {
        tags: ['resources'],
        summary: 'Get dependencies of a resource',
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const graph = orchestrator.getGraph();
      const resource = graph.getResource(id);
      if (!resource) return reply.code(404).send({ error: 'Resource not found' });

      return {
        resource,
        dependencies: graph.getDependencies(id),
        dependents: graph.getDependents(id),
      };
    },
  );

  fastify.get(
    '/resources/summary',
    {
      schema: {
        tags: ['resources'],
        summary: 'Get resource inventory summary',
      },
    },
    async () => {
      const graph = orchestrator.getGraph();
      const all = graph.getAll();

      const byType: Record<string, number> = {};
      const byRegion: Record<string, number> = {};
      const byStatus: Record<string, number> = {};

      for (const r of all) {
        byType[r.type] = (byType[r.type] ?? 0) + 1;
        byRegion[r.region] = (byRegion[r.region] ?? 0) + 1;
        byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      }

      return {
        total: all.length,
        edgeCount: graph.edgeCount(),
        byType,
        byRegion,
        byStatus,
        orphaned: graph.getOrphanedResources().length,
      };
    },
  );

  fastify.post(
    '/scan',
    {
      schema: {
        tags: ['resources'],
        summary: 'Trigger an infrastructure scan',
      },
    },
    async (request, reply) => {
      reply.code(202);
      const startedAt = new Date().toISOString();

      setImmediate(async () => {
        try {
          await orchestrator.scan();
          fastify.log.info('Scan completed');
        } catch (err) {
          fastify.log.error({ err }, 'Scan failed');
        }
      });

      return { message: 'Scan started', startedAt };
    },
  );
}
