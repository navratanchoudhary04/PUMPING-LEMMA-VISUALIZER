/**
 * Custom Language Factory
 *
 * Creates a validator-compatible language object from:
 *   - A description string
 *   - An alphabet array
 *   - A validator function body (string) that receives `s` and returns boolean
 *
 * The validator body is compiled with `new Function('s', code)` inside try/catch.
 */

/**
 * @param {object} opts
 * @param {string}   opts.description   - Human-readable / LaTeX description
 * @param {string[]} opts.alphabet       - Array of valid characters, e.g. ['a','b']
 * @param {string}   opts.validatorCode  - Function body; receives arg `s`, returns boolean
 * @returns {{ lang: object|null, error: string|null }}
 */
export function buildCustomLanguage({ description, alphabet, validatorCode }) {
  // ── Compile the validator ───────────────────────────────
  let compiledFn = null;
  try {
    // Wrap the user code in a function that receives `s`
    // eslint-disable-next-line no-new-func
    compiledFn = new Function('s', validatorCode);
    // Quick smoke test — should not throw
    compiledFn('');
  } catch (e) {
    return { lang: null, error: `Validator error: ${e.message}` };
  }

  // ── Safe wrapper around the compiled function ───────────
  const safeFn = (str) => {
    try {
      const result = compiledFn(str);
      return Boolean(result);
    } catch {
      return false;
    }
  };

  // ── Smart generate: tries many patterns to find one ≥ p ─
  const safeGenerate = (p) => {
    const a = alphabet[0] || 'a';
    const b = alphabet[1] || '';
    const c = alphabet[2] || '';

    // Try typical educational patterns
    for (let n = 1; n <= 30; n++) {
      const candidates = [
        a.repeat(n) + b.repeat(n) + c.repeat(n),    // aⁿbⁿcⁿ
        a.repeat(n) + b.repeat(n),                   // aⁿbⁿ
        a.repeat(n * n),                             // aⁿ²
        a.repeat(n) + b.repeat(n) + b.repeat(n) + a.repeat(n), // palindrome-like
        a.repeat(2 * n) + b.repeat(2 * n),           // 2n variant
      ];
      for (const cand of candidates) {
        if (cand.length >= p && safeFn(cand)) return cand;
      }
    }
    // Last resort: return something of length p using first alphabet symbol
    return (alphabet[0] || 'a').repeat(p);
  };

  // ── Build LaTeX display string ──────────────────────────
  const latexDesc = description
    ? description.replace(/aⁿ/g, 'a^n').replace(/bⁿ/g, 'b^n').replace(/cⁿ/g, 'c^n')
    : 'L = \\{\\text{custom}\\}';

  const lang = {
    id: 'custom',
    name: 'Custom',
    displayName: description || 'Custom',
    latex: latexDesc,
    description: description || 'User-defined language',
    alphabet: alphabet.length > 0 ? alphabet : ['a'],
    validate: safeFn,
    generate: safeGenerate,
    explanation: `Custom language defined by user-supplied validator.`,
    validationHint: description || 'Must satisfy the user-defined membership condition',
    validatorCode,
  };

  return { lang, error: null };
}

/**
 * Test a custom validator code string on a specific string.
 * Returns { result: boolean|null, error: string|null }
 */
export function testCustomValidator(validatorCode, testString) {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('s', validatorCode);
    const result = Boolean(fn(testString));
    return { result, error: null };
  } catch (e) {
    return { result: null, error: e.message };
  }
}
