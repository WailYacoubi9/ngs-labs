# Lab 3 – Answers

## 1. Test execution and hooks (1-money)

Once `m1` is created only once in the test suite, the second test fails with `AssertionError: 40 == 20`. The three tests share the same object, and `add()` modifies it: the first test leaves `m1` at 30 EUR, so the second test adds 20 USD (10 EUR) to 30 EUR instead of 10 EUR and gets 40. The third test still passes, because it only checks that an exception is thrown, whatever the amount of `m1`. The tests are no longer independent: the result of a test depends on the tests run before it.

Mocha offers four hooks. `before()` runs once before the first test of its `describe` block, and `after()` once after the last one. `beforeEach()` runs before every test of the block, and `afterEach()` after every test. To reset `m1`, the hook is `beforeEach()`: it creates a new `m1` worth 10 EUR before each test, which is the setup step of the life cycle of a test. With `before()`, `m1` would still be created only once and the second test would still fail.

## 2. Assertion libraries (1-money)

Chai is installed with `npm i --save-dev chai` (version 6.3.0). Since version 5, Chai is an ES module without a default export, so `import chai from 'chai'` from the lab statement fails with `SyntaxError: The requested module 'chai' does not provide an export named 'default'`. The tests import the functions they need instead: `import { expect } from 'chai'` and `import { should } from 'chai'`.

To check an exception, the function that throws must be passed to Chai, and not called: if the test called `m1.add(m2)` itself, the exception would be thrown before Chai could catch it.

- `expect`: `expect(() => m1.add(m2)).to.throw('Unknown currency');`
- `should`: `chaiShould.Throw(() => m1.add(m2), 'Unknown currency');`, where `chaiShould` is the object returned by `should()`. This is one of the "should extras".

These assertions also check the message of the exception. With `money.js` modified to throw `"Other"`, the test using `assert.throws()` still passes, while the two Chai tests fail.

Differences between `expect` and `should`:

- `expect(value)` is a function that wraps the value and starts the chain of assertions. It works with any value, including `null` and `undefined`, and it modifies nothing.
- `should()` has to be called once. It adds a `should` property to `Object.prototype`, so that every object can start a chain: `m1.amount.should.equal(30)`. It reads like a sentence, but it modifies a global prototype for every test file of the run, and it cannot be used on `null` or `undefined`, which have no prototype. This is why the extras `should.exist`, `should.equal` and `should.Throw` are called on the object returned by `should()`.

## 3. Test-driven development: factorial (2-factorial)

The tests were run one at a time by moving `.only` from one test to the next, and the code was only changed to make the current test pass.

| Step | Test run with `.only` | Result before the change | Change |
|---|---|---|---|
| 1 | `4! should give 24` | fails: `undefined == 24` (empty function) | a loop that multiplies `2 × 3 × … × i`, starting from 1 |
| 2 | `3! should give 6` | passes | none |
| 3 | `0! should give 1` | passes: the loop does not run and 1 is returned | none |
| 4 | negative number | fails: `Missing expected exception` (1 is returned) | throw an `Error` when `i < 0` |
| 5 | invalid inputs | fails: `Missing expected exception` (`factorial(1.2)`, `factorial()`, `factorial(null)` and `factorial('hello world')` return 1) | throw an `Error` when `!Number.isInteger(i)` |
| 6 | refactoring | | the two checks merged in one condition, `.only` removed: the 5 tests pass, 100% coverage |

`Number.isInteger()` returns `false` for 1.2, `undefined`, `null` and strings, so one check covers every invalid input.

## 4. Unit tests and code coverage (3-chess)

### Running the given tests

The given test suite does not start on Node 22: `test/game.js` imports the JSON file with `assert { type: 'json' }`, a syntax removed from Node 22 (`SyntaxError: Unexpected identifier 'assert'`). With the standard syntax `with { type: 'json' }`, 60 tests pass and 8 are pending (the skipped tests of rank 1).

### Coverage of `src/pawn.js`

With the given tests, `pawn.js` has 95.23% of statements, 87.5% of branches, 100% of functions and 95.23% of lines covered. What is not covered:

- lines 53-54, the `return false` of a move longer than 2 ranks or wider than 1 file: no test tried such a move along a free path;
- lines 69-70, the `return false` of a black pawn going up: no test moved a black pawn backward;
- line 26, in `isInInitialPosition()`: the check `this.rank === 7` of a black pawn was never evaluated, because the function is only called for a move of 2 ranks, and no black pawn made one.

