import * as game from '../games/2022-03-07-game.json' with { type: 'json' };
import assert from 'assert';
import Color from '../src/color.js';
import Chessboard from '../src/chessboard.js';
import CaptureNotification from '../src/notifications/capture.js';

/**
 * From a file number, get the corresponding letter.
 * Rank are 1-indexed.
 * Letters are 97-indexed to get lower-alpha characters.
 * @param {number} file - the file in its number representation.
 * @return {string} returns the file in its string representation.
 */
const convertFileToString = function (file) {
  return String.fromCharCode(97 - 1 + file);
};

/**
 * Name of a cell, for example "d5" for { rank: 5, file: 4 }.
 * @param {Object} pos - a position with a rank and a file.
 * @return {string} the name of the cell.
 */
const cellName = function (pos) {
  return `${convertFileToString(pos.file)}${pos.rank}`;
};

describe('Game', function () {
  let chessboard;

  // Pieces captured during the game, in the order the pieces notified it
  const captures = [];

  // before() and not beforeEach(): the tests replay the game one action at a
  // time, so each test needs the chessboard left by the previous one.
  before(function () {
    chessboard = new Chessboard();
    chessboard.init();

    chessboard.pieces.forEach((piece) => {
      piece.subscribe({
        notify: (captured, notification) => {
          if (notification instanceof CaptureNotification) {
            captures.push({ piece: captured, pos: notification.pos });
          }
        }
      });
    });
  });

  describe('#move and #capture', function () {
    // White plays first, then the players take turns
    let turn = Color.WHITE;

    game.default.forEach((action, index) => {
      if (action.type === 'move') {
        const from = cellName(action.from),
          to = cellName(action.to),
          next = game.default[index + 1],
          isCapture = next !== undefined && next.type === 'capture',
          player = turn;

        turn = turn === Color.WHITE ? Color.BLACK : Color.WHITE;

        it(`${action.color} should move from ${from} to ${to}`, function () {
          const piece = chessboard.getPiece(action.from.rank, action.from.file);

          assert.equal(action.color, player, `it is ${player}'s turn`);
          assert.notEqual(piece, null, `no piece at ${from}`);
          assert.equal(piece.color, action.color);
          assert.equal(
            piece.canMove(action.to.rank, action.to.file),
            true,
            `the ${piece.constructor.name} at ${from} cannot move to ${to}`
          );

          piece.move(action.to.rank, action.to.file);

          assert.equal(chessboard.getPiece(action.to.rank, action.to.file), piece);
          assert.equal(chessboard.getPiece(action.from.rank, action.from.file), null);

          // A move takes a piece exactly when the next action of the trace is a capture
          assert.equal(captures.length, isCapture ? 1 : 0);
        });
      } else {
        const at = cellName(action.at);

        it(`${action.color} piece should be captured at ${at}`, function () {
          // The capture was notified during the previous move
          const capture = captures.shift();

          assert.notEqual(capture, undefined, `no piece was captured at ${at}`);
          assert.equal(capture.piece.color, action.color);
          assert.deepEqual(capture.pos, action.at);
          assert.equal(capture.piece.isCaptured, true);
          assert.equal(chessboard.pieces.includes(capture.piece), false);

          const capturer = chessboard.getPiece(action.at.rank, action.at.file);
          assert.notEqual(capturer.color, action.color);
        });
      }
    });
  });
});
