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
| GET | `/students?page=1&limit=20` | 200: one page of students (`name`, `ine`); 400 if page or limit is invalid |
| POST | `/students` | 201 with a `Location` header; 400 if the body is invalid; 409 if the ine already exists |
| GET | `/students/:ine` | 200: full student; 404 |
| PUT | `/students/:ine` | 204: the whole student is replaced; 400; 404 |
| PATCH | `/students/:ine` | 204: only the fields sent are changed; 400; 404 |
| DELETE | `/students/:ine` | 204: the student is also removed from its modules; 404 |
| GET | `/students/:ine/followed_modules` | 200: modules followed by the student; 400; 404 |
| GET | `/profs?page=1&limit=20` | 200; 400 |
| GET | `/profs/:number` | 200; 404 |
| GET | `/profs/:number/taught_modules` | 200: modules taught by the prof; 400; 404 |
| GET | `/modules?page=1&limit=20` | 200; 400 |
| GET | `/modules/:code` | 200; 404. The code is in lower case: `/modules/oop` |
| GET | `/modules/:code/enrolled_students` | 200: students registered in the module; 400; 404 |
| GET | `/modules/:code/teachers` | 200: profs who teach the module; 400; 404 |

Any other route gets a 404, a body that isn't valid JSON gets a 400, and a missing `data.json` gets a 500. Paths work with or without a trailing slash (`/students/` = `/students`).

The body of POST and PUT follows the Student schema of the lab 1 specification:

```bash
curl -i -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{"ine": "0123456789a", "firstName": "dupont", "lastName": "jean", "email": ["jean.dupont@etu.univ-grenoble-alpes.fr"], "birthDate": "2001-09-30"}'
```

## Design choices

- Clients never get the stored objects as they are. The server builds the same representations as the lab 1 server (https://ppp.alwaysdata.net), with the field names of the lab 1 specification (`firstName`, `lastName`, `birthDate`). A collection returns short representations (the name as `Lauryn L.` and the id), and a single resource returns its full representation.
- The answers were compared with the lab 1 server on 25 Oct 2026. The tests check the student 657395330O, the prof 697453889, the module oop, its teachers and the second page of students against the answers recorded from that server.
- Collections have the format of the lab 1 server: `{ "data": [...], "pagination": { "page", "limit", "total" }, "links": { "self", "next", "previous" } }`.
- A single resource links to its relations, as on the lab 1 server: `followed_modules` for a student, `taught_modules` for a prof, `enrolled_students` and `teachers` for a module. Each relation is a paginated collection of its own.
- In URLs, a module is identified by its code in lower case (`/modules/oop`), as on the lab 1 server, so `/modules/OOP` answers 404.
- The lab 1 server doesn't show the `office` and `category` of profs, so this server doesn't either.
- PUT replaces all the attributes of a student, so optional fields left out (`email`, `birthDate`) are emptied. PATCH changes only the fields it receives. The ine identifies the student and can't be changed.
- Changes made with POST, PUT, PATCH and DELETE are kept in memory and `data.json` is never written, so restarting the server resets the data.
- `data.json` is read with `fs.readFileSync` from the folder of the code, not from the folder where `node` is launched.

## Differences with the lab 1 server, on purpose

- Pagination follows the lab 1 specification: `limit` is 20 by default and at most 100, and an invalid `page` or `limit` gets a 400. The lab 1 server uses 50 by default, accepts any `limit`, silently replaces an invalid `page` by 1, and answers 99 students to `limit=-1`.
- The `links` of a relation point to the relation itself (`/modules/oop/enrolled_students?page=2&limit=50`). On the lab 1 server they point to the whole collection (`/students?page=2&limit=50`), so following `next` there loads another list.
- Errors are `{ "error": "student not found" }`, where the lab 1 server writes "fouund".
- The name of the master comes from `data.json` ("Master 2 MOSIG", as on the lab 1 page). The lab 1 server now answers "IUT2 Dep Info".

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
