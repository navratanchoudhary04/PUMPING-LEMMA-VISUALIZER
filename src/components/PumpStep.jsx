import { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KaTeXBlock from './KaTeXBlock';
import StringVisualizer from './StringVisualizer';
import { pumpString } from '../engine/splitter';

/**
 * PumpStep — Adjust i to find xyⁱz ∉ L
 *
 * Props:
 *   validator          : object — active language validator
 *   inputString        : string
 *   pValue             : number
 *   availableSplits    : Array<{x,y,z,xLen,yLen}>
 *   selectedSplitIndex : number
 *   pumpPower          : number
 *   onPumpPowerChange  : (i) => void
 *   onSelectSplit      : (idx) => void
 *   onNext             : () => void
 *   onBack             : () => void
 *   contradictions     : { [splitIdx]: pumpPower }
 *   onContradictionFound : (splitIdx, pumpPower) => void
 */
export default function PumpStep({
  validator,
  inputString,
  pValue,
  availableSplits,
  selectedSplitIndex,
  pumpPower,
  onPumpPowerChange,
  onSelectSplit,
  onNext,
  onBack,
  contradictions,
  onContradictionFound,
}) {
  const currentSplit = availableSplits[selectedSplitIndex];
  const [showEureka, setShowEureka] = useState(false);
  const [triedPowers, setTriedPowers] = useState({}); // { splitIdx: Set<number> }
  const [attemptedNext, setAttemptedNext] = useState(false);
  const celebrateRef = useRef(false);

  // ── Computed pumped string & validity ────────────────────
  const pumped = useMemo(() => {
    if (!currentSplit || !validator) return { str: '', isInLanguage: true };
    const str = pumpString(currentSplit.x, currentSplit.y, currentSplit.z, pumpPower);
    let isInLanguage = true;
    try {
      isInLanguage = validator.validate(str);
    } catch {
      isInLanguage = false;
    }
    return { str, isInLanguage };
  }, [currentSplit, pumpPower, validator]);

  const isContradiction = !pumped.isInLanguage;

  // ── Track which i values have been tried ─────────────────
  useEffect(() => {
    setTriedPowers((prev) => {
      const existing = prev[selectedSplitIndex] || new Set();
      if (existing.has(pumpPower)) return prev;
      return {
        ...prev,
        [selectedSplitIndex]: new Set([...existing, pumpPower]),
      };
    });
  }, [pumpPower, selectedSplitIndex]);

  // ── Record contradiction ──────────────────────────────────
  useEffect(() => {
    if (isContradiction && currentSplit) {
      onContradictionFound(selectedSplitIndex, pumpPower);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isContradiction, selectedSplitIndex, pumpPower]);

  // ── Eureka animation ──────────────────────────────────────
  useEffect(() => {
    if (isContradiction) {
      setShowEureka(true);
      const t = setTimeout(() => setShowEureka(false), 2800);
      return () => clearTimeout(t);
    }
  }, [isContradiction, selectedSplitIndex, pumpPower]);

  // ── All splits contradicted? ──────────────────────────────
  const contradictedCount = Object.keys(contradictions).length;
  const allContradicted   = availableSplits.length > 0 && contradictedCount === availableSplits.length;
  const hasAnyContradiction = contradictedCount > 0;

  // ── Celebration on full completion ───────────────────────
  useEffect(() => {
    if (allContradicted && !celebrateRef.current) {
      celebrateRef.current = true;
    }
  }, [allContradicted]);

  // ── Sorted tried powers for the badge row ────────────────
  const splitTriedPowers = Array.from(triedPowers[selectedSplitIndex] || []).sort((a, b) => a - b);

  if (!validator) {
    return <div className="text-center text-slate-500 py-16">No language selected.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
          Pump the String
        </h2>
        <p className="text-slate-400 text-sm">
          Adjust{' '}
          <span className="font-mono" style={{ color: '#00d4ff' }}>i</span> to find{' '}
          <span className="font-mono" style={{ color: '#a5b4fc' }}>
            xy<sup>i</sup>z ∉ L
          </span>
        </p>
      </div>

      {/* Eureka Banner */}
      <AnimatePresence>
        {showEureka && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="glass-card contradiction-border p-4 text-center"
            style={{ borderColor: 'rgba(239,68,68,0.4)' }}
          >
            <div className="font-bold text-lg" style={{ color: '#f87171' }}>
              ⚡ Contradiction Found!
            </div>
            <p className="text-xs mt-1 font-mono" style={{ color: 'rgba(248,113,113,0.7)' }}>
              {pumped.str.length > 30 ? pumped.str.slice(0, 30) + '…' : pumped.str} ∉ L
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* String Ruler */}
      {currentSplit && (
        <div
          className="glass-card-elevated p-6 transition-all duration-500"
          style={{
            borderColor: isContradiction
              ? 'rgba(239,68,68,0.3)'
              : pumped.isInLanguage
              ? 'rgba(0,255,136,0.18)'
              : undefined,
            boxShadow: isContradiction
              ? '0 0 30px rgba(239,68,68,0.08)'
              : undefined,
          }}
        >
          <div className="mb-4">
            <StringVisualizer
              x={currentSplit.x}
              y={currentSplit.y}
              z={currentSplit.z}
              pumpPower={pumpPower}
              pValue={pValue}
              showPZone={false}
              showLoopArrow={true}
              compact={pumped.str.length > 20}
            />
          </div>

          {/* Membership result */}
          <motion.div
            key={`${selectedSplitIndex}-${pumpPower}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 rounded-lg text-center text-sm font-mono"
            style={{
              background: isContradiction ? 'rgba(239,68,68,0.07)' : 'rgba(0,255,136,0.07)',
              border: isContradiction ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(0,255,136,0.18)',
              color: isContradiction ? '#f87171' : '#4ade80',
            }}
          >
            <KaTeXBlock
              latex={`xy^{${pumpPower}}z = \\mathtt{${
                pumped.str.length > 40
                  ? pumped.str.slice(0, 40) + '\\ldots'
                  : pumped.str
              }} ${isContradiction ? '\\notin L \\;\\;✗' : '\\in L \\;\\;✓'}`}
              displayMode={false}
            />
          </motion.div>
        </div>
      )}

      {/* ── Pump Slider with i badge ── */}
      <div className="glass-card-elevated p-6 space-y-5">
        <div className="flex items-center gap-4">
          {/* Large i badge */}
          <div className="pump-i-badge shrink-0">
            i={pumpPower}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Pump Power</h3>
              <span className="text-xs text-slate-500 font-mono">
                |xy<sup>i</sup>z| = {pumped.str.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600 font-mono w-4 text-right">0</span>
              <input
                id="pump-slider"
                type="range"
                min="0"
                max="15"
                value={pumpPower}
                onChange={(e) => onPumpPowerChange(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-slate-600 font-mono w-6">15</span>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-2 flex-wrap">
              {[0, 1, 2, 3, 5, 10].map((v) => (
                <button
                  key={v}
                  onClick={() => onPumpPowerChange(v)}
                  className="px-3 py-1 rounded-lg text-xs font-mono font-medium cursor-pointer transition-all"
                  style={{
                    background: pumpPower === v
                      ? 'rgba(0,212,255,0.12)'
                      : 'rgba(26,35,64,0.5)',
                    border: pumpPower === v
                      ? '1px solid rgba(0,212,255,0.3)'
                      : '1px solid rgba(71,85,105,0.2)',
                    color: pumpPower === v ? '#00d4ff' : '#4a6491',
                  }}
                >
                  i={v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Per-i result badges */}
        {splitTriedPowers.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
              Tried values for this split:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {splitTriedPowers.map((i) => {
                const ps = pumpString(currentSplit?.x || '', currentSplit?.y || '', currentSplit?.z || '', i);
                let inLang = true;
                try { inLang = validator.validate(ps); } catch { inLang = false; }
                const isContra = !inLang;
                return (
                  <button
                    key={i}
                    onClick={() => onPumpPowerChange(i)}
                    className={`pump-result-badge ${isContra ? 'pump-result-badge-contra' : 'pump-result-badge-ok'}`}
                    title={isContra ? `i=${i} → contradiction` : `i=${i} → still in L`}
                  >
                    <span>i={i}</span>
                    <span>{isContra ? '❌' : '✓'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Split Progress ── */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Split Progress</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">
              {contradictedCount}/{availableSplits.length} contradicted
            </span>
            {allContradicted && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="text-sm"
              >
                🎉
              </motion.span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableSplits.map((_, idx) => {
            const hasContra = contradictions[idx] !== undefined;
            const isCurrent = idx === selectedSplitIndex;
            return (
              <button
                key={idx}
                onClick={() => onSelectSplit(idx)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer"
                style={{
                  background: isCurrent
                    ? 'rgba(0,212,255,0.12)'
                    : hasContra
                    ? 'rgba(0,255,136,0.07)'
                    : 'rgba(26,35,64,0.4)',
                  border: isCurrent
                    ? '2px solid rgba(0,212,255,0.4)'
                    : hasContra
                    ? '1px solid rgba(0,255,136,0.25)'
                    : '1px solid rgba(71,85,105,0.15)',
                  color: isCurrent
                    ? '#00d4ff'
                    : hasContra
                    ? '#4ade80'
                    : '#4a6491',
                }}
              >
                #{idx + 1} {hasContra ? '✓' : ''}
              </button>
            );
          })}
        </div>

        {/* All contradicted celebration */}
        {allContradicted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl text-center success-glow"
            style={{
              background: 'rgba(0,255,136,0.07)',
              border: '1px solid rgba(0,255,136,0.2)',
            }}
          >
            <span className="font-semibold text-sm" style={{ color: '#4ade80' }}>
              🎉 All {availableSplits.length} splits contradicted! Ready to generate proof.
            </span>
          </motion.div>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="flex justify-between items-center relative">
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

        <div className="flex flex-col items-end gap-2">
          <motion.button
            id="pump-next-btn"
            onClick={() => {
              if (hasAnyContradiction) {
                onNext();
              } else {
                setAttemptedNext(true);
                setTimeout(() => setAttemptedNext(false), 3000);
              }
            }}
            whileHover={hasAnyContradiction ? { scale: 1.02 } : { scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer"
            style={{
              background: hasAnyContradiction
                ? allContradicted
                  ? 'linear-gradient(135deg, #16a34a, #15803d)'
                  : 'linear-gradient(135deg, #0ea5e9, #3b82f6)'
                : 'rgba(26,35,64,0.5)',
              color: hasAnyContradiction ? 'white' : '#4a6491',
              boxShadow: hasAnyContradiction
                ? allContradicted
                  ? '0 4px 20px rgba(22,163,74,0.35)'
                  : '0 4px 20px rgba(14,165,233,0.3)'
                : 'none',
              border: hasAnyContradiction ? 'none' : '1px solid rgba(71,85,105,0.3)',
            }}
          >
            {allContradicted ? '✓ Generate Full Proof →' : 'Generate Proof →'}
          </motion.button>

          <AnimatePresence>
            {attemptedNext && !hasAnyContradiction && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  color: '#fbbf24',
                }}
              >
                Find at least one contradiction first!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
