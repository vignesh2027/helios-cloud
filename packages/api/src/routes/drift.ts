import type { FastifyInstance } from 'fastify';
import type { Orchestrator } from '@helios-cloud/core';

export async function driftRoutes(fastify: FastifyInstance, opts: { orchestrator: Orchestrator }) {
  const { orchestrator } = opts;

  fastify.get(
    '/drift',
    {
      schema: {
        tags: ['drift'],
        summary: 'Run drift detection',
        querystring: {
          type: 'object',
          properties: {
            stateFile: { type: 'string' },
          },
          required: ['stateFile'],
        },
      },
    },
    async (request, reply) => {
      const { stateFile } = request.query as { stateFile: string };
      const report = await orchestrator.detectDrift(stateFile);
      if (!report) return reply.code(503).send({ error: 'Drift detector not configured' });
      return report;
    },
  );

  fastify.get(
    '/drift/summary',
    {
      schema: {
        tags: ['drift'],
        summary: 'Get drift detection summary',
        querystring: {
          type: 'object',
          properties: {
            stateFile: { type: 'string' },
          },
          required: ['stateFile'],
        },
      },
    },
    async (request, reply) => {
      const { stateFile } = request.query as { stateFile: string };
      const report = await orchestrator.detectDrift(stateFile);
      if (!report) return reply.code(503).send({ error: 'Drift detector not configured' });

      return {
        hasDrift: report.hasDrift,
        totalDrifted: report.totalDrifted,
        bySeverity: report.bySeverity,
        checkedAt: report.checkedAt,
        durationMs: report.durationMs,
      };
    },
  );
}
