import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buildCustomLanguage, testCustomValidator } from '../engine/customLanguage';

const DEFAULT_CODE = `// Example: L = { aⁿbⁿcⁿ | n ≥ 1 }
const as = s.split('').filter(c => c === 'a').length;
const bs = s.split('').filter(c => c === 'b').length;
const cs = s.split('').filter(c => c === 'c').length;
return as === bs && bs === cs && as >= 1 && s === 'a'.repeat(as) + 'b'.repeat(bs) + 'c'.repeat(cs);`;

/**
 * CustomLanguageEditor
 * Allows the user to define a new language via:
 *   - A description string
 *   - An alphabet (comma-separated)
 *   - A JS validator function body
 * 
 * @param {{ onApply: (lang: object) => void }} props
 */
export default function CustomLanguageEditor({ onApply }) {
  const [description, setDescription] = useState('L = { aⁿbⁿcⁿ | n ≥ 1 }');
  const [alphabetStr, setAlphabetStr] = useState('a, b, c');
  const [validatorCode, setValidatorCode] = useState(DEFAULT_CODE);
  const [testStr, setTestStr] = useState('');
  const [testResult, setTestResult] = useState(null); // { result: bool|null, error: str|null }
  const [applyError, setApplyError] = useState(null);
  const [applied, setApplied] = useState(false);
  const textareaRef = useRef(null);

  const parseAlphabet = (str) =>
    str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const handleTest = () => {
    const { result, error } = testCustomValidator(validatorCode, testStr);
    setTestResult({ result, error, testedStr: testStr });
  };

  const handleApply = () => {
    setApplyError(null);
    setApplied(false);
    const alphabet = parseAlphabet(alphabetStr);
    const { lang, error } = buildCustomLanguage({ description, alphabet, validatorCode });
    if (error) {
      setApplyError(error);
      return;
    }
    setApplied(true);
    onApply(lang);
    setTimeout(() => setApplied(false), 2000);
  };

  // Allow Tab key in textarea
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

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className="glass-card-elevated p-5 space-y-4 mt-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full" style={{ background: 'var(--color-primary)' }} />
          <h3 className="text-sm font-bold text-slate-200">Define Your Language</h3>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Language Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. L = { aⁿbⁿcⁿ | n ≥ 1 }"
            className="w-full px-3 py-2 rounded-lg text-sm font-mono text-slate-200 outline-none transition-all"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(0,212,255,0.2)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
          />
        </div>

        {/* Alphabet */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Alphabet (comma separated)
          </label>
          <input
            type="text"
            value={alphabetStr}
            onChange={(e) => setAlphabetStr(e.target.value)}
            placeholder="a, b, c"
            className="w-full px-3 py-2 rounded-lg text-sm font-mono text-slate-200 outline-none transition-all"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(0,212,255,0.2)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
          />
          <div className="flex gap-1 flex-wrap">
            {parseAlphabet(alphabetStr).map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 rounded text-xs font-mono text-slate-300"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Validator Code */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Membership Validator — JavaScript
          </label>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(0,212,255,0.15)' }}
          >
            {/* Code editor header */}
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            >
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <span className="text-[10px] font-mono text-slate-600 ml-2">
                function isInLanguage(s) {'{'} ... {'}'}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={validatorCode}
              onChange={(e) => setValidatorCode(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={7}
              spellCheck={false}
              className="code-editor-area rounded-none border-0"
              style={{ borderRadius: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
            />
          </div>
          <p className="text-[11px] text-slate-600">
            Write the body of a function that receives <code className="text-slate-500">s</code>{' '}
            (a string) and returns{' '}
            <code className="text-slate-500">true</code> if{' '}
            <code className="text-slate-500">s ∈ L</code>,{' '}
            <code className="text-slate-500">false</code> otherwise.
          </p>
        </div>

        {/* Test Row */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Test Your Validator
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={testStr}
              onChange={(e) => setTestStr(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTest()}
              placeholder="e.g. aabbcc"
              className="flex-1 px-3 py-2 rounded-lg text-sm font-mono text-slate-200 outline-none"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            <motion.button
              onClick={handleTest}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={!testStr}
              className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              style={{
                background: testStr ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: testStr ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: testStr ? '#00d4ff' : '#4a6491',
              }}
            >
              Test ✓
            </motion.button>
          </div>

          {/* Test result */}
          <AnimatePresence>
            {testResult && (
              <motion.div
                key={testResult.testedStr}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
                style={{
                  background: testResult.error
                    ? 'rgba(239,68,68,0.08)'
                    : testResult.result
                    ? 'rgba(0,255,136,0.08)'
                    : 'rgba(239,68,68,0.08)',
                  border: testResult.error
                    ? '1px solid rgba(239,68,68,0.2)'
                    : testResult.result
                    ? '1px solid rgba(0,255,136,0.2)'
                    : '1px solid rgba(239,68,68,0.2)',
                  color: testResult.error
                    ? '#f87171'
                    : testResult.result
                    ? '#00ff88'
                    : '#f87171',
                }}
              >
                <span>{testResult.error ? '⚠' : testResult.result ? '✅' : '❌'}</span>
                <span>
                  {testResult.error
                    ? `Validator error: ${testResult.error}`
                    : testResult.result
                    ? `"${testResult.testedStr}" ∈ L — valid!`
                    : `"${testResult.testedStr}" ∉ L — not in language`}
                </span>
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
              : 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(139,92,246,0.1))',
            border: applied
              ? '1px solid rgba(0,255,136,0.35)'
              : '1px solid rgba(0,212,255,0.3)',
            color: applied ? '#00ff88' : '#00d4ff',
            boxShadow: applied
              ? '0 0 20px rgba(0,255,136,0.1)'
              : '0 0 20px rgba(0,212,255,0.08)',
          }}
        >
          {applied ? '✓ Language Applied!' : 'Apply Custom Language →'}
        </motion.button>
      </div>
    </motion.div>
  );
}
