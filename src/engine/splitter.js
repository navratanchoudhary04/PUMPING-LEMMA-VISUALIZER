/**
 * Pumping Lemma — Exhaustive Splitter v2.0
 *
 * Generates all valid partitions s = xyz satisfying:
 *   1. |xy| ≤ p  (prefix constraint)
 *   2. |y| ≥ 1   (non-emptiness)
 *
 * Also precomputes contradictingI for each split.
 */

/**
 * @param {string} s - Input string
 * @param {number} p - Pumping length
 * @param {function} validator - (str) => boolean — language membership
 * @returns {Array<{x,y,z,xLen,yLen,zLen,id,contradictingI,isContradicted}>}
 */
export function generateValidSplits(s, p, validator = null) {
  const splits = [];
  const n = s.length;
  let id = 0;

  for (let xLen = 0; xLen <= Math.min(p - 1, n); xLen++) {
    const maxYLen = Math.min(p - xLen, n - xLen);
    for (let yLen = 1; yLen <= maxYLen; yLen++) {
      const x = s.substring(0, xLen);
      const y = s.substring(xLen, xLen + yLen);
      const z = s.substring(xLen + yLen);
      const zLen = z.length;

      // Precompute contradicting i — try 0, 2, 3, 4, ... up to 20
      let contradictingI = null;
      if (validator) {
        const testOrders = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20];
        for (const i of testOrders) {
          const pumped = x + y.repeat(i) + z;
          let inL = true;
          try { inL = validator(pumped); } catch { inL = false; }
          if (!inL) { contradictingI = i; break; }
        }
      }

      splits.push({
        id: id++,
        x, y, z,
        xLen, yLen, zLen,
        contradictingI,
        isContradicted: contradictingI !== null,
      });
    }
  }

  return splits;
}

/**
 * Pump a split: construct xy^i z
 * @param {string} x
 * @param {string} y
 * @param {string} z
 * @param {number} i - pump power (≥ 0)
 * @returns {string}
 */
export function pumpString(x, y, z, i) {
  return x + y.repeat(i) + z;
}