Tests added to `test/pawn.js`, for the white pawn: moves of 3 ranks, of 2 cells in diagonal, sideways, a move of 2 ranks blocked by a piece, the capture of the piece in front of it (refused), of an ally in diagonal (refused), a capture with `move()`, and a move of 1 rank from a non-initial position. For the black pawn, the same cases in the other direction: 1 and 2 ranks forward, 3 ranks, backward, diagonal with and without a capture, the piece in front, sideways, and 2 ranks from a non-initial position. With `test/pawn.js` alone, `pawn.js` is now covered at 100% for the four metrics (32 tests).

### The test of line 28

Its label, "should have a valid movement", is not appropriate: it says the opposite of what the test checks. Both assertions check that invalid moves are refused: an L-shaped move from c2 to d4, and a move to rank -8, outside the chessboard. The test also mixes two cases, so a failure would not tell which one is wrong. Finally, both moves are refused by the general rules of `Piece.canMove()`, before the rules of the pawn are reached, which is why lines 53-54 stayed uncovered although the test looks like it tests moves that are too long. It is replaced by two tests: "should not be able to move in an L shape" and "should not be able to move outside the chessboard".

### Does 100% coverage mean that the code is bug-free?

No. Coverage measures which statements and branches the tests executed. It does not tell whether the tests checked the right result, nor whether every case of the rules was tried. With all the new pawn tests except the four "sideways" tests, the original `pawn.js` is covered at 100% and every test passes. Yet in the web interface, after d7-d5, the black pawn of c7 can be moved to d7: a black pawn can move, and capture, sideways.

The cause is in `canMove()`. `isGoingUp = rank - this.rank > 0` is `false` for a sideways move. For a white pawn the check is `!isGoingUp`, so a sideways move is refused. For a black pawn the check is `isGoingUp`, so a sideways move is treated like a move down and accepted. The fix in `src/pawn.js` adds `isGoingDown = rank - this.rank < 0` and refuses a black pawn's move when `!isGoingDown`. The three sideways tests of the black pawn (moving and capturing with `canMove()`, moving with `move()`) fail on the original code and pass after the fix.

`chessboard.js` shows the same limit: it was already covered at 100% before the tests of ranks 1 and 8 were written, because `init()` runs before every test, although nothing checked where the main pieces were placed.

### Test case generation (`test/chessboard.js`)

The `for` loop of lines 20 to 57 goes over the 8 files. For each file, it generates 4 tests for the empty cells of ranks 3 to 6, 1 test for the white pawn of rank 2 and 1 test for the black pawn of rank 7, so 8 × 6 = 48 tests. The tests are created when the file is loaded and run later, and each one uses the values of `file` and `rank` of its own iteration, because they are declared with `let` and `const` inside the loop.

The loop over `Constructors` is completed with one test for the white piece of rank 1 and one for the black piece of rank 8 (16 tests). A last test checks that the chessboard has 32 pieces, each with its own id. The file now has 65 tests.

### Tests generated from a previous game (`test/game.js`)

The JSON file is a list of actions. A `move` gives the color of the player, the start cell (`from`) and the target cell (`to`). A `capture` comes right after the move that took a piece, and gives the cell (`at`) and the color of the captured piece.

One test is generated per action, and all the tests share one chessboard, created in a `before()` hook and not `beforeEach()`: each test must start from the position left by the previous one. Here the dependency between tests is wanted, which is the opposite of the Money case. Mocha runs the tests in the order of the file, so the game is replayed in order.

- For a move, the test checks that it is this player's turn (white starts, then the players alternate), that a piece of the right color is on `from`, and that `canMove()` accepts the move. After `move()`, it checks that the piece is on `to` and that `from` is empty. It also checks that the move took a piece exactly when the next action of the trace is a capture.
- For a capture, the test uses the notifications of the pieces. In `before()`, an observer is subscribed to every piece and records the `CaptureNotification`s. The test checks that the captured piece has the color given by the action, that it was captured on `at`, that it is marked `isCaptured` and removed from the chessboard, and that a piece of the other color now stands on `at`.

On the original code, the 7th action fails: "the Queen at d8 cannot move to d6", and the next moves of the black queen fail too. The queen never moves because `src/queen.js` calls `super.canMove(this, rank, file)`: the queen itself is passed as the rank and the target rank as the file. In `Piece.canMove()`, the computations with the object give `NaN`, so the move is refused, except when the target rank is equal to the number of the queen's file. Then the loop that simulates the move step by step never ends, because the current rank is `NaN` and never reaches the target. In the web interface, grabbing the white queen on d1 and clicking a4, d4 or g4 freezes the page. The fix is `super.canMove(rank, file)`. `test/queen.js` checks the moves of the queen, including d1 to d4, a call that never returned on the original code.

