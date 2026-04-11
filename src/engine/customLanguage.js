/**
 * Custom Language Engine v2.0
 *
 * Supports:
 *  - JS validator code (with helper injection)
 *  - Regex mode
 *  - Template-based presets
 */

import { isPrime, isPerfectSquare, isFactorial } from './validators';

// ── Helper functions injected into user validator scope ──────────────
const HELPERS = {
  countChar: (s, c) => s.split('').filter(ch => ch === c).length,
  isPrime,
  isPerfectSquare,
  isFactorial,
  allSame: (s) => s.length > 0 && s.split('').every(c => c === s[0]),
  isOrdered: (s, ...chars) => {
    let idx = 0;
    for (const c of s) {
      while (idx < chars.length && chars[idx] !== c) idx++;
      if (idx >= chars.length) return false;
    }
    return true;
  },
};

/**
 * Safely execute user-provided validator code.
 * Returns { result: boolean, error: string|null }
 */
export function testCustomValidator(code, str) {
  try {
    const fn = new Function(
      's',
      'countChar', 'isPrime', 'isPerfectSquare', 'isFactorial', 'allSame', 'isOrdered',
      code
    );
    const result = fn(
      str,
      HELPERS.countChar, HELPERS.isPrime, HELPERS.isPerfectSquare,
      HELPERS.isFactorial, HELPERS.allSame, HELPERS.isOrdered
    );
    return { result: Boolean(result), error: null };
  } catch (err) {
    return { result: false, error: err.message };
  }
}

/**
 * Build a custom language object from user inputs.
 * Returns { lang, error }
 */
export function buildCustomLanguage({ description, alphabet, validatorCode, isRegular = false, theoryNote = '' }) {
  if (!description.trim()) return { lang: null, error: 'Description is required.' };
  if (!alphabet || alphabet.length === 0) return { lang: null, error: 'Alphabet must have at least one symbol.' };
  if (!validatorCode.trim()) return { lang: null, error: 'Validator code is required.' };

  // Test that the code compiles
  try {
    new Function('s', 'countChar', 'isPrime', 'isPerfectSquare', 'isFactorial', 'allSame', 'isOrdered', validatorCode);
  } catch (err) {
    return { lang: null, error: `Syntax error: ${err.message}` };
  }

  const lang = {
    id: 'custom',
    name: description,
    displayName: 'Custom',
    latex: `L = \\{\\text{${description}}\\}`,
    description,
    alphabet,
    isRegular,
    theoryNote,
    validate(s) {
      return testCustomValidator(validatorCode, s).result;
    },
    generate(p) {
      return alphabet[0].repeat(p + 1);
    },
    explanation: `Custom validator: ${validatorCode.slice(0, 80)}...`,
    validationHint: description,
  };

  return { lang, error: null };
}

/**
 * Build a custom language from a regex string.
 */
export function buildRegexLanguage({ description, alphabet, regexStr, isRegular = true }) {
  let regex;
  try {
    regex = new RegExp(regexStr);
  } catch (err) {
    return { lang: null, error: `Invalid regex: ${err.message}` };
  }

  const lang = {
    id: 'custom',
    name: description || `/${regexStr}/`,
    displayName: 'Custom (Regex)',
    latex: `L = \\{w \\mid w \\text{ matches } /${regexStr}/\\}`,
    description: description || `Strings matching /${regexStr}/`,
    alphabet: alphabet || ['a', 'b'],
    isRegular,
    theoryNote: isRegular
      ? 'This is a regular language — pumping keeps strings in L.'
      : 'User-declared non-regular.',
    validate: (s) => regex.test(s),
    generate: (p) => (alphabet || ['a'])[0].repeat(p + 1),
    explanation: `Validates using regex: /${regexStr}/`,
    validationHint: `Must match /${regexStr}/`,
  };

  return { lang, error: null };
}

// ── Template catalogue ────────────────────────────────────────────────

