import express from 'express';
import bodyParser from 'body-parser';
import tinyRest from 'tiny-rest';
import registerRoutes from './routes.js';

// The Mosig API on Express
export function createExpressApp() {
  const app = express();
  app.use(bodyParser.json());

  registerRoutes(app);

  // No route matched
  app.use((req, res) => {
    res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
  });

  // Errors raised before the controllers, for example by body-parser when the body is not valid JSON
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    if (err.status >= 400 && err.status < 500) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

// The same API on tiny-rest, the server written from scratch with the http package
export function createScratchApp() {
  const app = tinyRest();
  registerRoutes(app);
  return app;
}
