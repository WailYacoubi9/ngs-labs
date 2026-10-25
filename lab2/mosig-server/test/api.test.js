import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createExpressApp, createScratchApp } from '../app.js';
import { reload } from '../repository.js';

// The same tests run on both servers: they must behave the same way
const servers = {
  Express: createExpressApp,
  'tiny-rest': createScratchApp,
};

const NEW_STUDENT = { ine: '0123456789a', firstName: 'dupont', lastName: 'jean' };

// Answers of the lab 1 server (https://ppp.alwaysdata.net), recorded on 25 Oct 2026
const LAB1_STUDENT = {
  firstName: 'Lutero',
  lastName: 'Lauryn',
  ine: '657395330O',
  email: ['lauryn.lutero@etu.univ-grenoble-alpes.fr'],
  birthDate: '2000-02-04',
  _links: { followed_modules: { href: '/students/657395330O/followed_modules' } },
};

const LAB1_PROF = {
  firstName: 'Magnolia',
  lastName: 'Sonni',
  number: '697453889',
  email: ['sonni.magnolia@univ-grenoble-alpes.fr'],
  birthDate: '1992-01-31',
  _links: { taught_modules: { href: '/profs/697453889/taught_modules' } },
};

const LAB1_MODULE = {
  name: 'OOP',
  label: 'Object-Oriented Programming',
  description: 'Object-oriented programming concepts, principles, and design patterns.',
  coefficient: 30,
  evaluations: [
    { type: 'lab', coefficient: 10 },
    { type: 'project', coefficient: 10 },
    { type: 'exam', coefficient: 10 },
  ],
  _links: {
    enrolled_students: { href: '/modules/oop/enrolled_students' },
    teachers: { href: '/modules/oop/teachers' },
  },
};

const LAB1_TAUGHT_MODULES = ['WEB03', 'ARCHI02', 'WEB01', 'ARCHI01', 'OOP', 'ALGO01', 'ALGO02', 'MathSup', 'OOC', 'WEB02'].map(
  (code) => ({ name: code, href: `/modules/${code.toLowerCase()}/` }),
);

const LAB1_OOP_TEACHERS = [
  '697453889', '056891098', '402255813', '251962930', '867478389', '401417699',
  '318985765', '203780717', '898975366', '184685666', '346070450',
].map((number) => ({ name: number, href: `/profs/${number}/` }));

