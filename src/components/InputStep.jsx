import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KaTeXBlock from './KaTeXBlock';

// ── Educational examples per language ──────────────────────────
const LANGUAGE_EXAMPLES = {
  anbn:        { valid: ['ab','aabb','aaabbb','aaaabbbb'], invalid: ['a','bb','aab','aaabb'] },
  palindrome:  { valid: ['abba','aabbaa','abab'.split('').reverse().join(''),'aa'], invalid: ['ab','abc','abba'.slice(1)] },
  perfectSquare:{ valid: ['a','aaaa','aaaaaaaaa'], invalid: ['aa','aaa','aaaaa'] },
  prime:       { valid: ['aa','aaa','aaaaa','aaaaaaa'], invalid: ['a','aaaa','aaaaaa'] },
  anbn2:       { valid: ['abb','aabbbb','aaabbbbbb'], invalid: ['ab','aabb','aabbb'] },
  anbncn:      { valid: ['abc','aabbcc','aaabbbccc'], invalid: ['ab','abc'.repeat(2),'aabbbc'] },
  wwreverse:   { valid: ['abab','aaaaaa','abbaabba'], invalid: ['ab','abba','aba'] },
  custom:      { valid: [], invalid: [] },
};

export default function InputStep({
  validator, pValue, inputString, onInputChange, onNext, onBack,
}) {
  const [touched, setTouched] = useState(false);

  const isReady = Boolean(validator);

  const isValid = useMemo(() => {
    if (!isReady || !inputString) return false;
    try { return validator.validate(inputString); } catch { return false; }
  }, [inputString, validator, isReady]);

  const isLongEnough = inputString.length >= pValue;
  const canProceed = isValid && isLongEnough;

  const suggestedString = useMemo(() => {
    if (!isReady) return '';
    try { return validator.generate(pValue); } catch { return 'a'.repeat(pValue); }
  }, [validator, pValue, isReady]);

  // Rejection reason message
  const rejectionReason = useMemo(() => {
    if (!touched || !inputString) return null;
    if (isValid && isLongEnough) return null;
    if (!isValid && inputString.length > 0) {
      const alpha = validator?.alphabet?.join(', ') || '?';
      return {
        icon: '✗',
        title: 'String not in language L',
        detail: `"${inputString}" does not satisfy the membership rules for ${validator?.name || 'L'}. ` +
          `Valid characters are: {${alpha}}. Try the suggested string above.`,
      };
    }
    if (!isLongEnough && inputString.length > 0) {
      return {
        icon: '⚠',
        title: `String too short — need at least ${pValue} characters`,
        detail: `|s| = ${inputString.length} but p = ${pValue}. The Pumping Lemma requires |s| ≥ p for the string to have enough structure to pump.`,
      };
    }
    return null;
  }, [touched, inputString, isValid, isLongEnough, pValue, validator]);

  const examples = LANGUAGE_EXAMPLES[validator?.id] || LANGUAGE_EXAMPLES.custom;

  if (!isReady) {
    return (
      <div className="text-center py-24" style={{ color: 'var(--text-muted)' }}>
        ⚠ No language selected. Go back and apply a language first.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* ── Page heading ── */}
      <div className="space-y-2">
        <h2 className="text-h1 text-slate-100">Choose Your String <em>s</em></h2>
        <p className="text-body-lg" style={{ color: 'var(--text-secondary)' }}>
          Enter a string <em>s ∈ L</em> with{' '}
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>|s| ≥ p = {pValue}</span>.
          The adversary will then decompose it as s&nbsp;=&nbsp;xyz.
        </p>
      </div>

      {/* ── Two-column layout: input left + examples right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Input panel */}
        <div className="glass-elevated p-6 space-y-6">
          {/* Language reminder */}
          <div className="flex items-center gap-3 flex-wrap pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-purple)' }} />
            <div style={{ fontSize: '1.1em' }}>
              <KaTeXBlock latex={validator.latex} displayMode={false} />
            </div>
            {validator.isRegular && (
              <span className="badge-reg" style={{ marginLeft: 'auto' }}>Regular</span>
            )}
          </div>

          {/* Huge input */}
          <div className="space-y-3">
            <label htmlFor="string-input" className="text-sm-label" style={{ color: 'var(--text-secondary)' }}>
              Input String
            </label>
            <div className="relative">
              <input
                id="string-input"
                type="text"
                value={inputString}
                onChange={(e) => { onInputChange(e.target.value); setTouched(true); }}
                placeholder={suggestedString ? `e.g. ${suggestedString}` : 'type a string…'}
                className={`string-input-field pr-20 ${touched && canProceed ? 'is-valid' : touched && inputString ? 'is-invalid' : ''}`}
                autoComplete="off"
                spellCheck={false}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  |s|={inputString.length}
                </span>
                {touched && inputString && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: canProceed ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: '1.2rem' }}>
                    {canProceed ? '✓' : '✗'}
                  </motion.span>
                )}
              </div>
            </div>
          </div>

          {/* Constraints */}
          <div className="space-y-2">
            {[
              { ok: isValid, ok_text: `s ∈ L  ✓`, fail_text: `s ∉ L  ✗  (not in language)` },
              { ok: isLongEnough, ok_text: `|s| = ${inputString.length} ≥ p = ${pValue}  ✓`, fail_text: `|s| = ${inputString.length} < p = ${pValue}  ✗` },
            ].map((row, i) => (
              <AnimatePresence key={i}>
                {touched && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: row.ok ? 'var(--accent-green)' : 'var(--accent-red)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: row.ok ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {row.ok ? row.ok_text : row.fail_text}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>

          {/* Suggestion button */}
          {suggestedString && (
            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-body" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Recommended string:</span>
              <button
                id="use-suggestion-btn"
                onClick={() => { onInputChange(suggestedString); setTouched(true); }}
                className="cursor-pointer transition-all px-4 py-2 rounded-xl font-mono font-semibold"
                style={{
                  fontSize: '1rem', letterSpacing: '0.08em',
                  background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)',
                  color: 'var(--accent-purple)',
                }}
              >
                {suggestedString} ← use
              </button>
            </div>
          )}
        </div>

        {/* Right: Educational examples */}
        <div className="space-y-4">
          <div className="glass p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '1.2rem' }}>📐</span>
              <h3 className="text-h3">String Examples for <em>{validator.name}</em></h3>
            </div>
            <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {validator.validationHint || `Valid strings must satisfy: ${validator.description}`}
            </p>

            {/* Valid examples */}
            {examples.valid.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm-label" style={{ color: 'var(--accent-green)', marginBottom: '0.5rem' }}>
                  ✅ Valid strings (∈ L)
                </div>
                <div className="flex flex-wrap gap-2">
                  {examples.valid.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => { onInputChange(ex); setTouched(true); }}
                      className="example-chip valid cursor-pointer transition-opacity hover:opacity-80"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Invalid examples */}
            {examples.invalid.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm-label" style={{ color: 'var(--accent-red)', marginBottom: '0.5rem' }}>
                  ❌ Invalid strings (∉ L)
                </div>
                <div className="flex flex-wrap gap-2">
                  {examples.invalid.map((ex) => (
                    <span key={ex} className="example-chip invalid">{ex}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Alphabet reminder */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-body"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Σ =</span>
              {validator.alphabet.map((c) => (
                <span key={c} className="px-2.5 py-0.5 rounded font-mono font-bold"
                  style={{ background: 'var(--x-dim)', border: '1px solid var(--x-border)', color: 'var(--x-color)' }}>
                  {c}
                </span>
              ))}
              <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '0.8rem' }}>
                p = {pValue}
              </span>
            </div>
          </div>

          {/* ── Rejection reason panel ── */}
          <AnimatePresence>
            {rejectionReason && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="p-5 rounded-2xl space-y-2"
                style={{ background: 'rgba(255,59,92,0.06)', border: '1px solid rgba(255,59,92,0.2)' }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.5rem' }}>{rejectionReason.icon}</span>
                  <div className="text-h3 font-bold" style={{ color: 'var(--accent-red)' }}>
                    {rejectionReason.title}
                  </div>
                </div>
                <p className="text-body-lg" style={{ color: 'var(--text-secondary)', paddingLeft: '2.5rem' }}>
                  {rejectionReason.detail}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex justify-between pt-2">
        <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="px-7 py-3.5 rounded-xl font-semibold cursor-pointer transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-dim)', color: 'var(--text-secondary)', fontSize: '1rem' }}>
          ← Back
        </motion.button>
        <motion.button
          id="input-next-btn"
          onClick={onNext} disabled={!canProceed}
          whileHover={canProceed ? { scale: 1.03 } : {}} whileTap={canProceed ? { scale: 0.97 } : {}}
          className="px-10 py-3.5 rounded-2xl font-bold transition-all duration-300"
          style={{
            fontSize: '1.05rem',
            background: canProceed ? 'linear-gradient(135deg, #00d4ff, #4f46e5)' : 'rgba(255,255,255,0.04)',
            color: canProceed ? 'white' : 'var(--text-muted)',
            boxShadow: canProceed ? '0 4px 24px rgba(0,212,255,0.3)' : 'none',
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
        >
          Generate Partitions →
        </motion.button>
      </div>
    </motion.div>
  );
}
