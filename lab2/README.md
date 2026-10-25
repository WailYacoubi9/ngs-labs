# Lab 2 – REST server for the Mosig master

This folder contains two Node.js packages:

- `mosig-server/` is the REST API of the Mosig master, built from `data.json`. The same routes and controllers run on **Express** (`index.js`) and on **tiny-rest** (`index-scratch.js`).
- `tiny-rest/` is a small Express-like server written from scratch with the native `http` package. It has a routing table, dynamic routes turned into regular expressions, and JSON payloads gathered from chunks. `mosig-server` depends on it as a separate package.

## Running

Node.js 20 or newer is required (`nvm install --lts`).

```bash
cd mosig-server
npm install            # installs express and body-parser, and links ../tiny-rest
npm start              # Express version   -> http://localhost:3000
npm run start:scratch  # tiny-rest version -> http://localhost:3001
npm test               # runs the API tests on both servers
```

```bash
cd tiny-rest
npm test               # tests of the router and of the server
```

`tiny-rest` is declared in `mosig-server/package.json` as `"tiny-rest": "file:../tiny-rest"`, so `npm install` creates the link. During development, the same link can be made by hand with npm link:

```bash
cd tiny-rest && npm link
cd ../mosig-server && npm link tiny-rest
```

## Routes

| Method | Path | Answers |
|---|---|---|
| GET | `/` | 200: name of the master, links to students, profs and modules, and the heads of the master |
| GET | `/students?page=1&limit=20` | 200: one page of short representations (`ine`, `name`); 400 if page or limit is invalid |
| POST | `/students` | 201 with a `Location` header; 400 if the body is invalid; 409 if the ine already exists |
| GET | `/students/:ine` | 200: full student; 404 |
| PUT | `/students/:ine` | 204: the whole student is replaced; 400; 404 |
| PATCH | `/students/:ine` | 204: only the fields sent are changed; 400; 404 |
| DELETE | `/students/:ine` | 204: the student is also removed from its modules; 404 |
| GET | `/profs?page=1&limit=20` | 200; 400 |
| GET | `/profs/:number` | 200; 404 |
| GET | `/modules?page=1&limit=20` | 200; 400 |
| GET | `/modules/:code` | 200; 404 |
| GET | `/modules/:code/students?page=1&limit=20` | 200: students registered in the module; 404 |
| GET | `/modules/:code/profs?page=1&limit=20` | 200: profs of the module; 404 |

Any other route gets a 404, a body that isn't valid JSON gets a 400, and a missing `data.json` gets a 500. Paths work with or without a trailing slash (`/students/` = `/students`).

The body of POST and PUT follows the Student schema of the lab 1 specification:

```bash
curl -i -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{"ine": "0123456789a", "firstName": "dupont", "lastName": "jean", "email": ["jean.dupont@etu.univ-grenoble-alpes.fr"], "birthDate": "2001-09-30"}'
```

## Design choices

- Clients never get the stored objects as they are. The server builds representations that use the field names of the lab 1 specification (`firstName`, `lastName`, `birthDate`). Collections return short representations (`ine` and `name` for students), and a single resource returns its full representation.
- Every representation carries `_links` (HATEOAS): `self`, the modules of a student or prof, the students and profs of a module, and `prev`/`next` on paginated collections.
- Collections are paginated with `page` (default 1) and `limit` (default 20, maximum 100), as in the specification.
- PUT replaces all the attributes of a student, so optional fields left out (`email`, `birthDate`) are emptied. PATCH changes only the fields it receives. The ine identifies the student and can't be changed.
- Changes made with POST, PUT, PATCH and DELETE are kept in memory and `data.json` is never written, so restarting the server resets the data.
- `data.json` is read with `fs.readFileSync` from the folder of the code, not from the folder where `node` is launched.
- In `data.json`, prof 346070450 has a field `cstudentsategory` instead of `category`, so the API returns `category: null` for this prof.

## Structure

```
mosig-server/
  index.js              starts the Express version
  index-scratch.js      starts the tiny-rest version
  app.js                creates the Express app and the tiny-rest app
  routes.js             the routes, shared by both servers
  controllers/          MainController, StudentController, ProfController, ModuleController
  repository.js         reads data.json and finds students, profs and modules
  representations.js    builds the representations sent to clients
  pagination.js         reads page and limit, builds one page of a collection
  test/api.test.js      API tests run on both servers
tiny-rest/
  index.js              the server: main callback, body parsing, Express-like res helpers
  router.js             routing table and conversion of routes into regular expressions
  test/                 tests of the router and of the server
```
