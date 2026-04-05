/**
 * Language Membership Validators
 * 
 * Each validator is an object with:
 *   - id:          unique identifier
 *   - name:        human-readable name
 *   - latex:       LaTeX representation of the language
 *   - description: plain-text description
 *   - alphabet:    the valid character set
 *   - validate:    (str) => boolean — membership predicate
 *   - generate:    (p) => string   — generates a "good" string of length ≥ p
 *   - explanation: human-readable explanation of the validation logic
 */

/**
 * Primality test using trial division up to √n
 * @param {number} n 
 * @returns {boolean}
 */
function isPrime(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

/**
 * Check if n is a perfect square
 * @param {number} n 
 * @returns {boolean}
 */
function isPerfectSquare(n) {
  if (n < 0) return false;
  const sqrt = Math.sqrt(n);
  return sqrt % 1 === 0;
}

const Validators = {
  anbn: {
    id: 'anbn',
    name: 'aⁿbⁿ',
    displayName: 'aⁿbⁿ',
    latex: 'L = \\{a^n b^n \\mid n \\geq 1\\}',
    description: 'Strings with equal numbers of a\'s followed by b\'s',
    alphabet: ['a', 'b'],
    validate(str) {
      if (str.length === 0) return false;
      if (str.length % 2 !== 0) return false;
      const match = str.match(/^(a+)(b+)$/);
      if (!match) return false;
      return match[1].length === match[2].length;
    },
    generate(p) {
      return 'a'.repeat(p) + 'b'.repeat(p);
    },
    explanation: 'Validates that the string follows a⁺b⁺ pattern and count(a) = count(b)',
    validationHint: 'Must follow aⁿbⁿ pattern — equal a\'s then b\'s',
  },

  palindrome: {
    id: 'palindrome',
    name: 'wwᴿ (Palindromes)',
    displayName: 'wwᴿ',
    latex: 'L = \\{ww^R \\mid w \\in \\{a, b\\}^*\\}',
    description: 'Even-length palindromes over {a, b}',
    alphabet: ['a', 'b'],
    validate(str) {
      if (str.length === 0) return false;
      if (str.length % 2 !== 0) return false;
      if (!/^[ab]+$/.test(str)) return false;
      return str === str.split('').reverse().join('');
    },
    generate(p) {
      const w = 'a'.repeat(p) + 'b'.repeat(p);
      return w + w.split('').reverse().join('');
    },
    explanation: 'Validates that str === reverse(str) and length is even',
    validationHint: 'Must be an even-length palindrome over {a, b}',
  },

  perfectSquare: {
    id: 'perfectSquare',
    name: 'aⁿ² (Perfect Squares)',
    displayName: 'aⁿ²',
    latex: 'L = \\{a^{n^2} \\mid n \\geq 1\\}',
    description: 'Strings of a\'s whose length is a perfect square',
    alphabet: ['a'],
    validate(str) {
      if (str.length === 0) return false;
      if (!/^a+$/.test(str)) return false;
      return isPerfectSquare(str.length);
    },
    generate(p) {
      const n = Math.ceil(Math.sqrt(p));
      return 'a'.repeat(n * n);
    },
    explanation: 'Validates that the string contains only a\'s and length is a perfect square (√len is integer)',
    validationHint: 'Only a\'s, and length must be a perfect square (1, 4, 9, 16, ...)',
  },

  prime: {
    id: 'prime',
    name: 'aᵖ (Primes)',
    displayName: 'aᵖ',
    latex: 'L = \\{a^p \\mid p \\text{ is prime}\\}',
    description: 'Strings of a\'s whose length is a prime number',
    alphabet: ['a'],
    validate(str) {
      if (str.length === 0) return false;
      if (!/^a+$/.test(str)) return false;
      return isPrime(str.length);
    },
    generate(p) {
      let candidate = Math.max(p, 2);
      while (!isPrime(candidate)) {
        candidate++;
      }
      return 'a'.repeat(candidate);
    },
    explanation: 'Validates that the string contains only a\'s and length is a prime number (trial division up to √n)',
    validationHint: 'Only a\'s, and length must be a prime number (2, 3, 5, 7, 11, ...)',
  },
};

/**
 * Get all available language IDs (not including custom)
 */
export function getLanguageIds() {
  return Object.keys(Validators);
}

/**
 * Get a validator by language ID.
 * If id === 'custom', returns the provided customLanguage object.
 * 
 * @param {string} id 
 * @param {object|null} customLanguage - Custom language object (for id === 'custom')
 * @returns {object|null}
 */
export function getValidator(id, customLanguage = null) {
  if (id === 'custom') return customLanguage;
  return Validators[id] ?? null;
}

export default Validators;