export const CUSTOM_TEMPLATES = [
  // NON-REGULAR
  {
    id: 'tpl_anbn',
    label: 'aⁿbⁿ',
    category: 'Non-Regular',
    description: 'L = { aⁿbⁿ | n ≥ 1 }',
    alphabet: 'a, b',
    isRegular: false,
    theoryNote: 'Pumping y (in a-prefix) changes #a\'s ≠ #b\'s → contradiction.',
    code: `const as = countChar(s, 'a');
const bs = countChar(s, 'b');
return /^a+b+$/.test(s) && as === bs;`,
  },
  {
    id: 'tpl_anbncn',
    label: 'aⁿbⁿcⁿ',
    category: 'Non-Regular',
    description: 'L = { aⁿbⁿcⁿ | n ≥ 1 }',
    alphabet: 'a, b, c',
    isRegular: false,
    theoryNote: 'Not even context-free! y can span only one symbol type.',
    code: `const as = countChar(s, 'a');
const bs = countChar(s, 'b');
const cs = countChar(s, 'c');
return /^a+b+c+$/.test(s) && as === bs && bs === cs;`,
  },
  {
    id: 'tpl_anbn2',
    label: 'aⁿb²ⁿ',
    category: 'Non-Regular',
    description: 'L = { aⁿb²ⁿ | n ≥ 1 }',
    alphabet: 'a, b',
    isRegular: false,
    theoryNote: 'Pumping y changes the 1:2 ratio of a\'s to b\'s.',
    code: `const as = countChar(s, 'a');
const bs = countChar(s, 'b');
return /^a+b+$/.test(s) && bs === 2 * as;`,
  },
  {
    id: 'tpl_palindrome',
    label: 'Even Palindromes (wwᴿ)',
    category: 'Non-Regular',
    description: 'L = { wwᴿ | w ∈ {a,b}* }',
    alphabet: 'a, b',
    isRegular: false,
    theoryNote: 'Pumping inside first half breaks palindrome symmetry.',
    code: `if (s.length % 2 !== 0) return false;
if (!/^[ab]+$/.test(s)) return false;
return s === s.split('').reverse().join('');`,
  },
  {
    id: 'tpl_perfect_square',
    label: 'aⁿ² (Perfect Square length)',
    category: 'Non-Regular',
    description: 'L = { aⁿ² | n ≥ 1 }',
    alphabet: 'a',
    isRegular: false,
    theoryNote: 'Gaps between consecutive squares grow — pumped lengths skip squares.',
    code: `if (!/^a+$/.test(s)) return false;
return isPerfectSquare(s.length);`,
  },
  {
    id: 'tpl_prime',
    label: 'aᵖ (Prime length)',
    category: 'Non-Regular',
    description: 'L = { aᵖ | p is prime }',
    alphabet: 'a',
    isRegular: false,
    theoryNote: 'Large pumped lengths are composite.',
    code: `if (!/^a+$/.test(s)) return false;
return isPrime(s.length);`,
  },
  {
    id: 'tpl_ww',
    label: 'ww (Double word)',
    category: 'Non-Regular',
    description: 'L = { ww | w ∈ {a,b}* }',
    alphabet: 'a, b',
    isRegular: false,
    theoryNote: 'Pumping first half changes its length so first ≠ second half.',
    code: `if (s.length % 2 !== 0) return false;
const n = s.length / 2;
return s.slice(0, n) === s.slice(n);`,
  },
  {
    id: 'tpl_factorial',
    label: 'aⁿ! (Factorial length)',
    category: 'Non-Regular',
    description: 'L = { aⁿ! | n ≥ 1 }',
    alphabet: 'a',
    isRegular: false,
    theoryNote: 'Factorial gaps grow super-exponentially — pumped lengths skip factorials.',
    code: `if (!/^a+$/.test(s)) return false;
return isFactorial(s.length);`,
  },
  // REGULAR
  {
    id: 'tpl_a_star',
    label: 'a* (zero or more a\'s)',
    category: 'Regular',
    description: 'L = { aⁿ | n ≥ 0 }',
    alphabet: 'a',
    isRegular: true,
    theoryNote: 'One-state DFA. Every xyⁱz stays in L.',
    code: `return /^a*$/.test(s);`,
  },
  {
    id: 'tpl_ab_star',
    label: '(ab)* pattern',
    category: 'Regular',
    description: 'L = { (ab)ⁿ | n ≥ 0 }',
    alphabet: 'a, b',
    isRegular: true,
    theoryNote: 'Regular — described by regex (ab)*.',
    code: `return /^(ab)*$/.test(s);`,
  },
  {
    id: 'tpl_ends_b',
    label: 'Strings ending in b',
    category: 'Regular',
    description: 'L = { w ∈ {a,b}* | w ends with b }',
    alphabet: 'a, b',
    isRegular: true,
    theoryNote: 'Regular — accepted by a 2-state DFA.',
    code: `return s.length > 0 && s.endsWith('b');`,
  },
  {
    id: 'tpl_even_a',
    label: 'Even number of a\'s',
    category: 'Regular',
    description: 'L = { w ∈ {a,b}* | #a(w) is even }',
    alphabet: 'a, b',
    isRegular: true,
    theoryNote: 'Regular — parity-tracking DFA with 2 states.',
    code: `return countChar(s, 'a') % 2 === 0;`,
  },
];
