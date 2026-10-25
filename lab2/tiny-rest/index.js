import http from 'node:http';
import Router from './router.js';

// Adds to the native response the few Express-like helpers the controllers use
function decorate(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.set = (name, value) => {
    res.setHeader(name, value);
    return res;
  };
  res.json = (body) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
    return res;
  };
  res.send = (text) => {
    if (!res.hasHeader('Content-Type')) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
    res.end(String(text));
    return res;
  };
}

// The payload arrives in chunks: gather them until the end of the request
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default function tinyRest() {
  const router = new Router();

  // Main callback, called by the http server for every request
  async function handleRequest(req, res) {
    decorate(res);
    const url = new URL(req.url, 'http://localhost');
    req.path = url.pathname;
    req.query = Object.fromEntries(url.searchParams);

    const route = router.find(req.method, url.pathname);
    if (route === null) {
      res.status(404).json({ error: `Cannot ${req.method} ${url.pathname}` });
      return;
    }
    req.params = route.params;

    try {
      const raw = await readBody(req);
      const contentType = req.headers['content-type'] ?? '';
      if (contentType.includes('application/json')) {
        try {
          req.body = raw === '' ? {} : JSON.parse(raw);
        } catch {
          res.status(400).json({ error: 'Invalid JSON body' });
          return;
        }
      }
      await route.handler(req, res);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  const app = {
    addRoute(method, path, handler) {
      router.add(method, path, handler);
      return app;
    },
    get: (path, handler) => app.addRoute('get', path, handler),
    post: (path, handler) => app.addRoute('post', path, handler),
    put: (path, handler) => app.addRoute('put', path, handler),
    patch: (path, handler) => app.addRoute('patch', path, handler),
    delete: (path, handler) => app.addRoute('delete', path, handler),
    listen(...args) {
      return http.createServer(handleRequest).listen(...args);
    },
  };

  return app;
}
