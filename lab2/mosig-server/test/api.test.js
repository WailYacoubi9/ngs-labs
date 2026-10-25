import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createExpressApp, createScratchApp } from '../app.js';
import { reload, findModule } from '../repository.js';

// The same tests run on both servers: they must behave the same way
const servers = {
  Express: createExpressApp,
  'tiny-rest': createScratchApp,
};

const NEW_STUDENT = { ine: '0123456789a', firstName: 'dupont', lastName: 'jean' };

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
        assert.equal(res.body.total, 100);
        assert.equal(res.body.page, 1);
        assert.equal(res.body.limit, 20);
        assert.equal(res.body.students.length, 20);
        assert.deepEqual(res.body.students[0], {
          ine: '657395330O',
          name: 'Lauryn Lutero',
          _links: { self: { href: '/students/657395330O' } },
        });
        assert.deepEqual(res.body._links, {
          self: { href: '/students?page=1&limit=20' },
          next: { href: '/students?page=2&limit=20' },
        });
      });

      it('accepts a trailing slash', async () => {
        const res = await request('GET', '/students/');
        assert.equal(res.status, 200);
        assert.equal(res.body.students.length, 20);
      });

      it('handles page and limit', async () => {
        const last = await request('GET', '/students?page=10&limit=10');
        assert.equal(last.status, 200);
        assert.equal(last.body.students.length, 10);
        assert.equal(last.body._links.prev.href, '/students?page=9&limit=10');
        assert.equal(last.body._links.next, undefined);

        const beyond = await request('GET', '/students?page=11&limit=10');
        assert.equal(beyond.status, 200);
        assert.deepEqual(beyond.body.students, []);

        const all = await request('GET', '/students?limit=100');
        assert.equal(all.body.students.length, 100);
      });

      it('answers 400 when page or limit is invalid', async () => {
        for (const query of ['page=0', 'page=abc', 'page=1.5', 'limit=0', 'limit=101', 'limit=-3']) {
          const res = await request('GET', `/students?${query}`);
          assert.equal(res.status, 400, query);
          assert.equal(typeof res.body.error, 'string');
        }
      });
    });

    describe('GET /students/:ine', () => {
      it('returns the full representation of a student', async () => {
        const res = await request('GET', '/students/657395330O');
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, {
          ine: '657395330O',
          firstName: 'Lutero',
          lastName: 'Lauryn',
          email: ['lauryn.lutero@etu.univ-grenoble-alpes.fr'],
          birthDate: '2000-02-04',
          _links: {
            self: { href: '/students/657395330O' },
            modules: [{ code: 'WEB01', href: '/modules/WEB01' }],
          },
        });
      });

      it('accepts a trailing slash', async () => {
        const res = await request('GET', '/students/657395330O/');
        assert.equal(res.status, 200);
        assert.equal(res.body.ine, '657395330O');
      });

      it('answers 404 for an unknown student', async () => {
        const res = await request('GET', '/students/chopper');
        assert.equal(res.status, 404);
        assert.deepEqual(res.body, { error: 'Student chopper not found' });
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
        assert.equal(list.body.total, 101);
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
        assert.equal(fetched.body._links.modules.length, 1);
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
        assert.ok(findModule('WEB01').registeredStudents.includes('657395330O'));

        const res = await request('DELETE', '/students/657395330O');
        assert.equal(res.status, 204);
        assert.equal(res.body, null);

        assert.equal((await request('GET', '/students/657395330O')).status, 404);
        assert.ok(!findModule('WEB01').registeredStudents.includes('657395330O'));
        assert.equal((await request('GET', '/students')).body.total, 99);
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
        assert.equal(res.body.total, 20);
        assert.deepEqual(res.body.profs[0], {
          number: '697453889',
          name: 'Sonni Magnolia',
          _links: { self: { href: '/profs/697453889' } },
        });
      });

      it('returns one prof with links to the modules taught', async () => {
        const res = await request('GET', '/profs/547367905');
        assert.equal(res.status, 200);
        assert.equal(res.body.lastName, 'Annice');
        assert.equal(res.body.office, 'DG-227');
        assert.deepEqual(res.body._links.modules, [{ code: 'MathSup', href: '/modules/MathSup' }]);
      });

      it('returns null for the category missing in data.json', async () => {
        const res = await request('GET', '/profs/346070450');
        assert.equal(res.status, 200);
        assert.equal(res.body.category, null);
      });

      it('answers 404 for an unknown prof', async () => {
        assert.equal((await request('GET', '/profs/000')).status, 404);
      });
    });

    describe('modules', () => {
      it('lists the modules', async () => {
        const res = await request('GET', '/modules');
        assert.equal(res.status, 200);
        assert.equal(res.body.total, 14);
        assert.equal(res.body.modules.length, 14);
      });

      it('returns one module with links to its students and profs', async () => {
        const res = await request('GET', '/modules/OOP');
        assert.equal(res.status, 200);
        assert.equal(res.body.label, 'Object-Oriented Programming');
        assert.equal(res.body.evaluations.length, 3);
        assert.deepEqual(res.body._links, {
          self: { href: '/modules/OOP' },
          students: { href: '/modules/OOP/students' },
          profs: { href: '/modules/OOP/profs' },
        });
      });

      it('lists the students and the profs of a module', async () => {
        const students = await request('GET', '/modules/OOP/students?limit=100');
        assert.equal(students.status, 200);
        assert.equal(students.body.total, 52);
        assert.equal(students.body.students[0].ine, '555094194B');

        const profs = await request('GET', '/modules/OOP/profs');
        assert.equal(profs.status, 200);
        assert.equal(profs.body.total, 11);

        const empty = await request('GET', '/modules/fullstack/students');
        assert.equal(empty.body.total, 0);
      });

      it('answers 404 for an unknown module', async () => {
        assert.equal((await request('GET', '/modules/NOPE')).status, 404);
        assert.equal((await request('GET', '/modules/NOPE/students')).status, 404);
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
