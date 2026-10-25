import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Router, { toRegExp, paramNames } from '../router.js';

describe('toRegExp', () => {
  it('matches a static route with or without the trailing slash', () => {
    const regexp = toRegExp('/students/');
    assert.ok(regexp.test('/students/'));
    assert.ok(regexp.test('/students'));
    assert.ok(!regexp.test('/students/A12'));
  });

  it('captures the value of a parameter', () => {
    const regexp = toRegExp('/students/:ine/');
    assert.ok(regexp.test('/students/A12/'));
    assert.ok(regexp.test('/students/A12'));
    assert.ok(!regexp.test('/students/'));
    assert.ok(!regexp.test('/students/A12/modules'));
    assert.deepEqual('/students/657395330O'.match(regexp).slice(1), ['657395330O']);
  });

  it('handles several parameters', () => {
    const regexp = toRegExp('/modules/:code/students/:ine');
    assert.deepEqual('/modules/WEB01/students/A-12'.match(regexp).slice(1), ['WEB01', 'A-12']);
  });

  it('matches the root route only', () => {
    const regexp = toRegExp('/');
    assert.ok(regexp.test('/'));
    assert.ok(!regexp.test('/students'));
  });
});

describe('paramNames', () => {
  it('lists the parameters in order', () => {
    assert.deepEqual(paramNames('/modules/:code/students/:ine'), ['code', 'ine']);
    assert.deepEqual(paramNames('/students'), []);
  });
});

describe('Router', () => {
  const list = () => {};
  const one = () => {};
  const create = () => {};
  const router = new Router();
  router.add('get', '/students', list);
  router.add('get', '/students/:ine', one);
  router.add('post', '/students', create);

  it('finds the route that has the same method and path', () => {
    assert.equal(router.find('GET', '/students').handler, list);
    assert.equal(router.find('GET', '/students/').handler, list);
    assert.equal(router.find('POST', '/students').handler, create);
  });

  it('gives the parameters of a dynamic route', () => {
    const route = router.find('GET', '/students/A12');
    assert.equal(route.handler, one);
    assert.deepEqual(route.params, { ine: 'A12' });
  });

  it('returns null when nothing matches', () => {
    assert.equal(router.find('DELETE', '/students/A12'), null);
    assert.equal(router.find('GET', '/teachers'), null);
  });
});
