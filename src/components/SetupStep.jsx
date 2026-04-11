import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KaTeXBlock from './KaTeXBlock';
import CustomLanguageEditor from './CustomLanguageEditor';
import Validators from '../engine/validators';

const PRESET_LANGUAGES = Object.values(Validators);

const CUSTOM_CARD = {
  id: 'custom',
  displayName: '✏ Custom',
  latex: 'L = \\{\\text{define your own}\\}',
  description: 'Define your own language using JavaScript, templates, or a regex',
  isRegular: null,
};

const BADGE = {
  'false': { cls: 'badge-nonreg', label: 'Non-Regular' },
  'true':  { cls: 'badge-reg',    label: 'Regular' },
  'null':  { cls: 'badge-custom', label: 'Custom' },
};

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: [0.4,0,0.2,1] } }),
};

export default function SetupStep({
  activeLanguage, pValue, customLanguage,
  onLanguageChange, onPChange, onApplyCustomLanguage, onNext,
}) {
  const selectedPreset = Validators[activeLanguage];
  const isCustom = activeLanguage === 'custom';
  const canProceed = !isCustom || customLanguage !== null;
  const activeValidator = isCustom ? customLanguage : selectedPreset;
  const showRegularBanner = activeValidator?.isRegular === true;

  const allCards = [...PRESET_LANGUAGES, CUSTOM_CARD];

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
        <h2 className="text-h1 text-slate-100">Select a Language</h2>
        <p className="text-body-lg" style={{ color: 'var(--text-secondary)' }}>
          Choose the language <em>L</em> whose regularity you want to investigate using the Pumping Lemma.
        </p>
      </div>

      {/* ── Regular language info banner ── */}
      <AnimatePresence>
        {showRegularBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-3 px-5 py-4 rounded-xl"
            style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', color: 'var(--accent-primary)' }}
          >
            <span className="text-xl mt-0.5">ℹ</span>
            <div>
              <div className="font-semibold text-body">Regular Language Selected</div>
              <div className="text-body" style={{ color: 'var(--text-secondary)' }}>
                The Pumping Lemma cannot disprove regularity — all xyⁱz strings will remain in L. You can still visualize the pumping process.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Language card grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {allCards.map((lang, i) => {
          const isSelected = activeLanguage === lang.id;
          const badge = BADGE[String(lang.isRegular)] ?? BADGE['null'];
          return (
            <motion.button
              key={lang.id}
              custom={i}
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.025, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onLanguageChange(lang.id)}
              className={`lang-card ${isSelected ? 'selected' : ''}`}
              style={{ minHeight: '130px' }}
            >
              <div className="checkmark-badge">✓</div>
              <span className={badge.cls} style={{ position: 'absolute', top: '0.65rem', left: '0.65rem' }}>
                {badge.label}
              </span>
              <div className="mt-6 mb-2" style={{ fontSize: '1.05em' }}>
                <KaTeXBlock latex={lang.latex} displayMode={false} />
              </div>
              <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {lang.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* ── Custom Language Editor ── */}
      <AnimatePresence>
        {isCustom && <CustomLanguageEditor onApply={onApplyCustomLanguage} />}
      </AnimatePresence>

      {/* ── Pumping Length ── */}
      <div className="glass-elevated p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-h3">Pumping Length <em>p</em></h3>
            <p className="text-body" style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              The adversary's chosen pumping constant. All strings <em>s ∈ L</em> with |s| ≥ p must be pumpable.
            </p>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 800,
              color: 'var(--accent-primary)', textShadow: '0 0 24px rgba(0,212,255,0.4)',
            }}
          >
            p = {pValue}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm-label" style={{ color: 'var(--text-muted)', minWidth: '1rem' }}>2</span>
          <input type="range" min="2" max="12" value={pValue} onChange={(e) => onPChange(+e.target.value)} className="flex-1" id="p-value-slider" />
          <span className="text-sm-label" style={{ color: 'var(--text-muted)', minWidth: '1.5rem' }}>12</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[2,3,4,5,6,7,8,10,12].map((v) => (
            <button
              key={v} onClick={() => onPChange(v)}
              className="cursor-pointer transition-all duration-150 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold"
              style={{
                background: pValue === v ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: pValue === v ? '1px solid rgba(0,212,255,0.35)' : '1px solid var(--border-dim)',
                color: pValue === v ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── Selected language detail card ── */}
      <AnimatePresence>
        {selectedPreset && !isCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass p-5 space-y-3"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-purple)' }} />
              <h3 className="text-h3">Language Details</h3>
              <span className={BADGE[String(selectedPreset.isRegular)]?.cls ?? 'badge-custom'} style={{ marginLeft: 'auto' }}>
                {selectedPreset.isRegular ? 'Regular' : 'Non-Regular'}
              </span>
            </div>
            <div className="text-body" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              {selectedPreset.explanation}
            </div>
            {selectedPreset.theoryNote && (
              <div className="px-4 py-3 rounded-xl text-body" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                💡 {selectedPreset.theoryNote}
              </div>
            )}
            <div className="flex items-center gap-2 text-body" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span>Alphabet Σ =</span>
              <div className="flex gap-1">
                {selectedPreset.alphabet.map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded font-mono font-semibold" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-dim)', color: 'var(--text-primary)' }}>{c}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        {isCustom && customLanguage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass p-5 space-y-2"
            style={{ borderColor: 'rgba(0,212,255,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-primary)', boxShadow: '0 0 8px rgba(0,212,255,0.5)' }} />
              <h3 className="text-h3">Custom Language Applied ✓</h3>
            </div>
            <p className="text-body" style={{ color: 'var(--text-secondary)' }}>{customLanguage.description}</p>
            <div className="flex items-center gap-2 text-body" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span>Σ =</span>
              {customLanguage.alphabet.map((c) => (
                <span key={c} className="px-2 py-0.5 rounded font-mono font-semibold" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-dim)', color: 'var(--text-primary)' }}>{c}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Warning if custom not set ── */}
      <AnimatePresence>
        {isCustom && !customLanguage && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center text-body"
            style={{ color: 'var(--accent-yellow)', fontFamily: 'var(--font-mono)' }}
          >
            ⚠ Define and apply your custom language above before continuing
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Next button ── */}
      <div className="flex justify-end pt-2">
        <motion.button
          id="setup-next-btn"
          onClick={onNext}
          disabled={!canProceed}
          whileHover={canProceed ? { scale: 1.03 } : {}}
          whileTap={canProceed ? { scale: 0.97 } : {}}
          className="px-10 py-4 rounded-2xl font-bold transition-all duration-300 cursor-pointer"
          style={{
            fontSize: '1.05rem',
            background: canProceed ? 'linear-gradient(135deg, #00d4ff, #4f46e5)' : 'rgba(255,255,255,0.04)',
            color: canProceed ? 'white' : 'var(--text-muted)',
            boxShadow: canProceed ? '0 4px 24px rgba(0,212,255,0.3)' : 'none',
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
        >
          Continue to Input →
        </motion.button>
      </div>
    </motion.div>
  );
}