With the two fixes, the 18 tests of the game pass: the trace is a valid game for this implementation.

### Coverage after the new tests

```
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   97.15 |    88.69 |   92.59 |   97.15 |
 src               |   97.66 |     92.3 |   91.66 |   97.66 |
  bishop.js        |     100 |       75 |     100 |     100 | 33
  chessboard.js    |     100 |      100 |     100 |     100 |
  color.js         |     100 |      100 |     100 |     100 |
  king.js          |   76.31 |      100 |      50 |   76.31 | 27-35
  knight.js        |   95.55 |    83.33 |     100 |   95.55 | 40-41
  pawn.js          |     100 |      100 |     100 |     100 |
  piece.js         |    98.8 |    90.24 |    87.5 |    98.8 | 150-152
  queen.js         |     100 |      100 |     100 |     100 |
  rook.js          |   95.45 |       60 |     100 |   95.45 | 39-40
 src/notifications |   93.25 |    54.54 |     100 |   93.25 |
  capture.js       |   93.33 |       50 |     100 |   93.33 | 24-25
  move.js          |   89.74 |       40 |     100 |   89.74 | 24-25,33-34
  notification.js  |     100 |      100 |     100 |     100 |
-------------------|---------|----------|---------|---------|-------------------
```

124 tests pass. The king, knight, rook and bishop are only exercised by the replay of the game, in which the king never moves. In `piece.js`, the lines of `subscribe()` and `unsubscribe()` were reported as uncovered with the given tests although they are preceded by `/* istanbul ignore next */`: c8 does not read Istanbul's comments (its own syntax is `/* c8 ignore next */`).

## 5. UI testing with Cypress (3-chess)

`cypress.config.js` is the configuration given in the course, with `supportFile: false` because the tests use no custom command. Cypress is installed with `npm i --save-dev cypress`, and `mochawesome` too, since the configuration uses it as reporter.

In `cypress/e2e/chess.cy.js`, a `beforeEach()` hook loads the interface before every test with `cy.visit('http://127.0.0.1:8080/web/')`. The address is `127.0.0.1` rather than `localhost` because http-server only listens on IPv4 addresses, and `localhost` can resolve to the IPv6 address `::1`.

A cell is selected with `#chessboard > div.rank:nth-child(9 - rank) > div:nth-child(file)`. The first row, at the top of the chessboard, is rank 8, so the row of rank r is 9 - r, and the column is the number of the file.

The first test grabs the white pawn of e2 and checks that its cell gets the class `active`, clicks on e4, then checks that e4 shows the icon `pawn_white.png`, that e2 is empty and no longer active, and that the history says "white Pawn moved from e2 to e4". The other tests check the initial position, a pawn move of 3 cells (refused), releasing a grabbed piece, a knight jumping over the pawns, a queen move, a black pawn moving sideways (refused), a capture, and the reset button.

Cypress loads the page again before each test, so the game of `games/2022-03-07-game.json` cannot be split into one test per action as in Mocha: the second test would start from the initial position. The whole game is replayed in a single test. `cy.readFile()` loads the JSON file. For each move, the test reads the icon on `from`, clicks on `from` then on `to`, and checks that the same icon is now on `to` and that `from` is empty. For each capture, it checks the history line "<color> <piece> at <cell> has been captured" and that the capturer stands on the cell. At the end, 28 pieces are left.

The UI tests found a third bug, in `web/ui.js`. If a piece is grabbed when the reset button is clicked, its cell stays green and the old piece is still grabbed (the variable `current`). The next click moves this old piece, which is no longer on the chessboard, and since the new piece of the same cell has the same id, its icon moves too: the board shows the pawn on e4 while the model still has it on e2. The fix in `reset()` removes the class `active` from the cells and sets `current` to `null`. The test "should release the grabbed piece when the game is reset" checks it.

The 11 UI tests pass on the fixed code. On the original code, 4 of them fail: the queen move, the black pawn moving sideways, the reset with a grabbed piece, and the replay of the game.

## 6. Other remarks

- The interface does not check whose turn it is: white can play twice in a row, and the "Player" indicator never changes.
- `Piece.unsubscribe()` removes the last observer when it is called with an observer that is not subscribed: `indexOf()` returns -1, and `splice(-1, 1)` removes the last element of the array.
