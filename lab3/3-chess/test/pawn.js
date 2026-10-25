import assert from 'assert';
import Color from '../src/color.js';
import Chessboard from '../src/chessboard.js';
import Pawn from '../src/pawn.js';

describe('White pawn', function () {
  describe('#canMove() from its initial position', function () {
    let chessboard, pawn;

    beforeEach(function () {
      chessboard = new Chessboard();
      pawn = new Pawn({
        chessboard: chessboard,
        color: Color.WHITE,
        rank: 2,
        file: 3
      });
      chessboard.pieces.push(pawn);
    });

    it('should be able to move forward 1 rank', function () {
      const output = pawn.canMove(pawn.rank + 1, pawn.file),
        oracle = true;

      assert.equal(output, oracle);
    });

    // These two tests replace the test "should have a valid movement",
    // whose label said the opposite of what it checked.
    it('should not be able to move in an L shape', function () {
      const output = pawn.canMove(pawn.rank + 2, pawn.file + 1),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should not be able to move outside the chessboard', function () {
      const output = pawn.canMove(pawn.rank - 10, pawn.file),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should not be able to move in diagonal (when not capturing)', function () {
      const output = pawn.canMove(pawn.rank + 1, pawn.file + 1),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should be able to move in diagonal when capturing', function () {
      const blackPawn = new Pawn({
        chessboard: chessboard,
        color: Color.BLACK,
        rank: 3,
        file: 4
      });
      chessboard.pieces.push(blackPawn);

      const output = pawn.canMove(pawn.rank + 1, pawn.file + 1),
        oracle = true;

      assert.equal(output, oracle);
    });

    it('should not be able to capture an ally in diagonal', function () {
      const whitePawn = new Pawn({
        chessboard: chessboard,
        color: Color.WHITE,
        rank: 3,
        file: 4
      });
      chessboard.pieces.push(whitePawn);

      const output = pawn.canMove(pawn.rank + 1, pawn.file + 1),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should not be able to capture the piece in front of it', function () {
      const blackPawn = new Pawn({
        chessboard: chessboard,
        color: Color.BLACK,
        rank: 3,
        file: 3
      });
      chessboard.pieces.push(blackPawn);

      const output = pawn.canMove(pawn.rank + 1, pawn.file),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should be able to move forward 2 ranks from its initial position', function () {
      const output = pawn.canMove(pawn.rank + 2, pawn.file),
        oracle = true;

      assert.equal(output, oracle);
    });

    it('should not be able to move forward 2 ranks when a piece blocks the way', function () {
      const blackPawn = new Pawn({
        chessboard: chessboard,
        color: Color.BLACK,
        rank: 3,
        file: 3
      });
      chessboard.pieces.push(blackPawn);

      const output = pawn.canMove(pawn.rank + 2, pawn.file),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should not be able to move forward 3 ranks', function () {
      const output = pawn.canMove(pawn.rank + 3, pawn.file),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should not be able to move 2 ranks in diagonal', function () {
      const output = pawn.canMove(pawn.rank + 2, pawn.file + 2),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should not be able to move sideways', function () {
      const output = pawn.canMove(pawn.rank, pawn.file + 1),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should not be able to move backward 1 rank', function () {
      const output = pawn.canMove(pawn.rank - 1, pawn.file),
        oracle = false;

      assert.equal(output, oracle);
    });
  });

  describe('#move() from its initial position', function () {
    let chessboard, pawn, rank, file;

    beforeEach(function () {
      chessboard = new Chessboard();
      pawn = new Pawn({
        chessboard: chessboard,
        color: Color.WHITE,
        rank: 2,
        file: 3
      });

      chessboard.pieces.push(pawn);

      rank = pawn.rank;
      file = pawn.file;
    });

    it('should be able to move forward 1 rank', function () {
      const oracle = { rank: rank + 1, file: file };

      pawn.move(rank + 1, file);

      assert.equal(pawn.rank, oracle.rank);
      assert.equal(pawn.file, oracle.file);
    });

    it('should not be able to move in diagonal (when not capturing)', function () {
      const oracle = { rank: rank, file: file };

      pawn.move(rank + 1, file + 1);

      assert.equal(pawn.rank, oracle.rank);
      assert.equal(pawn.file, oracle.file);
    });

    it('should be able to move forward 2 ranks from its initial position', function () {
      const oracle = { rank: rank + 2, file: file };

      pawn.move(rank + 2, file);

      assert.equal(pawn.rank, oracle.rank);
      assert.equal(pawn.file, oracle.file);
    });

    it('should not be able to move backward 1 rank', function () {
      const oracle = { rank: rank, file: file };

      pawn.move(rank - 1, file);

      assert.equal(pawn.rank, oracle.rank);
      assert.equal(pawn.file, oracle.file);
    });

    it('should capture an opponent piece in diagonal', function () {
      const blackPawn = new Pawn({
        chessboard: chessboard,
        color: Color.BLACK,
        rank: 3,
        file: 4
      });
      chessboard.pieces.push(blackPawn);

      pawn.move(rank + 1, file + 1);

      assert.equal(pawn.rank, rank + 1);
      assert.equal(pawn.file, file + 1);
      assert.equal(blackPawn.isCaptured, true);
      assert.equal(chessboard.pieces.includes(blackPawn), false);
    });
  });

  describe('#canMove() from a non-initial position', function () {
    let chessboard, pawn;

    beforeEach(function () {
      chessboard = new Chessboard();
      pawn = new Pawn({
        chessboard: chessboard,
        color: Color.WHITE,
        rank: 3,
        file: 3
      });
    });

    it('should not be able to move forward 2 ranks from a non-initial position', function () {
      const output = pawn.canMove(pawn.rank + 2, pawn.file),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should still be able to move forward 1 rank', function () {
      const output = pawn.canMove(pawn.rank + 1, pawn.file),
        oracle = true;

      assert.equal(output, oracle);
    });
  });
});

