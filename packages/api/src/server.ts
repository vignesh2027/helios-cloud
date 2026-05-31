import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import { eventBus } from '@helios-cloud/core';
import type { Orchestrator } from '@helios-cloud/core';
import { resourceRoutes } from './routes/resources.js';
import { costRoutes } from './routes/cost.js';
import { driftRoutes } from './routes/drift.js';
import { policyRoutes } from './routes/policy.js';

export interface ServerOptions {
  orchestrator: Orchestrator;
  port?: number;
  host?: string;
  logLevel?: string;
}

export async function createServer(opts: ServerOptions) {
  const config = opts.orchestrator.getConfig();

  const fastify = Fastify({
    logger: {
      level: config.logLevel,
      transport:
        process.env['NODE_ENV'] !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    disableRequestLogging: false,
    ajv: {
      customOptions: {
        removeAdditional: true,
        useDefaults: true,
        coerceTypes: true,
      },
    },
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  await fastify.register(cors, {
    origin: config.api.cors.origins,
    credentials: true,
  });

  await fastify.register(rateLimit, {
    global: true,
    max: config.api.rateLimit.max,
    timeWindow: config.api.rateLimit.windowMs,
    errorResponseBuilder: (_request, context) => ({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.after}`,
      statusCode: 429,
    }),
  });

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'HELIOS Cloud API',
        description: 'Enterprise Cloud Infrastructure Orchestration Platform API',
        version: '0.1.0',
        contact: { name: 'Vigneshwar L', url: 'https://github.com/vignesh2027' },
        license: { name: 'Apache 2.0', url: 'https://www.apache.org/licenses/LICENSE-2.0' },
      },
      tags: [
        { name: 'resources', description: 'Resource inventory and discovery' },
        { name: 'cost', description: 'Cost optimization and analysis' },
        { name: 'drift', description: 'Infrastructure drift detection' },
        { name: 'policy', description: 'Compliance and policy enforcement' },
        { name: 'health', description: 'Health and status' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { deepLinking: false },
    staticCSP: true,
  });

  await fastify.register(websocket);

  fastify.get('/healthz', { schema: { tags: ['health'], summary: 'Health check' } }, async () => ({
    status: 'ok',
    version: process.env['npm_package_version'] ?? 'dev',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));

  fastify.get('/readyz', { schema: { tags: ['health'], summary: 'Readiness check' } }, async () => ({
    status: 'ready',
    resources: opts.orchestrator.getGraph().size(),
  }));

  fastify.get('/metrics', { schema: { tags: ['health'], summary: 'Prometheus metrics' } }, async () => {
    const graph = opts.orchestrator.getGraph();
    const all = graph.getAll();
    const lines = [
      '# HELP helios_resources_total Total number of discovered resources',
      '# TYPE helios_resources_total gauge',
      `helios_resources_total ${all.length}`,
      '# HELP helios_resource_edges_total Total number of dependency edges',
      '# TYPE helios_resource_edges_total gauge',
      `helios_resource_edges_total ${graph.edgeCount()}`,
    ];
    return lines.join('\n') + '\n';
  });

  await fastify.register(
    async function apiRoutes(api) {
      api.register(resourceRoutes, { prefix: '/resources', orchestrator: opts.orchestrator });
      api.register(costRoutes, { prefix: '/cost', orchestrator: opts.orchestrator });
      api.register(driftRoutes, { prefix: '/drift', orchestrator: opts.orchestrator });
      api.register(policyRoutes, { prefix: '/policy', orchestrator: opts.orchestrator });

      api.get('/ws/events', { websocket: true }, (socket) => {
        const handlers: Array<() => void> = [];

        const emit = (event: string, data: unknown) => {
          if (socket.readyState === 1) {
            socket.send(JSON.stringify({ event, data, timestamp: new Date().toISOString() }));
          }
        };

        const onDrift = eventBus.on('drift:detected', ({ driftedResource }) => {
          emit('drift:detected', driftedResource);
        });
        const onViolation = eventBus.on('policy:violation', ({ violation }) => {
          emit('policy:violation', violation);
        });
        const onScanComplete = eventBus.on('scan:completed', data => {
          emit('scan:completed', data);
        });

        handlers.push(
          () => eventBus.off('drift:detected', onDrift as never),
          () => eventBus.off('policy:violation', onViolation as never),
          () => eventBus.off('scan:completed', onScanComplete as never),
        );

        socket.on('close', () => {
          handlers.forEach(h => h());
        });
      });
    },
    { prefix: '/api/v1' },
  );

  return fastify;
}

export async function startServer(opts: ServerOptions) {
  const server = await createServer(opts);
  const port = opts.port ?? opts.orchestrator.getConfig().api.port;
  const host = opts.host ?? opts.orchestrator.getConfig().api.host;

  await server.listen({ port, host });
  return server;
}
