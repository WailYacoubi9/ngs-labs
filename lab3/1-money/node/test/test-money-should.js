import Money from '../src/money.js';
import { should } from 'chai';

// should() adds the "should" property to every object
const chaiShould = should();

describe('Money (Chai should)', function () {
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
      m1.amount.should.equal(30.0);
    });

    it('should correctly add two moneys with different currencies', function () {
      // Given: a second money in USD
      let m2 = new Money(20.0, 'USD');

      // When: we add the amount of m2 to m1
      m1.add(m2);

      // Then: 20 USD are worth 10 EUR, so m1 should be worth 20 EUR
      m1.amount.should.equal(20.0);
      m1.currency.should.equal('EUR');
    });

    it('should throw an exception when the currency is neither EUR nor USD', function () {
      // Given: a second money in BRL
      let m2 = new Money(20.0, 'BRL');

      // When / Then: adding it throws, and m1 is left unchanged.
      // The function is passed to should.Throw, as shown in "Should Extras".
      chaiShould.Throw(() => m1.add(m2), 'Unknown currency');
      m1.amount.should.equal(10.0);
    });
  });
});
