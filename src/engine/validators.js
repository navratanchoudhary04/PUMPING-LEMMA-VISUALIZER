/**
 * Language Membership Validators — v2.0
 *
 * Each validator:
 *   id          : unique key
 *   name        : display name
 *   displayName : short name
 *   latex       : LaTeX notation
 *   description : plain English
 *   alphabet    : valid char set
 *   isRegular   : boolean — false = non-regular (pumping lemma will find contradiction)
 *   validate    : (str) => boolean
 *   generate    : (p) => string — string in L with |s| >= p
 *   explanation : validator logic description
 *   validationHint : short user hint
 *   theoryNote  : why is/isn't regular
 */

export function isPrime(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

export function isPerfectSquare(n) {
  if (n < 0) return false;
  const sqrt = Math.sqrt(n);
  return Math.round(sqrt) * Math.round(sqrt) === n;
}

export function isFactorial(n) {
  if (n <= 0) return false;
  let fact = 1, k = 1;
  while (fact < n) { k++; fact *= k; }
  return fact === n;
}

const Validators = {
  anbn: {
    id: 'anbn',
    name: 'aⁿbⁿ',
    displayName: 'aⁿbⁿ',
    latex: 'L = \\{a^n b^n \\mid n \\geq 1\\}',
    description: 'Equal number of a\'s followed by b\'s',
    alphabet: ['a', 'b'],
    isRegular: false,
    validate(str) {
      if (!str || str.length === 0) return false;
      if (str.length % 2 !== 0) return false;
      const match = str.match(/^(a+)(b+)$/);
      if (!match) return false;
      return match[1].length === match[2].length;
    },
    generate(p) { return 'a'.repeat(p) + 'b'.repeat(p); },
    explanation: 'Checks a⁺b⁺ pattern and count(a) === count(b)',
    validationHint: 'Must follow aⁿbⁿ — equal a\'s then b\'s',
    theoryNote: 'y lies entirely in the a-prefix. Pumping changes #a\'s ≠ #b\'s → contradiction.',
  },

  palindrome: {
    id: 'palindrome',
    name: 'wwᴿ (Palindromes)',
    displayName: 'wwᴿ',
    latex: 'L = \\{ww^R \\mid w \\in \\{a,b\\}^*\\}',
    description: 'Even-length palindromes over {a, b}',
    alphabet: ['a', 'b'],
    isRegular: false,
    validate(str) {
      if (!str || str.length === 0) return false;
      if (str.length % 2 !== 0) return false;
      if (!/^[ab]+$/.test(str)) return false;
      return str === str.split('').reverse().join('');
    },
    generate(p) {
      const half = Math.ceil(p / 2) + 1;
      const w = 'a'.repeat(half);
      return w + w.split('').reverse().join('');
    },
    explanation: 'str === reverse(str) and length is even',
    validationHint: 'Must be an even-length palindrome over {a,b}',
    theoryNote: 'Pumping inside the first half breaks the palindrome symmetry → contradiction.',
  },

  perfectSquare: {
    id: 'perfectSquare',
    name: 'aⁿ² (Perfect Squares)',
    displayName: 'aⁿ²',
    latex: 'L = \\{a^{n^2} \\mid n \\geq 1\\}',
    description: 'Strings of a\'s whose length is a perfect square',
    alphabet: ['a'],
    isRegular: false,
    validate(str) {
      if (!str || str.length === 0) return false;
      if (!/^a+$/.test(str)) return false;
      return isPerfectSquare(str.length);
    },
    generate(p) {
      const n = Math.ceil(Math.sqrt(Math.max(p, 1)));
      return 'a'.repeat(n * n);
    },
    explanation: 'Only a\'s, and √(length) must be an integer',
    validationHint: 'Only a\'s, length must be a perfect square (1,4,9,16,...)',
    theoryNote: 'Gaps between consecutive perfect squares grow, so pumped lengths can\'t all be squares.',
  },

  prime: {
    id: 'prime',
    name: 'aᵖ (Prime length)',
    displayName: 'aᵖ',
    latex: 'L = \\{a^p \\mid p \\text{ is prime}\\}',
    description: 'Strings of a\'s whose length is prime',
    alphabet: ['a'],
    isRegular: false,
    validate(str) {
      if (!str || str.length === 0) return false;
      if (!/^a+$/.test(str)) return false;
      return isPrime(str.length);
    },
    generate(p) {
      let candidate = Math.max(p, 2);
      while (!isPrime(candidate)) candidate++;
      return 'a'.repeat(candidate);
    },
    explanation: 'Only a\'s, and length must be prime (trial division up to √n)',
    validationHint: 'Only a\'s, length must be prime (2,3,5,7,11,...)',
    theoryNote: 'On pumping, length becomes p+k·|y| — for large enough k this is composite.',
  },

  anbn2: {
    id: 'anbn2',
    name: 'aⁿb²ⁿ',
    displayName: 'aⁿb²ⁿ',
    latex: 'L = \\{a^n b^{2n} \\mid n \\geq 1\\}',
    description: 'n a\'s followed by 2n b\'s',
    alphabet: ['a', 'b'],
    isRegular: false,
    validate(str) {
      if (!str || str.length === 0) return false;
      const match = str.match(/^(a+)(b+)$/);
      if (!match) return false;
      return match[2].length === 2 * match[1].length;
    },
    generate(p) { return 'a'.repeat(p) + 'b'.repeat(2 * p); },
    explanation: 'Checks a⁺b⁺ pattern and count(b) === 2 × count(a)',
    validationHint: 'Must be aⁿb²ⁿ — b\'s are exactly double the a\'s',
    theoryNote: 'Pumping y (in a-prefix) changes ratio of a:b from 1:2 → contradiction.',
  },

  anbncn: {
    id: 'anbncn',
    name: 'aⁿbⁿcⁿ',
    displayName: 'aⁿbⁿcⁿ',
    latex: 'L = \\{a^n b^n c^n \\mid n \\geq 1\\}',
    description: 'Equal counts of a\'s, b\'s, and c\'s in order',
    alphabet: ['a', 'b', 'c'],
    isRegular: false,
    validate(str) {
      if (!str || str.length === 0) return false;
      const match = str.match(/^(a+)(b+)(c+)$/);
      if (!match) return false;
      return match[1].length === match[2].length && match[2].length === match[3].length;
    },
    generate(p) { return 'a'.repeat(p) + 'b'.repeat(p) + 'c'.repeat(p); },
    explanation: 'Checks a⁺b⁺c⁺ pattern with count(a)=count(b)=count(c)',
    validationHint: 'Must be aⁿbⁿcⁿ — equal a\'s, b\'s, and c\'s in that order',
    theoryNote: 'Even context-free pumping lemma fails here — this is NOT context-free! y can only span one character type, breaking the equal-count requirement.',
  },

  wwreverse: {
    id: 'wwreverse',
    name: 'ww (Double word)',
    displayName: 'ww',
    latex: 'L = \\{ww \\mid w \\in \\{a,b\\}^*\\}',
    description: 'Strings that are a word concatenated with itself',
    alphabet: ['a', 'b'],
    isRegular: false,
    validate(str) {
      if (!str || str.length === 0) return false;
      if (str.length % 2 !== 0) return false;
      if (!/^[ab]+$/.test(str)) return false;
      const n = str.length / 2;
      return str.slice(0, n) === str.slice(n);
    },
    generate(p) {
      const len = Math.ceil(p / 2) + 1;
      const w = 'a'.repeat(len);
      return w + w;
    },
    explanation: 'Even length, and first half equals second half',
    validationHint: 'Must be ww — first half equals second half',
    theoryNote: 'Pumping y in first half changes its length, making first ≠ second half → contradiction.',
  },
};

/**
 * Regular language examples (used in Custom Language Editor templates)
 */
export const RegularLanguages = {
  regStarA: {
    id: 'regStarA',
    name: 'a* (zero or more a\'s)',
    latex: 'L = \\{a^n \\mid n \\geq 0\\}',
    description: 'Any number of a\'s including empty string',
    alphabet: ['a'],
    isRegular: true,
    validate: (str) => /^a*$/.test(str),
    generate: (p) => 'a'.repeat(p),
    validatorCode: "return /^a*$/.test(s);",
    theoryNote: 'Accepted by DFA with one state. Every pumped string xyⁱz stays in L.',
  },
  regAB: {
    id: 'regAB',
    name: '(ab)* pattern',
    latex: 'L = \\{(ab)^n \\mid n \\geq 0\\}',
    description: 'Repetitions of the block "ab"',
    alphabet: ['a', 'b'],
    isRegular: true,
    validate: (str) => /^(ab)*$/.test(str),
    generate: (p) => 'ab'.repeat(Math.ceil(p / 2)),
    validatorCode: "return /^(ab)*$/.test(s);",
    theoryNote: 'Regular — described by the regex (ab)*.',
  },
  regEndsB: {
    id: 'regEndsB',
    name: 'Strings ending in b',
    latex: 'L = \\{w \\in \\{a,b\\}^* \\mid w \\text{ ends with } b\\}',
    description: 'Strings over {a,b} that end with b',
    alphabet: ['a', 'b'],
    isRegular: true,
    validate: (str) => str.length > 0 && str.endsWith('b'),
    generate: (p) => 'a'.repeat(p - 1) + 'b',
    validatorCode: "return s.length > 0 && s.endsWith('b');",
    theoryNote: 'Regular — accepted by a 2-state DFA.',
  },
  regEvenA: {
    id: 'regEvenA',
    name: 'Even number of a\'s',
    latex: 'L = \\{w \\in \\{a,b\\}^* \\mid \\#_a(w) \\equiv 0 \\pmod{2}\\}',
    description: 'Strings with an even count of a\'s',
    alphabet: ['a', 'b'],
    isRegular: true,
    validate: (str) => (str.split('').filter(c => c === 'a').length % 2 === 0),
    generate: (p) => 'aa'.repeat(Math.ceil(p / 2)),
    validatorCode: "return s.split('').filter(c => c === 'a').length % 2 === 0;",
    theoryNote: 'Regular — accepted by a 2-state DFA tracking parity of a\'s.',
  },
};

export function getLanguageIds() {
  return Object.keys(Validators);
}

export function getValidator(id, customLanguage = null) {
  if (id === 'custom') return customLanguage;
  return Validators[id] ?? null;
}

export default Validators;
