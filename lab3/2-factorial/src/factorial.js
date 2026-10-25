/**
 * Return the factorial of i.
 * @param {number} i - an integer number.
 * @return {number} the factorial of i.
 * @throws {Error} if i is not an integer greater than or equal to 0.
 */
export const factorial = function (i) {
  // 0, 1, 2, ... are the only valid inputs
  if (!Number.isInteger(i) || i < 0) {
    throw new Error(`factorial expects an integer >= 0, got ${String(i)}`);
  }

  // i! = 1 * 2 * ... * i, and the loop does not run for 0 and 1
  let result = 1;
  for (let k = 2; k <= i; k++) {
    result *= k;
  }
  return result;
};

export default factorial;
