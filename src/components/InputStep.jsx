import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KaTeXBlock from './KaTeXBlock';

/**
 * InputStep — Enter a string s ∈ L with |s| ≥ p
 *
 * Props:
 *   validator    : object — the active language validator (preset or custom)
 *   pValue       : number
 *   inputString  : string
 *   onInputChange : (str) => void
 *   onNext       : () => void
 *   onBack       : () => void
 */
export default function InputStep({
  validator,
  pValue,
  inputString,
  onInputChange,
  onNext,
  onBack,
}) {
  const [touched, setTouched] = useState(false);

  // Guard: if validator isn't ready (custom not applied), show fallback
  const isReady = Boolean(validator);

  const isValid = useMemo(() => {
    if (!isReady) return false;
    try {
      return validator.validate(inputString);
    } catch {
      return false;
    }
  }, [inputString, validator, isReady]);

  const isLongEnough = inputString.length >= pValue;
  const canProceed   = isValid && isLongEnough;

  const suggestedString = useMemo(() => {
    if (!isReady) return '';
    try {
      return validator.generate(pValue);
    } catch {
      return 'a'.repeat(pValue);
    }
  }, [validator, pValue, isReady]);

  const handleUseSuggestion = () => {
    onInputChange(suggestedString);
    setTouched(true);
  };

  if (!isReady) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm font-mono">
        ⚠ No language selected. Go back and apply a language first.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-full space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
          Choose Your String
        </h2>
        <p className="text-slate-400 text-sm">
          Enter a string{' '}
          <span className="font-mono" style={{ color: '#00d4ff' }}>s ∈ L</span>{' '}
          with{' '}
          <span className="font-mono" style={{ color: '#00d4ff' }}>|s| ≥ p = {pValue}</span>
        </p>
      </div>

      {/* Language reminder */}
      <div className="glass-card p-4 flex items-center gap-4">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#a78bfa' }} />
        <KaTeXBlock latex={validator.latex} displayMode={false} />
        {validator.validationHint && (
          <span className="ml-auto text-[11px] text-slate-500 font-mono hidden sm:block">
            {validator.validationHint}
          </span>
        )}
      </div>

      {/* String Input Card */}
      <div className="glass-card-elevated p-6 space-y-5">
        <div className="space-y-2">
          <label htmlFor="string-input" className="text-sm font-semibold text-slate-200">
            Input String
          </label>
          <div className="relative">
            <input
              id="string-input"
              type="text"
              value={inputString}
              onChange={(e) => {
                onInputChange(e.target.value);
                setTouched(true);
              }}
              placeholder={suggestedString ? `e.g. ${suggestedString}` : 'enter a string…'}
              className="string-input-field pr-20"
              style={{
                borderColor: !touched
                  ? 'rgba(59,130,246,0.3)'
                  : canProceed
                  ? 'rgba(0,255,136,0.4)'
                  : 'rgba(239,68,68,0.35)',
              }}
              onFocus={(e) => {
                if (!touched)
                  e.target.style.borderColor = 'rgba(0,212,255,0.5)';
              }}
              onBlur={(e) => {
                if (!touched)
                  e.target.style.borderColor = 'rgba(59,130,246,0.3)';
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">|s| = {inputString.length}</span>
              {touched && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-sm"
                  style={{ color: canProceed ? '#00ff88' : '#f87171' }}
                >
                  {canProceed ? '✓' : '✗'}
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* Validation Status */}
        <AnimatePresence>
          {touched && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <ValidationRow
                ok={isValid}
                ok_text={`s ∈ L  ✓  (string is in the language)`}
                fail_text={`s ∉ L  ✗  (string is NOT in the language)`}
              />
              <ValidationRow
                ok={isLongEnough}
                ok_text={`|s| = ${inputString.length} ≥ ${pValue} = p  ✓`}
                fail_text={`|s| = ${inputString.length} < ${pValue} = p  ✗  (need at least ${pValue} characters)`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestion */}
        <div className="pt-2 border-t border-slate-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Suggested string:</span>
            <button
              id="use-suggestion-btn"
              onClick={handleUseSuggestion}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all"
              style={{
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.2)',
                color: '#a78bfa',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139,92,246,0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(139,92,246,0.08)')}
            >
              <span className="tracking-wider">{suggestedString || '—'}</span>
              <span className="text-[10px] text-slate-500">← use this</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="px-6 py-3 rounded-xl text-sm font-medium text-slate-400
            border border-slate-700/40 hover:border-slate-600/60 hover:text-slate-300
            transition-all duration-300 cursor-pointer"
        >
          ← Back
        </motion.button>
        <motion.button
          id="input-next-btn"
          onClick={onNext}
          disabled={!canProceed}
          whileHover={canProceed ? { scale: 1.02 } : {}}
          whileTap={canProceed ? { scale: 0.97 } : {}}
          className="px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
          style={{
            background: canProceed
              ? 'linear-gradient(135deg, #0ea5e9, #3b82f6)'
              : 'rgba(26,35,64,0.5)',
            color: canProceed ? 'white' : '#4a6491',
            boxShadow: canProceed ? '0 4px 20px rgba(14,165,233,0.3)' : 'none',
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
        >
          Generate Partitions →
        </motion.button>
      </div>
    </motion.div>
  );
}

function ValidationRow({ ok, ok_text, fail_text }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: ok ? '#00ff88' : '#f87171' }}
      />
      <span
        className="text-xs font-mono"
        style={{ color: ok ? '#00ff88' : '#f87171' }}
      >
        {ok ? ok_text : fail_text}
      </span>
    </div>
  );
}
