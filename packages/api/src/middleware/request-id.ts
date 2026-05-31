import type { FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import fp from 'fastify-plugin';

const requestIdPlugin: FastifyPluginAsync = async fastify => {
  fastify.addHook('onRequest', async (request, reply) => {
    const existingId = request.headers['x-request-id'];
    const requestId = typeof existingId === 'string' ? existingId : uuidv4();
    reply.header('x-request-id', requestId);
    request.id = requestId;
  });
};

export default fp(requestIdPlugin, { name: 'request-id' });
