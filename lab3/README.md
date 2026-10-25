# Lab 3 – Functional and structural unit testing, UI testing

- `1-money/` – tests of the `Money` class: `beforeEach` hook, Chai with `expect` and `should`
- `2-factorial/` – `factorial` function written with the TDD approach
- `3-chess/` – chess game: unit tests (pawn, queen, chessboard, replay of a previous game), code coverage, UI tests with Cypress
- `ANSWERS.md` – answers to the questions of the lab, and the bugs found

## Requirements

Node.js 22 or newer. Cypress 16 needs it, and `test/game.js` imports the JSON file with the `with { type: 'json' }` syntax.

## Running

Each folder is a separate npm project, so `npm install` has to be run in each one.

```bash
cd 1-money/node
npm install
npm test               # 9 tests: assert, Chai expect, Chai should
```

```bash
cd 2-factorial
npm install
npm test               # 5 tests
npm run coverage
```

```bash
cd 3-chess
npm install            # the first time, it also downloads the Cypress app
npm test               # 124 Mocha tests
npm run coverage       # text report
npm run report         # HTML report in coverage/index.html
npm run doc            # API documentation in docs/
npm run build          # dist/chess.js, used by the web interface
npm run serve          # the game at http://localhost:8080/web
```

The UI tests need the game to be built and served. In a first terminal:

```bash
cd 3-chess
npm run build
npm run serve
```

Then in a second terminal:

```bash
cd 3-chess
npx cypress open       # E2E testing, then Firefox, then the spec chess.cy.js
npx cypress run        # without the interface; HTML report in mochawesome-report/
```

http-server tells the browser to keep the files for one hour. After running `npm run build` again, reload the page with Ctrl+F5 to get the new `dist/chess.js`.

## Changes to the given code

`1-money/node`
- `test/test-money.js`: `m1` is declared in the test suite and created again before each test by `beforeEach()`.
- `test/test-money-expect.js`, `test/test-money-should.js`: the three tests written with Chai, in the `expect` and `should` styles. `chai` is added to the devDependencies.

`2-factorial`
- `src/factorial.js`: the implementation.
- `test/test-factorial.js`: `.only` removed once every test passed, so the whole suite runs, and "An negative" corrected to "A negative" in a test name.

`3-chess`
- `test/game.js`: `with { type: 'json' }` instead of `assert { type: 'json' }`, which Node 22 no longer accepts, and one test per action of `games/2022-03-07-game.json`.
- `test/chessboard.js`: tests of the pieces of ranks 1 and 8, and of the number of pieces.
- `test/pawn.js`: tests added for the white and black pawns. The test that was on line 28 is split in two tests with accurate names.
- `test/queen.js`: new tests of the queen.
- `src/queen.js`, `src/pawn.js`, `web/ui.js`: fixes of three bugs found by the tests, explained in `ANSWERS.md`.
- `cypress.config.js` and `cypress/e2e/chess.cy.js`: the UI tests. `cypress` and `mochawesome` (the reporter set in the configuration) are added to the devDependencies.
