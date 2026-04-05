/**
 * Pumping Lemma - Exhaustive Splitter Algorithm
 * 
 * Generates all valid partitions s = xyz satisfying:
 *   1. |xy| ≤ p  (prefix constraint)
 *   2. |y| ≥ 1   (non-emptiness constraint)
 * 
 * @param {string} s - The input string
 * @param {number} p - The pumping length
 * @returns {Array<{x: string, y: string, z: string, xLen: number, yLen: number}>}
 */
export function generateValidSplits(s, p) {
  const splits = [];
  const n = s.length;

  // x = s[0..xLen-1], y = s[xLen..xLen+yLen-1], z = s[xLen+yLen..n-1]
  // Constraints: xLen + yLen <= p, yLen >= 1, xLen >= 0

  for (let xLen = 0; xLen <= Math.min(p - 1, n); xLen++) {
    // yLen must be at least 1, and xLen + yLen <= p
    const maxYLen = Math.min(p - xLen, n - xLen);

    for (let yLen = 1; yLen <= maxYLen; yLen++) {
      const x = s.substring(0, xLen);
      const y = s.substring(xLen, xLen + yLen);
      const z = s.substring(xLen + yLen);

      splits.push({ x, y, z, xLen, yLen });
    }
  }

  return splits;
}

/**
 * Pump a split: construct xy^i z
 * 
 * @param {string} x - The x segment
 * @param {string} y - The y segment (pumped)
 * @param {string} z - The z segment
 * @param {number} i - The pump power (i ≥ 0)
 * @returns {string} The pumped string xy^iz
 */
export function pumpString(x, y, z, i) {
  return x + y.repeat(i) + z;
}
