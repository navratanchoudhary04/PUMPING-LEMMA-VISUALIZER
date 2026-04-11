import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  buildCustomLanguage,
  buildRegexLanguage,
  testCustomValidator,
  CUSTOM_TEMPLATES,
} from '../engine/customLanguage';

const MODES = ['Build Own', 'Templates', 'Regex'];

const DEFAULT_CODE = `// Example: L = { aⁿbⁿ | n ≥ 1 }
// Available: countChar(s,'a'), isPrime(n), isPerfectSquare(n), isFactorial(n)
const as = countChar(s, 'a');
const bs = countChar(s, 'b');
return /^a+b+$/.test(s) && as === bs;`;

const REGULARITY_OPTIONS = [
  { value: false, label: 'Non-Regular', note: 'I want to prove this with the Pumping Lemma', color: '#ff4d6d' },
  { value: true, label: 'Regular', note: 'I want to see how pumping still works', color: '#00ff88' },
];

/**
 * CustomLanguageEditor — v2.0
 * Three modes: Build Own (JS), Templates, Regex
 */
export default function CustomLanguageEditor({ onApply }) {
  const [mode, setMode] = useState('Build Own');

  // Build Own state
  const [description, setDescription] = useState('L = { aⁿbⁿ | n ≥ 1 }');
  const [alphabetStr, setAlphabetStr] = useState('a, b');
  const [validatorCode, setValidatorCode] = useState(DEFAULT_CODE);
  const [isRegular, setIsRegular] = useState(false);
  const [theoryNote, setTheoryNote] = useState('');

  // Regex mode state
  const [regexStr, setRegexStr] = useState('');
  const [regexDesc, setRegexDesc] = useState('');
  const [regexAlpha, setRegexAlpha] = useState('a, b');
  const [regexIsRegular, setRegexIsRegular] = useState(true);

  // Test state
  const [testStr, setTestStr] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [autoTests, setAutoTests] = useState(null);

  // Apply state
  const [applyError, setApplyError] = useState(null);
  const [applied, setApplied] = useState(false);

  const textareaRef = useRef(null);

  const parseAlphabet = (str) =>
    str.split(',').map((s) => s.trim()).filter(Boolean);

  // ── Test ──────────────────────────────────────────────────────────
  const handleTest = () => {
    const code = mode === 'Regex'
      ? `try { return new RegExp(${JSON.stringify(regexStr)}).test(s); } catch { return false; }`
      : validatorCode;
    const { result, error } = testCustomValidator(code, testStr);
    setTestResult({ result, error, testedStr: testStr });
  };

  const handleAutoTest = () => {
    const alpha = parseAlphabet(mode === 'Regex' ? regexAlpha : alphabetStr);
    if (alpha.length === 0) return;
    const testCases = generateAutoTestCases(alpha);
    const code = mode === 'Regex'
      ? `try { return new RegExp(${JSON.stringify(regexStr)}).test(s); } catch { return false; }`
      : validatorCode;
    const results = testCases.map((str) => {
      const { result, error } = testCustomValidator(code, str);
      return { str, result, error };
    });
    setAutoTests(results);
  };

  // ── Apply ─────────────────────────────────────────────────────────
  const handleApply = () => {
    setApplyError(null);
    setApplied(false);

    let result;
    if (mode === 'Regex') {
      result = buildRegexLanguage({
        description: regexDesc || `/${regexStr}/`,
        alphabet: parseAlphabet(regexAlpha),
        regexStr,
        isRegular: regexIsRegular,
      });
    } else {
      result = buildCustomLanguage({
        description,
        alphabet: parseAlphabet(alphabetStr),
        validatorCode,
        isRegular,
        theoryNote,
      });
    }

    if (result.error) {
      setApplyError(result.error);
      return;
    }
    setApplied(true);
    onApply(result.lang);
    setTimeout(() => setApplied(false), 2500);
  };

  // ── Template selection ─────────────────────────────────────────────
  const handleTemplate = (tpl) => {
    setDescription(tpl.description);
    setAlphabetStr(tpl.alphabet);
    setValidatorCode(tpl.code);
    setIsRegular(tpl.isRegular);
    setTheoryNote(tpl.theoryNote || '');
    setTestResult(null);
    setAutoTests(null);
    setMode('Build Own');
  };

  // ── Tab key in textarea ────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = validatorCode.substring(0, start) + '  ' + validatorCode.substring(end);
      setValidatorCode(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = start + 2;
        ta.selectionEnd = start + 2;
      });
    }
  };

  const nonRegularTemplates = CUSTOM_TEMPLATES.filter((t) => t.category === 'Non-Regular');
  const regularTemplates = CUSTOM_TEMPLATES.filter((t) => t.category === 'Regular');

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className="glass-card-elevated p-5 space-y-4 mt-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full" style={{ background: 'linear-gradient(180deg, #00d4ff, #c77dff)' }} />
          <h3 className="text-sm font-bold text-slate-200 tracking-wide">Custom Language Editor</h3>
          <span
            className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider"
            style={{ background: 'rgba(0,212,255,0.08)', color: '#64748b', border: '1px solid rgba(0,212,255,0.1)' }}
          >
            v2.0
          </span>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: mode === m ? 'rgba(0,212,255,0.12)' : 'transparent',
                border: mode === m ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
                color: mode === m ? '#00d4ff' : '#4a6491',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* ── MODE: Build Own ─────────────────────────────────────────── */}
        {mode === 'Build Own' && (
          <div className="space-y-4">
            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Language Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. L = { aⁿbⁿ | n ≥ 1 }"
                className="w-full px-3 py-2 rounded-lg text-sm font-mono text-slate-200 outline-none transition-all"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,255,0.2)' }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
              />
            </div>

            {/* Alphabet */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Alphabet (comma-separated)</label>
              <input
                type="text"
                value={alphabetStr}
                onChange={(e) => setAlphabetStr(e.target.value)}
                placeholder="a, b, c"
                className="w-full px-3 py-2 rounded-lg text-sm font-mono text-slate-200 outline-none transition-all"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,255,0.2)' }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
              />
              <div className="flex gap-1 flex-wrap">
                {parseAlphabet(alphabetStr).map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded text-xs font-mono text-slate-300"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Regularity */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Language Type</label>
              <div className="flex gap-2">
                {REGULARITY_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setIsRegular(opt.value)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left px-3"
                    style={{
                      background: isRegular === opt.value ? `rgba(${opt.value ? '0,255,136' : '255,77,109'},0.08)` : 'rgba(0,0,0,0.2)',
                      border: isRegular === opt.value ? `1px solid ${opt.color}40` : '1px solid rgba(255,255,255,0.06)',
                      color: isRegular === opt.value ? opt.color : '#4a6491',
                    }}
                  >
                    <div>{opt.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-70">{opt.note}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Validator Code */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Membership Validator — JavaScript</label>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,212,255,0.15)' }}>
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 ml-2">function isInLanguage(s) {'{ ... }'}</span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={validatorCode}
                  onChange={(e) => setValidatorCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={7}
                  spellCheck={false}
                  className="code-editor-area rounded-none border-0"
                  style={{ borderRadius: 0 }}
                />
              </div>
              <p className="text-[11px] text-slate-600">
                ⓘ Helpers: <code className="text-slate-500">countChar(s,'a')</code> · <code className="text-slate-500">isPrime(n)</code> · <code className="text-slate-500">isPerfectSquare(n)</code> · <code className="text-slate-500">isFactorial(n)</code>
              </p>
            </div>
          </div>
        )}

        {/* ── MODE: Templates ─────────────────────────────────────────── */}
        {mode === 'Templates' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-2">Click any template to load it into the editor.</p>
              <div className="text-[11px] font-semibold text-red-400/80 uppercase tracking-wider mb-2">Non-Regular (for Pumping Lemma proofs)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nonRegularTemplates.map((tpl) => (
                  <motion.button
                    key={tpl.id}
                    onClick={() => handleTemplate(tpl)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="text-left p-3 rounded-xl transition-all cursor-pointer"
                    style={{
                      background: 'rgba(255,77,109,0.04)',
                      border: '1px solid rgba(255,77,109,0.15)',
                    }}
                  >
                    <div className="font-mono text-sm font-bold text-slate-200">{tpl.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{tpl.description}</div>
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-green-400/80 uppercase tracking-wider mb-2">Regular (for comparison)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {regularTemplates.map((tpl) => (
                  <motion.button
                    key={tpl.id}
                    onClick={() => handleTemplate(tpl)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="text-left p-3 rounded-xl transition-all cursor-pointer"
                    style={{
                      background: 'rgba(0,255,136,0.03)',
                      border: '1px solid rgba(0,255,136,0.12)',
                    }}
                  >
                    <div className="font-mono text-sm font-bold text-slate-200">{tpl.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{tpl.description}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MODE: Regex ─────────────────────────────────────────────── */}
        {mode === 'Regex' && (
          <div className="space-y-4">
            <div
              className="px-3 py-2.5 rounded-xl text-xs font-mono"
              style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', color: '#00d4ff' }}
            >
              ℹ Regular languages CANNOT be proved non-regular with the Pumping Lemma.
              You can still visualize pumping — every xyⁱz will remain in L.
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Regular Expression</label>
              <input
                type="text"
                value={regexStr}
                onChange={(e) => setRegexStr(e.target.value)}
                placeholder="e.g. ^(ab)*$"
                className="w-full px-3 py-2 rounded-lg text-sm font-mono text-slate-200 outline-none transition-all"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,255,0.2)' }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Description (optional)</label>
              <input
                type="text"
                value={regexDesc}
                onChange={(e) => setRegexDesc(e.target.value)}
                placeholder="e.g. Strings matching (ab)*"
                className="w-full px-3 py-2 rounded-lg text-sm font-mono text-slate-200 outline-none transition-all"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,255,0.2)' }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Alphabet (comma-separated)</label>
              <input
                type="text"
                value={regexAlpha}
                onChange={(e) => setRegexAlpha(e.target.value)}
                placeholder="a, b"
                className="w-full px-3 py-2 rounded-lg text-sm font-mono text-slate-200 outline-none transition-all"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,255,0.2)' }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
              />
            </div>

            <div className="flex gap-2">
              {REGULARITY_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setRegexIsRegular(opt.value)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer px-3"
                  style={{
                    background: regexIsRegular === opt.value ? `rgba(${opt.value ? '0,255,136' : '255,77,109'},0.08)` : 'rgba(0,0,0,0.2)',
                    border: regexIsRegular === opt.value ? `1px solid ${opt.color}40` : '1px solid rgba(255,255,255,0.06)',
                    color: regexIsRegular === opt.value ? opt.color : '#4a6491',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Test Panel (shared across modes) ────────────────────────── */}
        <div className="space-y-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">🧪 Test Validator</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={testStr}
              onChange={(e) => setTestStr(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && testStr && handleTest()}
              placeholder="e.g. aabb"
              className="flex-1 px-3 py-2 rounded-lg text-sm font-mono text-slate-200 outline-none"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <motion.button
              onClick={handleTest}
              disabled={!testStr}
              whileHover={testStr ? { scale: 1.02 } : {}}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              style={{
                background: testStr ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: testStr ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: testStr ? '#00d4ff' : '#4a6491',
              }}
            >
              Test ▶
            </motion.button>
            <motion.button
              onClick={handleAutoTest}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              style={{ background: 'rgba(199,125,255,0.08)', border: '1px solid rgba(199,125,255,0.2)', color: '#c77dff' }}
            >
              Auto×5
            </motion.button>
          </div>

          {/* Single test result */}
          <AnimatePresence>
            {testResult && (
              <motion.div
                key={testResult.testedStr}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
                style={{
                  background: testResult.error ? 'rgba(239,68,68,0.08)' : testResult.result ? 'rgba(0,255,136,0.08)' : 'rgba(239,68,68,0.08)',
                  border: testResult.error ? '1px solid rgba(239,68,68,0.2)' : testResult.result ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(239,68,68,0.2)',
                  color: testResult.error ? '#f87171' : testResult.result ? '#00ff88' : '#f87171',
                }}
              >
                <span>{testResult.error ? '⚠' : testResult.result ? '✅' : '❌'}</span>
                <span>
                  {testResult.error
                    ? `Error: ${testResult.error}`
                    : testResult.result
                    ? `"${testResult.testedStr}" ∈ L ✓`
                    : `"${testResult.testedStr}" ∉ L`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auto tests */}
          <AnimatePresence>
            {autoTests && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-1"
              >
                {autoTests.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
                    style={{
                      background: t.error ? 'rgba(239,68,68,0.06)' : t.result ? 'rgba(0,255,136,0.06)' : 'rgba(239,68,68,0.06)',
                      border: t.error ? '1px solid rgba(239,68,68,0.15)' : t.result ? '1px solid rgba(0,255,136,0.15)' : '1px solid rgba(239,68,68,0.15)',
                      color: t.error ? '#f87171' : t.result ? '#4ade80' : '#f87171',
                    }}>
                    <span>{t.error ? '⚠' : t.result ? '✅' : '❌'}</span>
                    <span>"{t.str}"</span>
                    <span className="ml-auto opacity-60">{t.error ? 'error' : t.result ? '∈ L' : '∉ L'}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Apply error */}
        <AnimatePresence>
          {applyError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-3 py-2 rounded-lg text-xs font-mono text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              ⚠ {applyError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Apply Button */}
        <motion.button
          onClick={handleApply}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-xl font-semibold text-sm cursor-pointer transition-all"
          style={{
            background: applied
              ? 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,212,255,0.1))'
              : 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(199,125,255,0.1))',
            border: applied ? '1px solid rgba(0,255,136,0.35)' : '1px solid rgba(0,212,255,0.3)',
            color: applied ? '#00ff88' : '#00d4ff',
            boxShadow: applied ? '0 0 20px rgba(0,255,136,0.1)' : '0 0 20px rgba(0,212,255,0.08)',
          }}
        >
          {applied ? '✓ Language Applied!' : 'Apply Custom Language →'}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Helper: generate 5 auto-test strings ──────────────────────────────
function generateAutoTestCases(alpha) {
  const cases = [];
  const a = alpha[0] || 'a';
  const b = alpha[1] || 'b';
  cases.push('');                    // empty
  cases.push(a);                     // single a
  cases.push(a + a + b + b);        // "aabb"
  cases.push(a.repeat(3) + b.repeat(3)); // "aaabbb"
  cases.push(b + a);                 // reversed
  return cases;
}
