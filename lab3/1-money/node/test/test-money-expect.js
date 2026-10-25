import Money from '../src/money.js';
import { expect } from 'chai';

describe('Money (Chai expect)', function () {
  describe('#add()', function () {
    let m1;

    beforeEach(function () {
      m1 = new Money(10.0, 'EUR');
    });

    it('should correctly add two moneys with the same currency', function () {
      // Given: a second money in EUR
      let m2 = new Money(20.0, 'EUR');

      // When: we add the amount of m2 to m1
      m1.add(m2);

      // Then: the new amount of m1 should be 30
      expect(m1.amount).to.equal(30.0);
    });

    it('should correctly add two moneys with different currencies', function () {
      // Given: a second money in USD
      let m2 = new Money(20.0, 'USD');

      // When: we add the amount of m2 to m1
      m1.add(m2);

      // Then: 20 USD are worth 10 EUR, so m1 should be worth 20 EUR
      expect(m1.amount).to.equal(20.0);
      expect(m1.currency).to.equal('EUR');
    });

    it('should throw an exception when the currency is neither EUR nor USD', function () {
      // Given: a second money in BRL
      let m2 = new Money(20.0, 'BRL');

      // When / Then: adding it throws, and m1 is left unchanged
      expect(() => m1.add(m2)).to.throw('Unknown currency');
      expect(m1.amount).to.equal(10.0);
    });
  });
});