for (const [serverName, createApp] of Object.entries(servers)) {
  describe(`Mosig API on ${serverName}`, () => {
    let server;
    let baseUrl;

    async function request(method, path, body) {
      const options = { method, headers: {} };
      if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
      const res = await fetch(baseUrl + path, options);
      const text = await res.text();
      return { status: res.status, headers: res.headers, body: text === '' ? null : JSON.parse(text) };
    }

    before(async () => {
      server = createApp().listen(0);
      await once(server, 'listening');
      baseUrl = `http://127.0.0.1:${server.address().port}`;
    });

    after(() => server.close());

    // Every test starts again from the content of data.json
    beforeEach(() => reload());

    describe('GET /', () => {
      it('returns the representation of the master given in lab 1', async () => {
        const res = await request('GET', '/');
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, {
          name: 'Master 2 MOSIG',
          _links: {
            students: { href: '/students' },
            profs: { href: '/profs' },
            modules: { href: '/modules' },
            head: [
              { name: 'Sonni M.', href: '/profs/697453889' },
              { name: 'Annice T.', href: '/profs/547367905' },
              { name: 'Marsiella N.', href: '/profs/251962930' },
            ],
          },
        });
      });

      it('answers 500 when data.json is missing', async (t) => {
        t.mock.method(console, 'error', () => {});
        process.env.DATA_FILE = fileURLToPath(new URL('./missing.json', import.meta.url));
        reload();
        try {
          const res = await request('GET', '/');
          assert.equal(res.status, 500);
          assert.deepEqual(res.body, { error: 'Data file not found' });
        } finally {
          delete process.env.DATA_FILE;
          reload();
        }
      });
    });

    describe('GET /students', () => {
      it('returns the first 20 students by default', async () => {
        const res = await request('GET', '/students');
        assert.equal(res.status, 200);
        assert.equal(res.body.data.length, 20);
        assert.deepEqual(res.body.data[0], {
          name: 'Lauryn L.',
          ine: '657395330O',
          _links: { self: { href: '/students/657395330O' } },
        });
        assert.deepEqual(res.body.pagination, { page: 1, limit: 20, total: 100 });
        assert.deepEqual(res.body.links, {
          self: '/students?page=1&limit=20',
          next: '/students?page=2&limit=20',
        });
      });

      it('answers like the lab 1 server for page 2 of 3 students', async () => {
        const res = await request('GET', '/students?page=2&limit=3');
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, {
          data: [
            { name: 'Lusa B.', ine: '555094194B', _links: { self: { href: '/students/555094194B' } } },
            { name: 'Jennica S.', ine: '449898176M', _links: { self: { href: '/students/449898176M' } } },
            { name: 'Tina R.', ine: '191794613S', _links: { self: { href: '/students/191794613S' } } },
          ],
          pagination: { page: 2, limit: 3, total: 100 },
          links: {
            self: '/students?page=2&limit=3',
            next: '/students?page=3&limit=3',
            previous: '/students?page=1&limit=3',
          },
        });
      });

      it('accepts a trailing slash', async () => {
        const res = await request('GET', '/students/');
        assert.equal(res.status, 200);
        assert.equal(res.body.data.length, 20);
      });

      it('handles the last page and the pages after it', async () => {
        const last = await request('GET', '/students?page=10&limit=10');
        assert.equal(last.status, 200);
        assert.equal(last.body.data.length, 10);
        assert.equal(last.body.links.previous, '/students?page=9&limit=10');
        assert.equal(last.body.links.next, undefined);

        const beyond = await request('GET', '/students?page=11&limit=10');
        assert.equal(beyond.status, 200);
        assert.deepEqual(beyond.body.data, []);

        const all = await request('GET', '/students?limit=100');
        assert.equal(all.body.data.length, 100);
      });

      it('answers 400 when page or limit is invalid', async () => {
        for (const query of ['page=0', 'page=abc', 'page=1.5', 'limit=0', 'limit=101', 'limit=-1']) {
          const res = await request('GET', `/students?${query}`);
          assert.equal(res.status, 400, query);
          assert.equal(typeof res.body.error, 'string');
        }
      });
    });

    describe('GET /students/:ine', () => {
      it('answers like the lab 1 server', async () => {
        const res = await request('GET', '/students/657395330O');
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, LAB1_STUDENT);
      });

      it('accepts a trailing slash', async () => {
        const res = await request('GET', '/students/657395330O/');
        assert.equal(res.status, 200);
        assert.equal(res.body.ine, '657395330O');
      });

      it('answers 404 for an unknown student', async () => {
        const res = await request('GET', '/students/chopper');
        assert.equal(res.status, 404);
        assert.deepEqual(res.body, { error: 'student not found' });
      });

      it('lists the modules followed by the student', async () => {
        const res = await request('GET', '/students/657395330O/followed_modules');
        assert.equal(res.status, 200);
        assert.deepEqual(res.body.data, [{ name: 'WEB01', href: '/modules/web01/' }]);
        assert.deepEqual(res.body.links, { self: '/students/657395330O/followed_modules?page=1&limit=20' });

        const unknown = await request('GET', '/students/chopper/followed_modules');
        assert.equal(unknown.status, 404);
      });
    });

    describe('POST /students', () => {
      it('creates a student (201) that can then be fetched', async () => {
        const res = await request('POST', '/students', NEW_STUDENT);
        assert.equal(res.status, 201);
        assert.equal(res.headers.get('location'), '/students/0123456789a');
        assert.equal(res.body.firstName, 'dupont');
        assert.deepEqual(res.body.email, []);
        assert.equal(res.body.birthDate, null);

        const fetched = await request('GET', '/students/0123456789a');
        assert.equal(fetched.status, 200);
        assert.equal(fetched.body.lastName, 'jean');

        const list = await request('GET', '/students');
        assert.equal(list.body.pagination.total, 101);
      });

      it('answers 409 when the ine already exists', async () => {
        assert.equal((await request('POST', '/students', NEW_STUDENT)).status, 201);
        const again = await request('POST', '/students', NEW_STUDENT);
        assert.equal(again.status, 409);
        const existing = await request('POST', '/students', { ...NEW_STUDENT, ine: '657395330O' });
        assert.equal(existing.status, 409);
      });

      it('answers 400 when the body is invalid', async () => {
        const invalidBodies = [
          { firstName: 'dupont', lastName: 'jean' },
          { ine: 'a b', firstName: 'dupont', lastName: 'jean' },
          { ine: 'x1', firstName: 'dupont' },
          { ine: 'x1', firstName: '', lastName: 'jean' },
          { ine: 'x1', firstName: 'dupont', lastName: 'jean', email: 'not-a-list' },
          { ine: 'x1', firstName: 'dupont', lastName: 'jean', birthDate: '30/09/2001' },
          { ine: 'x1', firstName: 'dupont', lastName: 'jean', age: 22 },
          [NEW_STUDENT],
        ];
        for (const body of invalidBodies) {
          const res = await request('POST', '/students', body);
          assert.equal(res.status, 400, JSON.stringify(body));
        }
      });

      it('answers 400 when the body is not valid JSON', async () => {
        const res = await request('POST', '/students', '{"ine": "x1", ');
        assert.equal(res.status, 400);
        assert.deepEqual(res.body, { error: 'Invalid JSON body' });
      });

      it('answers 400 when there is no JSON body', async () => {
        const res = await request('POST', '/students');
        assert.equal(res.status, 400);
      });
    });

    describe('PUT /students/:ine', () => {
      it('replaces the whole student (204)', async () => {
        const res = await request('PUT', '/students/657395330O', {
          firstName: 'Lutero',
          lastName: 'Lauryn-Smith',
          birthDate: '2000-02-05',
        });
        assert.equal(res.status, 204);

        const fetched = await request('GET', '/students/657395330O');
        assert.equal(fetched.body.lastName, 'Lauryn-Smith');
        assert.equal(fetched.body.birthDate, '2000-02-05');
        // email was not sent, so it is emptied
        assert.deepEqual(fetched.body.email, []);
        // the modules followed are not part of the attributes replaced by PUT
        const modules = await request('GET', '/students/657395330O/followed_modules');
        assert.equal(modules.body.pagination.total, 1);
      });

      it('answers 400 when the body is incomplete or changes the ine', async () => {
        assert.equal((await request('PUT', '/students/657395330O', { firstName: 'Lutero' })).status, 400);
        const changeIne = { ine: 'other', firstName: 'Lutero', lastName: 'Lauryn' };
        assert.equal((await request('PUT', '/students/657395330O', changeIne)).status, 400);
      });

      it('answers 404 for an unknown student', async () => {
        const res = await request('PUT', '/students/chopper', { firstName: 'a', lastName: 'b' });
        assert.equal(res.status, 404);
      });
    });

    describe('PATCH /students/:ine', () => {
      it('changes only the fields sent (204)', async () => {
        const res = await request('PATCH', '/students/657395330O', { birthDate: '2000-03-01' });
        assert.equal(res.status, 204);

        const fetched = await request('GET', '/students/657395330O');
        assert.equal(fetched.body.birthDate, '2000-03-01');
        assert.equal(fetched.body.lastName, 'Lauryn');
        assert.deepEqual(fetched.body.email, ['lauryn.lutero@etu.univ-grenoble-alpes.fr']);
      });

      it('answers 400 for an unknown field and 404 for an unknown student', async () => {
        assert.equal((await request('PATCH', '/students/657395330O', { weight: 28 })).status, 400);
        assert.equal((await request('PATCH', '/students/chopper', { firstName: 'a' })).status, 404);
      });
    });

    describe('DELETE /students/:ine', () => {
      it('deletes the student and removes it from its modules', async () => {
        const enrolled = async () => {
          const res = await request('GET', '/modules/web01/enrolled_students?limit=100');
          return res.body.data.map((student) => student.ine);
        };
        assert.ok((await enrolled()).includes('657395330O'));

        const res = await request('DELETE', '/students/657395330O');
        assert.equal(res.status, 204);
        assert.equal(res.body, null);

        assert.equal((await request('GET', '/students/657395330O')).status, 404);
        assert.ok(!(await enrolled()).includes('657395330O'));
        assert.equal((await request('GET', '/students')).body.pagination.total, 99);
      });

      it('answers 404 the second time', async () => {
        assert.equal((await request('DELETE', '/students/657395330O')).status, 204);
        assert.equal((await request('DELETE', '/students/657395330O')).status, 404);
      });
    });

    describe('profs', () => {
      it('lists the profs', async () => {
        const res = await request('GET', '/profs');
        assert.equal(res.status, 200);
        assert.deepEqual(res.body.pagination, { page: 1, limit: 20, total: 20 });
        assert.deepEqual(res.body.data[0], {
          name: 'Sonni M.',
          number: '697453889',
          _links: { self: { href: '/profs/697453889' } },
        });
      });

      it('answers like the lab 1 server for one prof', async () => {
        const res = await request('GET', '/profs/697453889');
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, LAB1_PROF);
      });

      it('lists the modules taught by the prof, like the lab 1 server', async () => {
        const res = await request('GET', '/profs/697453889/taught_modules');
        assert.equal(res.status, 200);
        assert.deepEqual(res.body.data, LAB1_TAUGHT_MODULES);
        assert.deepEqual(res.body.pagination, { page: 1, limit: 20, total: 10 });

        const page = await request('GET', '/profs/697453889/taught_modules?page=1&limit=2');
        assert.deepEqual(page.body.data, LAB1_TAUGHT_MODULES.slice(0, 2));
        assert.equal(page.body.links.next, '/profs/697453889/taught_modules?page=2&limit=2');
      });

      it('answers 404 for an unknown prof', async () => {
        const res = await request('GET', '/profs/000');
        assert.equal(res.status, 404);
        assert.deepEqual(res.body, { error: 'prof not found' });
        assert.equal((await request('GET', '/profs/000/taught_modules')).status, 404);
      });
    });

    describe('modules', () => {
      it('lists the modules', async () => {
        const res = await request('GET', '/modules');
        assert.equal(res.status, 200);
        assert.deepEqual(res.body.pagination, { page: 1, limit: 20, total: 14 });
        assert.equal(res.body.data.length, 14);
        assert.deepEqual(res.body.data[0], { name: 'OOP', _links: { self: { href: '/modules/oop' } } });
      });

      it('answers like the lab 1 server for one module', async () => {
        const res = await request('GET', '/modules/oop');
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, LAB1_MODULE);
      });

      it('identifies a module by its code in lower case, like the lab 1 server', async () => {
        assert.equal((await request('GET', '/modules/oop/')).status, 200);
        assert.equal((await request('GET', '/modules/OOP')).status, 404);
      });

      it('lists the students and the teachers of a module', async () => {
        const students = await request('GET', '/modules/oop/enrolled_students?limit=100');
        assert.equal(students.status, 200);
        assert.equal(students.body.pagination.total, 52);
        assert.deepEqual(students.body.data[0], { ine: '555094194B', href: '/students/555094194B/' });

        const teachers = await request('GET', '/modules/oop/teachers');
        assert.equal(teachers.status, 200);
        assert.deepEqual(teachers.body.data, LAB1_OOP_TEACHERS);

        const empty = await request('GET', '/modules/fullstack/enrolled_students');
        assert.equal(empty.body.pagination.total, 0);
      });

      it('gives the links of a relation to the relation itself', async () => {
        const res = await request('GET', '/modules/oop/enrolled_students?page=2&limit=50');
        assert.equal(res.body.data.length, 2);
        assert.deepEqual(res.body.links, {
          self: '/modules/oop/enrolled_students?page=2&limit=50',
          previous: '/modules/oop/enrolled_students?page=1&limit=50',
        });
      });

      it('answers 404 for an unknown module', async () => {
        const res = await request('GET', '/modules/nope');
        assert.equal(res.status, 404);
        assert.deepEqual(res.body, { error: 'module not found' });
        assert.equal((await request('GET', '/modules/nope/enrolled_students')).status, 404);
        assert.equal((await request('GET', '/modules/nope/teachers')).status, 404);
      });
    });

    it('answers 404 in JSON for an unknown route', async () => {
      const res = await request('GET', '/teachers');
      assert.equal(res.status, 404);
      assert.deepEqual(res.body, { error: 'Cannot GET /teachers' });

      const wrongMethod = await request('DELETE', '/profs/697453889');
      assert.equal(wrongMethod.status, 404);
    });
  });
}
