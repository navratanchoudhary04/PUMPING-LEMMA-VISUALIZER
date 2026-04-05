import { motion, AnimatePresence } from 'framer-motion';
import KaTeXBlock from './KaTeXBlock';
import CustomLanguageEditor from './CustomLanguageEditor';
import Validators from '../engine/validators';

const PRESET_LANGUAGES = Object.values(Validators);

// Custom language card definition (static, not a validator)
const CUSTOM_CARD = {
  id: 'custom',
  displayName: '✏ Custom',
  latex: 'L = \\{\\text{your language}\\}',
  description: 'Define your own non-regular language with a custom membership validator',
};

/**
 * SetupStep — Choose language and pumping length
 *
 * Props:
 *   activeLanguage      : string
 *   pValue              : number
 *   customLanguage      : object|null
 *   onLanguageChange    : (id) => void
 *   onPChange           : (p) => void
 *   onApplyCustomLanguage : (lang) => void
 *   onNext              : () => void
 */
export default function SetupStep({
  activeLanguage,
  pValue,
  customLanguage,
  onLanguageChange,
  onPChange,
  onApplyCustomLanguage,
  onNext,
}) {
  const selectedPreset = Validators[activeLanguage];
  const isCustom = activeLanguage === 'custom';
  const canProceed = !isCustom || (isCustom && customLanguage !== null);

  const allCards = [...PRESET_LANGUAGES, CUSTOM_CARD];

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
          Choose a Language
        </h2>
        <p className="text-slate-400 text-sm">
          Select a non-regular language to prove it cannot be pumped
        </p>
      </div>

      {/* Language Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {allCards.map((lang) => {
          const isSelected = activeLanguage === lang.id;
          return (
            <motion.button
              key={lang.id}
              onClick={() => onLanguageChange(lang.id)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`lang-card relative ${isSelected ? 'selected' : ''}`}
            >
              {/* Checkmark badge */}
              <div className="checkmark-badge">✓</div>

              {/* Top row: indicator dot + id */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-2.5 h-2.5 rounded-full mt-0.5 transition-all duration-300"
                  style={{
                    background: isSelected ? 'var(--color-primary)' : '#334970',
                    boxShadow: isSelected ? '0 0 10px rgba(0,212,255,0.5)' : 'none',
                  }}
                />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600">
                  {lang.id}
                </span>
              </div>

              {/* Language formula */}
              <div className="mb-2">
                <KaTeXBlock
                  latex={lang.latex}
                  displayMode={false}
                />
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {lang.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Custom Language Editor (shown only when "custom" selected) */}
      <AnimatePresence>
        {isCustom && (
          <CustomLanguageEditor onApply={onApplyCustomLanguage} />
        )}
      </AnimatePresence>

      {/* Pumping Length Selector */}
      <div className="glass-card-elevated p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide">
              Pumping Length
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the value of{' '}
              <span className="font-mono" style={{ color: '#00d4ff' }}>p</span>{' '}
              for the adversary
            </p>
          </div>
          <div className="flex items-center gap-2">
            <KaTeXBlock latex={`p = ${pValue}`} displayMode={false} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 font-mono">2</span>
          <input
            id="p-value-slider"
            type="range"
            min="2"
            max="10"
            value={pValue}
            onChange={(e) => onPChange(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-500 font-mono">10</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[2, 3, 4, 5, 6, 7, 8].map((v) => (
            <button
              key={v}
              onClick={() => onPChange(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 cursor-pointer"
              style={{
                background: pValue === v ? 'rgba(0,212,255,0.12)' : 'rgba(26,35,64,0.5)',
                border: pValue === v ? '1px solid rgba(0,212,255,0.35)' : '1px solid rgba(71,85,105,0.25)',
                color: pValue === v ? '#00d4ff' : '#4a6491',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Language Info Panel */}
      <AnimatePresence>
        {selectedPreset && !isCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa' }} />
              <h3 className="text-sm font-semibold text-slate-200">Validation Logic</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              {selectedPreset.explanation}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Alphabet:</span>
              <div className="flex gap-1">
                {selectedPreset.alphabet.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded font-mono text-slate-300"
                    style={{ background: 'rgba(26,35,64,0.8)', border: '1px solid rgba(71,85,105,0.3)' }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
            {selectedPreset.validationHint && (
              <p className="text-[11px] text-slate-500 italic">
                💡 {selectedPreset.validationHint}
              </p>
            )}
          </motion.div>
        )}

        {/* Custom language applied info */}
        {isCustom && customLanguage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-5 space-y-3"
            style={{ borderColor: 'rgba(0,212,255,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: 'var(--color-primary)', boxShadow: '0 0 8px rgba(0,212,255,0.5)' }}
              />
              <h3 className="text-sm font-semibold text-slate-200">Custom Language Applied</h3>
              <span
                className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded"
                style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}
              >
                ✓ Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{customLanguage.description}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Alphabet:</span>
              <div className="flex gap-1">
                {customLanguage.alphabet.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded font-mono text-slate-300"
                    style={{ background: 'rgba(26,35,64,0.8)', border: '1px solid rgba(71,85,105,0.3)' }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom warning if not yet applied */}
      <AnimatePresence>
        {isCustom && !customLanguage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs text-amber-400/80 font-mono"
          >
            ⚠ Define and apply your custom language above before continuing
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Button */}
      <div className="flex justify-end">
        <motion.button
          id="setup-next-btn"
          onClick={onNext}
          disabled={!canProceed}
          whileHover={canProceed ? { scale: 1.02 } : {}}
          whileTap={canProceed ? { scale: 0.97 } : {}}
          className="px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer"
          style={{
            background: canProceed
              ? 'linear-gradient(135deg, #0ea5e9, #3b82f6)'
              : 'rgba(26,35,64,0.5)',
            color: canProceed ? 'white' : '#4a6491',
            boxShadow: canProceed ? '0 4px 20px rgba(14,165,233,0.3)' : 'none',
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
        >
          Continue to Input →
        </motion.button>
      </div>
    </motion.div>
  );
}
