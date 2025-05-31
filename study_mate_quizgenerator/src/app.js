/**
 * app.js
 * Core Express application initialization for StudyMate QuizGenerator.
 * Sets up middleware, API documentation, routes, and error handlers.
 */

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');

// PUBLIC_INTERFACE
/**
 * Initializes and configures the StudyMate QuizGenerator Express app.
 */
const app = express();

// CORS Middleware: enable all origins and relevant methods/headers for development and interoperability.
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// JSON request parsing
app.use(express.json());

// Swagger documentation at /docs, always reflecting dynamic host
app.use('/docs', swaggerUi.serve, (req, res, next) => {
  const dynamicSpec = {
    ...swaggerSpec,
    servers: [
      {
        url: `${req.protocol}://${req.get('host')}`,
      },
    ],
  };
  swaggerUi.setup(dynamicSpec)(req, res, next);
});

// Mount application routes
app.use('/', routes);

// CENTRALIZED ERROR HANDLING (last resort - catches all unhandled errors)
app.use((err, req, res, next) => {
  // Log error stack in development, suppress in production
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err.stack);
  }
  // Respond with generic or specific error message (never leak sensitive details)
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
