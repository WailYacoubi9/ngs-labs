/**
 * CSS selector of the cell at a given rank and file.
 * The first row of the chessboard (at the top) is rank 8, so the row is 9 - rank.
 * @param {number} rank - the rank, from 1 (bottom) to 8 (top).
 * @param {number} file - the file, from 1 (a) to 8 (h).
 * @return {string} the selector of the cell.
 */
const cell = function (rank, file) {
  return `#chessboard > div.rank:nth-child(${9 - rank}) > div:nth-child(${file})`;
};

/**
 * Source of the icon of a piece, as set in web/ui.js.
 * @param {string} name - the name of the piece, for example 'pawn'.
 * @param {string} color - 'white' or 'black'.
 * @return {string} the src attribute of the icon.
 */
const icon = function (name, color) {
  return `assets/img/icons/${name}_${color}.png`;
};

/**
 * Name of a cell, for example "e2" for { rank: 2, file: 5 }.
 * @param {Object} pos - a position with a rank and a file.
 * @return {string} the name of the cell.
 */
const cellName = function (pos) {
  return `${String.fromCharCode(97 - 1 + pos.file)}${pos.rank}`;
};

/**
 * Click on the piece to move, then on the cell where it goes.
 * @param {Object} from - the position of the piece.
 * @param {Object} to - the target position.
 */
const play = function (from, to) {
  cy.get(cell(from.rank, from.file)).click();
  cy.get(cell(to.rank, to.file)).click();
};

/**
 * Text of the lines of the history panel, without the extra spaces and line breaks.
 * @param {Object} $lines - the paragraphs of the history panel.
 * @return {Array.<string>} one string per line.
 */
const texts = function ($lines) {
  return [...$lines].map((line) => line.textContent.replace(/\s+/g, ' ').trim());
};

