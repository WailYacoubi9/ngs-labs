import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import tinyRest from '../index.js';

describe('tiny-rest server', () => {
  let server;
  let port;

  before(async () => {
    const app = tinyRest();
    app.get('/hello', (req, res) => res.status(200).send('Hello World!'));
    app.get('/items/:id', (req, res) => res.status(200).json({ id: req.params.id, query: req.query }));
    app.post('/echo', (req, res) => res.status(201).json({ received: req.body }));
    app.get('/boom', () => {
      throw new Error('boom');
    });
    server = app.listen(0);
    await once(server, 'listening');
    port = server.address().port;
  });

  after(() => server.close());

  it('answers a static route', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/hello`);
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'Hello World!');
  });

  it('passes route parameters and query parameters to the handler', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/items/42?sort=name`);
    assert.deepEqual(await res.json(), { id: '42', query: { sort: 'name' } });
  });

  it('gathers a payload sent in several chunks', async () => {
    const answer = new Promise((resolve, reject) => {
      const req = http.request(
        { port, path: '/echo', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        (res) => {
          let text = '';
          res.on('data', (chunk) => (text += chunk));
          res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(text) }));
        },
      );
      req.on('error', reject);
      req.write('{"name": "pika');
      req.write('chu", "type": "electric"}');
      req.end();
    });
    const { status, body } = await answer;
    assert.equal(status, 201);
    assert.deepEqual(body, { received: { name: 'pikachu', type: 'electric' } });
  });

  it('answers 400 when the JSON payload is invalid', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name": ',
    });
    assert.equal(res.status, 400);
  });

  it('answers 404 when no route matches', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/nothing`);
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: 'Cannot GET /nothing' });
  });

  it('answers 500 when a handler throws', async (t) => {
    t.mock.method(console, 'error', () => {});
    const res = await fetch(`http://127.0.0.1:${port}/boom`);
    assert.equal(res.status, 500);
  });
});
