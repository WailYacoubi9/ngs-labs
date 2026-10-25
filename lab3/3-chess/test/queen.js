import assert from 'assert';
import Color from '../src/color.js';
import Chessboard from '../src/chessboard.js';
import Pawn from '../src/pawn.js';
import Queen from '../src/queen.js';

describe('Queen', function () {
  describe('#canMove() from d1', function () {
    let chessboard, queen;

    beforeEach(function () {
      chessboard = new Chessboard();
      queen = new Queen({
        chessboard: chessboard,
        color: Color.WHITE,
        rank: 1,
        file: 4
      });
      chessboard.pieces.push(queen);
    });

    it('should be able to move vertically', function () {
      const output = queen.canMove(5, 4),
        oracle = true;

      assert.equal(output, oracle);
    });

    it('should be able to move horizontally', function () {
      const output = queen.canMove(1, 8),
        oracle = true;

      assert.equal(output, oracle);
    });

    it('should be able to move in diagonal', function () {
      const output = queen.canMove(3, 6),
        oracle = true;

      assert.equal(output, oracle);
    });

    // In the original code, this call never returned (infinite loop)
    it('should be able to move to d4, a rank equal to its file', function () {
      const output = queen.canMove(4, 4),
        oracle = true;

      assert.equal(output, oracle);
    });

    it('should not be able to move in an L shape', function () {
      const output = queen.canMove(3, 5),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should not be able to jump over a piece', function () {
      const whitePawn = new Pawn({
        chessboard: chessboard,
        color: Color.WHITE,
        rank: 2,
        file: 4
      });
      chessboard.pieces.push(whitePawn);

      const output = queen.canMove(5, 4),
        oracle = false;

      assert.equal(output, oracle);
    });

    it('should be able to capture an opponent piece', function () {
      const blackPawn = new Pawn({
        chessboard: chessboard,
        color: Color.BLACK,
        rank: 5,
        file: 4
      });
      chessboard.pieces.push(blackPawn);

      const output = queen.canMove(5, 4),
        oracle = true;

      assert.equal(output, oracle);
    });

    it('should not be able to capture an ally piece', function () {
      const whitePawn = new Pawn({
        chessboard: chessboard,
        color: Color.WHITE,
        rank: 5,
        file: 4
      });
      chessboard.pieces.push(whitePawn);

      const output = queen.canMove(5, 4),
        oracle = false;

      assert.equal(output, oracle);
    });
  });

  describe('#move() from d1', function () {
    it('should move to h5 in diagonal', function () {
      const chessboard = new Chessboard(),
        queen = new Queen({
          chessboard: chessboard,
          color: Color.WHITE,
          rank: 1,
          file: 4
        });
      chessboard.pieces.push(queen);

      queen.move(5, 8);

      assert.equal(queen.rank, 5);
      assert.equal(queen.file, 8);
    });
  });
});