describe('Chess game', function () {
  // Load the interface before every test.
  // 127.0.0.1 and not localhost: http-server only listens on IPv4 addresses.
  beforeEach(function () {
    cy.visit('http://127.0.0.1:8080/web/');
  });

  it('should display the 32 pieces at their initial position', function () {
    cy.get('#chessboard img').should('have.length', 32);
    cy.get(cell(1, 4)).find('img').should('have.attr', 'src', icon('queen', 'white'));
    cy.get(cell(8, 5)).find('img').should('have.attr', 'src', icon('king', 'black'));
    cy.get(cell(2, 1)).find('img').should('have.attr', 'src', icon('pawn', 'white'));
  });

  it('should move a white pawn from e2 to e4', function () {
    // Given: the white pawn on e2 is grabbed
    cy.get(cell(2, 5)).click().should('have.class', 'active');

    // When: we click on e4, an empty cell the pawn can reach
    cy.get(cell(4, 5)).click();

    // Then: the pawn is on e4, e2 is empty, and the move is in the history
    cy.get(cell(4, 5)).find('img').should('have.attr', 'src', icon('pawn', 'white'));
    cy.get(cell(2, 5)).should('not.have.class', 'active').find('img').should('not.exist');
    cy.get('#history div p').should(($lines) => {
      expect(texts($lines)).to.deep.equal(['white Pawn moved from e2 to e4']);
    });
  });

  it('should not move a white pawn 3 cells forward', function () {
    play({ rank: 2, file: 5 }, { rank: 5, file: 5 });

    cy.get(cell(5, 5)).find('img').should('not.exist');
    cy.get(cell(2, 5)).should('have.class', 'active').find('img').should('have.attr', 'src', icon('pawn', 'white'));
    cy.get('#history div p').should('not.exist');
  });

  it('should release a grabbed piece when it is clicked again', function () {
    cy.get(cell(2, 5)).click().should('have.class', 'active');
    cy.get(cell(2, 5)).click().should('not.have.class', 'active');
  });

  it('should let a knight jump over the pawns', function () {
    play({ rank: 1, file: 2 }, { rank: 3, file: 3 });

    cy.get(cell(3, 3)).find('img').should('have.attr', 'src', icon('knight', 'white'));
    cy.get(cell(1, 2)).find('img').should('not.exist');
  });

  it('should move the queen in diagonal', function () {
    play({ rank: 2, file: 5 }, { rank: 3, file: 5 }); // e2-e3 frees the diagonal
    play({ rank: 1, file: 4 }, { rank: 5, file: 8 }); // queen from d1 to h5

    cy.get(cell(5, 8)).find('img').should('have.attr', 'src', icon('queen', 'white'));
    cy.get(cell(1, 4)).find('img').should('not.exist');
  });

  it('should not move a black pawn sideways', function () {
    play({ rank: 7, file: 4 }, { rank: 5, file: 4 }); // d7-d5 frees d7
    play({ rank: 7, file: 3 }, { rank: 7, file: 4 }); // c7 to d7 is not allowed

    cy.get(cell(7, 3)).find('img').should('have.attr', 'src', icon('pawn', 'black'));
    cy.get(cell(7, 4)).find('img').should('not.exist');
  });

  it('should capture a black pawn with a white pawn', function () {
    play({ rank: 2, file: 5 }, { rank: 4, file: 5 }); // e2-e4
    play({ rank: 7, file: 4 }, { rank: 5, file: 4 }); // d7-d5
    play({ rank: 4, file: 5 }, { rank: 5, file: 4 }); // e4 takes d5

    cy.get(cell(5, 4)).find('img').should('have.length', 1).and('have.attr', 'src', icon('pawn', 'white'));
    cy.get(cell(4, 5)).find('img').should('not.exist');
    cy.get(`#chessboard img[src="${icon('pawn', 'black')}"]`).should('have.length', 7);
    cy.get('#history div p').should(($lines) => {
      expect(texts($lines)).to.include('black Pawn at d5 has been captured');
    });
  });

  it('should put the pieces back at their initial position when the game is reset', function () {
    play({ rank: 2, file: 5 }, { rank: 4, file: 5 });
    cy.get('#reset-btn').click();

    cy.get('#chessboard img').should('have.length', 32);
    cy.get(cell(2, 5)).find('img').should('have.attr', 'src', icon('pawn', 'white'));
    cy.get(cell(4, 5)).find('img').should('not.exist');
    cy.get('#history div p').should('not.exist');
  });

  it('should release the grabbed piece when the game is reset', function () {
    // Given: a piece is grabbed when the reset button is clicked
    cy.get(cell(2, 5)).click();
    cy.get('#reset-btn').click();

    // When: we click on a cell where this piece could have gone
    cy.get(cell(4, 5)).click();

    // Then: nothing moves
    cy.get(cell(2, 5)).should('not.have.class', 'active').find('img').should('exist');
    cy.get(cell(4, 5)).find('img').should('not.exist');
    cy.get('#history div p').should('not.exist');
  });

  // The page is loaded again before every test, so the whole game
  // is replayed and checked inside a single test.
  it('should replay the game of 2022-03-07', function () {
    cy.readFile('games/2022-03-07-game.json').then((game) => {
      let captures = 0;

      game.forEach((action) => {
        if (action.type === 'move') {
          const from = cell(action.from.rank, action.from.file),
            to = cell(action.to.rank, action.to.file);

          // The icon tells which piece moves, so we can look for it on the target cell
          cy.get(from)
            .find('img')
            .invoke('attr', 'src')
            .then((src) => {
              expect(src).to.match(new RegExp(`_${action.color}\\.png$`));

              play(action.from, action.to);

              cy.get(to).find('img').should('have.length', 1).and('have.attr', 'src', src);
              cy.get(from).find('img').should('not.exist');
            });
        } else {
          captures++;
          const count = captures,
            at = cellName(action.at);

          // The captured piece is in the history, and the capturer stands on its cell
          cy.get('#history div p').should(($lines) => {
            const captured = texts($lines).filter((line) => line.endsWith('has been captured'));

            expect(captured).to.have.length(count);
            expect(captured[count - 1]).to.match(new RegExp(`^${action.color} \\w+ at ${at} has been captured$`));
          });
          cy.get(cell(action.at.rank, action.at.file))
            .find('img')
            .should('have.length', 1)
            .invoke('attr', 'src')
            .should('not.match', new RegExp(`_${action.color}\\.png$`));
        }
      });

      cy.get('#chessboard img').should('have.length', 32 - captures);
    });
  });
});