describe('Black pawn', function () {
  describe('#canMove() from its initial position', function () {
    let chessboard, pawn;

    beforeEach(function () {
      chessboard = new Chessboard();
      pawn = new Pawn({
        chessboard: chessboard,
        color: Color.BLACK,
        rank: 7,
        file: 3
      });
      chessboard.pieces.push(pawn);
    });

    it('should be able to move forward 1 rank (decreasing)', function () {
      const output = pawn.canMove(pawn.rank - 1, pawn.file),
        oracle = true;

      assert.equal(output, oracle);
    });

    it('should be able to move forward 2 ranks from its initial position', function () {
      const output = pawn.canMove(pawn.rank - 2, pawn.file),
        oracle = true;

      assert.equal(output, oracle);
    });

    it('should not be able to move forward 3 ranks', function () {
      const output = pawn.canMove(pawn.rank - 3, pawn.file),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should not be able to move backward 1 rank (increasing)', function () {
      const output = pawn.canMove(pawn.rank + 1, pawn.file),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should not be able to move in diagonal (when not capturing)', function () {
      const output = pawn.canMove(pawn.rank - 1, pawn.file + 1),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should be able to move in diagonal when capturing', function () {
      const whitePawn = new Pawn({
        chessboard: chessboard,
        color: Color.WHITE,
        rank: 6,
        file: 4
      });
      chessboard.pieces.push(whitePawn);

      const output = pawn.canMove(pawn.rank - 1, pawn.file + 1),
        oracle = true;

      assert.equal(output, oracle);
    });

    it('should not be able to capture the piece in front of it', function () {
      const whitePawn = new Pawn({
        chessboard: chessboard,
        color: Color.WHITE,
        rank: 6,
        file: 3
      });
      chessboard.pieces.push(whitePawn);

      const output = pawn.canMove(pawn.rank - 1, pawn.file),
        oracle = false;

      assert.equal(output, oracle);
    });

    // Bug in the original code: a black pawn could move and capture sideways
    it('should not be able to move sideways', function () {
      const output = pawn.canMove(pawn.rank, pawn.file + 1),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should not be able to capture sideways', function () {
      const whitePawn = new Pawn({
        chessboard: chessboard,
        color: Color.WHITE,
        rank: 7,
        file: 4
      });
      chessboard.pieces.push(whitePawn);

      const output = pawn.canMove(pawn.rank, pawn.file + 1),
        oracle = false;

      assert.equal(output, oracle);
    });
  });

  describe('#move() from its initial position', function () {
    let chessboard, pawn, rank, file;

    beforeEach(function () {
      chessboard = new Chessboard();
      pawn = new Pawn({
        chessboard: chessboard,
        color: Color.BLACK,
        rank: 7,
        file: 3
      });

      chessboard.pieces.push(pawn);

      rank = pawn.rank;
      file = pawn.file;
    });

    it('should be able to move forward 2 ranks (decreasing)', function () {
      const oracle = { rank: rank - 2, file: file };

      pawn.move(rank - 2, file);

      assert.equal(pawn.rank, oracle.rank);
      assert.equal(pawn.file, oracle.file);
    });

    it('should not be able to move sideways', function () {
      const oracle = { rank: rank, file: file };

      pawn.move(rank, file - 1);

      assert.equal(pawn.rank, oracle.rank);
      assert.equal(pawn.file, oracle.file);
    });
  });

  describe('#canMove() from a non-initial position', function () {
    let chessboard, pawn;

    beforeEach(function () {
      chessboard = new Chessboard();
      pawn = new Pawn({
        chessboard: chessboard,
        color: Color.BLACK,
        rank: 6,
        file: 3
      });
    });

    it('should not be able to move forward 2 ranks from a non-initial position', function () {
      const output = pawn.canMove(pawn.rank - 2, pawn.file),
        oracle = false;

      assert.equal(output, oracle);
    });
  });
});
