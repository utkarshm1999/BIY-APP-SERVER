const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const swagger = require('@fastify/swagger');

// Register CORS
fastify.register(cors, {
  origin: true // Allow all origins for development
});

// Register Swagger
fastify.register(swagger, {
  swagger: {
    info: {
      title: 'API Documentation',
      description: 'API documentation using Swagger',
      version: '1.0.0'
    },
    host: 'localhost:3001',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  }
});

// Import the L1 optimizer handler
const l1OptimiserHandler = require('./handlers/costing/house/l1-optimizer');
const templateHandler = require('./handlers/costing/house/template');

// Define routes
fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

// Add L1 optimizer route
fastify.post('/costing/house/l1-optimizer', async (request, reply) => {
  return l1OptimiserHandler(request, reply);
});

// Add template route
fastify.get('/costing/house/template', async (request, reply) => {
  return templateHandler(request, reply);
});

// Example route with parameters
fastify.get('/users/:id', {
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { id } = request.params;
  return { userId: id };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
