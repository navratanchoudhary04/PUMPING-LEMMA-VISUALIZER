import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KaTeXBlock from './KaTeXBlock';
import { pumpString } from '../engine/splitter';

/**
 * PumpStep v3 — Full-screen pump visualizer
 * - Live animated string as i changes
 * - Controls panel on right
 * - Red contradiction panel (only red in the app)
 * - Dynamic membership conditions
 */
export default function PumpStep({
  validator, inputString, pValue,
  availableSplits, selectedSplitIndex, pumpPower,
  onPumpPowerChange, onSelectSplit,
  contradictions, onContradictionFound,
  onNext, onBack,
}) {
  const [prevPower, setPrevPower] = useState(pumpPower);
  const [shakeKey, setShakeKey] = useState(0);
  const maxI = 15;

  const currentSplit = availableSplits[selectedSplitIndex];
  const contradictedCount = Object.keys(contradictions).length;
  const allContradicted = contradictedCount === availableSplits.length && availableSplits.length > 0;

  const pumpedString = useMemo(() => {
    if (!currentSplit) return '';
    return pumpString(currentSplit.x, currentSplit.y, currentSplit.z, pumpPower);
  }, [currentSplit, pumpPower]);

  const isInLanguage = useMemo(() => {
    if (!validator || !pumpedString) return true;
    try { return validator.validate(pumpedString); } catch { return false; }
  }, [validator, pumpedString]);

  const isContradiction = !isInLanguage && pumpPower !== 1;
  const isCurrentContradicted = contradictions[selectedSplitIndex] !== undefined;

  // Auto-register contradiction
  useEffect(() => {
    if (isContradiction && !isCurrentContradicted) {
      onContradictionFound(selectedSplitIndex, pumpPower);
    }
  }, [isContradiction, selectedSplitIndex, pumpPower, isCurrentContradicted, onContradictionFound]);

  // Shake on contradiction
  const prevContradiction = useRef(false);
  useEffect(() => {
    if (isContradiction && !prevContradiction.current) setShakeKey((k) => k + 1);
    prevContradiction.current = isContradiction;
  }, [isContradiction]);

  const handlePowerChange = (v) => {
    setPrevPower(pumpPower);
    onPumpPowerChange(v);
  };

  const goNextSplit = () => {
    if (selectedSplitIndex < availableSplits.length - 1) {
      onSelectSplit(selectedSplitIndex + 1);
      onPumpPowerChange(1);
    }
  };
  const goPrevSplit = () => {
    if (selectedSplitIndex > 0) {
      onSelectSplit(selectedSplitIndex - 1);
      onPumpPowerChange(1);
    }
  };

  const handleHint = () => {
    if (currentSplit?.contradictingI != null) {
      handlePowerChange(currentSplit.contradictingI);
    } else {
      handlePowerChange(0);
    }
  };

  // Build pumped string chars with colors
  const charGroups = useMemo(() => {
    if (!currentSplit) return [];
    const groups = [];

    // x chars
    for (let i = 0; i < currentSplit.x.length; i++) {
      groups.push({ ch: currentSplit.x[i], type: 'x', key: `x-${i}` });
    }
    // y^i chars
    for (let rep = 0; rep < pumpPower; rep++) {
      for (let i = 0; i < currentSplit.y.length; i++) {
        groups.push({ ch: currentSplit.y[i], type: 'y', key: `y-r${rep}-${i}`, isNew: rep >= prevPower });
      }
    }
    // z chars
    for (let i = 0; i < currentSplit.z.length; i++) {
      groups.push({ ch: currentSplit.z[i], type: 'z', key: `z-${i}` });
    }

    return groups;
  }, [currentSplit, pumpPower, prevPower]);

  // Dynamic membership conditions
  const conditions = useMemo(() => {
    if (!validator || !pumpedString) return [];
    const s = pumpedString;
    const lang = validator.id;
    const countA = (str) => str.split('').filter((c) => c === 'a').length;
    const countB = (str) => str.split('').filter((c) => c === 'b').length;
    const countC = (str) => str.split('').filter((c) => c === 'c').length;
    switch (lang) {
      case 'anbn':        return [{ lbl: 'count(a)', val: countA(s) }, { lbl: 'count(b)', val: countB(s) }, { lbl: 'Equal?', val: countA(s) === countB(s) ? '✓ YES' : '✗ NO', bad: countA(s) !== countB(s) }];
      case 'anbn2':       return [{ lbl: 'count(a)', val: countA(s) }, { lbl: 'count(b)', val: countB(s) }, { lbl: 'b = 2a?', val: countB(s) === 2*countA(s) ? '✓ YES' : '✗ NO', bad: countB(s) !== 2*countA(s) }];
      case 'anbncn':      return [{ lbl: 'count(a)', val: countA(s) }, { lbl: 'count(b)', val: countB(s) }, { lbl: 'count(c)', val: countC(s) }, { lbl: 'a=b=c?', val: countA(s)===countB(s)&&countB(s)===countC(s)?'✓ YES':'✗ NO', bad: !(countA(s)===countB(s)&&countB(s)===countC(s)) }];
      case 'wwreverse':   return [{ lbl: '|s|', val: s.length }, { lbl: 'Even?', val: s.length%2===0?'✓ YES':'✗ NO', bad: s.length%2!==0 }, { lbl: 'w=wᴿ?', val: s===s.split('').reverse().join('')?'✓ YES':'✗ NO', bad: s!==s.split('').reverse().join('') }];
      default:            return [{ lbl: '|s\'|', val: s.length }, { lbl: 'Valid?', val: isInLanguage ? '✓ IN L' : '✗ NOT IN L', bad: !isInLanguage }];
    }
  }, [validator, pumpedString, isInLanguage]);

  if (!currentSplit) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* ── Heading + split nav ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h2 className="text-h1 text-slate-100">Pump the String</h2>
          <p className="text-body-lg" style={{ color: 'var(--text-secondary)' }}>
            Adjust <em>i</em> to find xy<sup>i</sup>z ∉ L. Red = contradiction.
          </p>
        </div>
        {/* Split navigation */}
        <div className="flex items-center gap-2">
          <button onClick={goPrevSplit} disabled={selectedSplitIndex === 0}
            className="cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-dim)', color: 'var(--text-secondary)' }}>
            ← Prev
          </button>
          <div className="text-center px-4 py-2 rounded-xl text-sm font-mono font-bold"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid var(--border-accent)', color: 'var(--accent-primary)', minWidth: '110px' }}>
            {selectedSplitIndex + 1} / {availableSplits.length}
            <div className="text-xs font-normal" style={{ color: 'var(--accent-green)' }}>
              {contradictedCount} ✓ done
            </div>
          </div>
          <button onClick={goNextSplit} disabled={selectedSplitIndex === availableSplits.length - 1}
            className="cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-dim)', color: 'var(--text-secondary)' }}>
            Next →
          </button>
        </div>
      </div>

      {/* ── Main grid: big visualizer + controls side panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left (2/3): animated string visualizer */}
        <div className="lg:col-span-2 space-y-5">

          {/* String display */}
          <div className="glass-elevated p-6 rounded-2xl space-y-5">
            {/* Labels above cluster */}
            <div className="flex justify-between text-sm-label" style={{ color: 'var(--text-muted)' }}>
              <span>xy<sup>{pumpPower}</sup>z = pumped string</span>
              <span>|s'| = {pumpedString.length}</span>
            </div>

            {/* Characters - animated */}
            <motion.div
              layout
              className="flex flex-wrap gap-1.5 justify-center py-2 min-h-[64px]"
              key={shakeKey}
              animate={isContradiction ? { x: [0, -8, 8, -5, 5, 0] } : {}}
              transition={isContradiction ? { duration: 0.45 } : {}}
            >
              <AnimatePresence mode="popLayout">
                {charGroups.map((cg) => (
                  <motion.div
                    key={cg.key}
                    layout
                    initial={{ scale: 0.3, opacity: 0, y: -16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.2, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                    className={`string-char ${
                      cg.type === 'x' ? 'seg-x-char' :
                      cg.type === 'y' ? 'seg-y-char' :
                      'seg-z-char'
                    }`}
                  >
                    {cg.ch}
                  </motion.div>
                ))}
                {/* Show ε if empty */}
                {charGroups.length === 0 && (
                  <motion.div key="empty" className="string-char seg-y-char" style={{ fontSize: '1rem' }}>ε</motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Segment legend */}
            <div className="flex gap-4 justify-center flex-wrap text-sm">
              {[
                { lbl: 'x', color: 'var(--x-color)', bg: 'var(--x-dim)', border: 'var(--x-border)', val: currentSplit.x || 'ε' },
                { lbl: 'y', color: 'var(--y-color)', bg: 'var(--y-dim)', border: 'var(--y-border)', val: currentSplit.y },
                { lbl: 'z', color: 'var(--z-color)', bg: 'var(--z-dim)', border: 'var(--z-border)', val: currentSplit.z || 'ε' },
              ].map((s) => (
                <div key={s.lbl} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono"
                  style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                  <span className="font-bold">{s.lbl}</span>
                  <span>= {s.val.length > 8 ? s.val.slice(0, 8) + '…' : s.val}</span>
                </div>
              ))}
            </div>

            {/* KaTeX formula */}
            <div className="text-center py-2 px-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <KaTeXBlock
                latex={`xy^{${pumpPower}}z = \\texttt{${pumpedString.length > 24 ? pumpedString.slice(0,24) + '\\cdots' : pumpedString || '\\varepsilon'}}`}
                displayMode={true}
              />
            </div>
          </div>

          {/* Conditions grid */}
          <div className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.min(conditions.length, 4)}, 1fr)` }}>
            {conditions.map((cond, i) => (
              <motion.div
                key={i}
                className="p-4 rounded-xl text-center"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                style={{
                  background: cond.bad ? 'rgba(255,59,92,0.08)' : 'rgba(0,255,136,0.05)',
                  border: `1px solid ${cond.bad ? 'rgba(255,59,92,0.25)' : 'rgba(0,255,136,0.15)'}`,
                }}
              >
                <div className="text-sm-label" style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  {cond.lbl}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800,
                  color: cond.bad ? 'var(--accent-red)' : typeof cond.val === 'string' ? 'var(--accent-green)' : 'var(--accent-primary)',
                }}>
                  {cond.val}
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Contradiction panel (RED — only red area) ── */}
          <AnimatePresence>
            {isContradiction && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="contradiction-panel"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <span style={{ fontSize: '2.2rem' }}>🎯</span>
                  <div className="flex-1 space-y-1">
                    <div className="contradiction-title">CONTRADICTION FOUND!</div>
                    <div className="text-body" style={{ color: 'rgba(255,100,120,0.9)' }}>
                      xy<sup>{pumpPower}</sup>z&nbsp; = &nbsp;
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        "{pumpedString.length > 28 ? pumpedString.slice(0, 28) + '…' : pumpedString}"
                      </span>
                      &nbsp;∉&nbsp;L
                    </div>
                    <div className="text-body" style={{ color: 'rgba(255,100,120,0.7)', fontSize: '0.9rem' }}>
                      Split #{selectedSplitIndex + 1} is contradicted with i = {pumpPower}
                    </div>
                  </div>
                  <div
                    className="px-4 py-2 rounded-xl font-mono font-bold text-center"
                    style={{ background: 'rgba(255,59,92,0.15)', border: '1px solid rgba(255,59,92,0.3)', color: 'var(--accent-red)', fontSize: '1.3rem' }}
                  >
                    i = {pumpPower}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Non-contradiction when i = 1 explanation */}
          <AnimatePresence>
            {pumpPower === 1 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-5 py-3 rounded-xl text-body"
                style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', color: 'var(--text-muted)', fontSize: '0.9rem' }}
              >
                ℹ i = 1 always gives xy¹z = the original string s ∈ L. Try i = 0 or i = 2 to find a contradiction.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT (1/3): pump power controls */}
        <div className="space-y-5">
          {/* i badge */}
          <div className="glass-elevated p-6 rounded-2xl space-y-5">
            <div className="text-sm-label" style={{ color: 'var(--text-muted)' }}>Pump Power i</div>
            <div className="pump-i-badge mx-auto">
              {pumpPower}
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <input
                type="range" min="0" max={maxI} value={pumpPower}
                onChange={(e) => handlePowerChange(+e.target.value)}
                id="pump-slider"
                style={{ width: '100%' }}
              />
              <div className="flex justify-between text-sm-label" style={{ color: 'var(--text-muted)' }}>
                <span>0</span><span>{maxI}</span>
              </div>
            </div>

            {/* Quick pick buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[0, 1, 2, 3, 5, 7, 10].map((v) => (
                <button
                  key={v}
                  onClick={() => handlePowerChange(v)}
                  className="cursor-pointer transition-all font-mono font-bold rounded-xl px-3 py-1.5"
                  style={{
                    fontSize: '0.95rem',
                    background: pumpPower === v ? 'var(--y-dim)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${pumpPower === v ? 'var(--y-border)' : 'var(--border-dim)'}`,
                    color: pumpPower === v ? 'var(--y-color)' : 'var(--text-muted)',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Hint button */}
            {currentSplit?.contradictingI != null && (
              <button
                onClick={handleHint}
                className="w-full cursor-pointer px-4 py-3 rounded-xl font-semibold transition-all text-sm"
                style={{ background: 'rgba(255,214,10,0.08)', border: '1px solid rgba(255,214,10,0.25)', color: 'var(--accent-yellow)' }}
              >
                💡 Hint: use i = {currentSplit.contradictingI}
              </button>
            )}
          </div>

          {/* Validity pill */}
          <div
            className="px-5 py-4 rounded-2xl text-center"
            style={{
              background: isContradiction ? 'rgba(255,59,92,0.07)' : 'rgba(0,255,136,0.06)',
              border: `1px solid ${isContradiction ? 'rgba(255,59,92,0.3)' : 'rgba(0,255,136,0.18)'}`,
            }}
          >
            <div className="text-sm-label" style={{ color: 'var(--text-muted)', marginBottom: '0.4rem' }}>xy<sup>i</sup>z ∈ L ?</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.5rem',
              color: isContradiction ? 'var(--accent-red)' : 'var(--accent-green)',
            }}>
              {isContradiction ? '✗ NOT IN L' : '✓ IN L'}
            </div>
          </div>

          {/* Tried values for this split */}
          <div className="glass p-4 rounded-2xl space-y-2">
            <div className="text-sm-label" style={{ color: 'var(--text-muted)' }}>Tried values</div>
            <div className="flex flex-wrap gap-1.5">
              {[...Array(Math.min(pumpPower + 1, maxI + 1)).keys()].map((v) => {
                const pumped = pumpString(currentSplit.x, currentSplit.y, currentSplit.z, v);
                let inL = true;
                try { inL = validator.validate(pumped); } catch { inL = false; }
                const isContra = !inL && v !== 1;
                return (
                  <span
                    key={v}
                    className="px-2 py-0.5 rounded font-mono text-sm font-semibold"
                    style={{
                      background: isContra ? 'rgba(255,59,92,0.12)' : 'rgba(0,255,136,0.07)',
                      border: `1px solid ${isContra ? 'rgba(255,59,92,0.3)' : 'rgba(0,255,136,0.15)'}`,
                      color: isContra ? 'var(--accent-red)' : 'var(--accent-green)',
                    }}
                  >
                    i={v} {isContra ? '✗' : '✓'}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Progress badges for all splits */}
          <div className="space-y-2">
            <div className="text-sm-label" style={{ color: 'var(--text-muted)' }}>Split progress</div>
            <div className="flex flex-wrap gap-1.5">
              {availableSplits.map((_, idx) => {
                const done = contradictions[idx] !== undefined;
                const active = idx === selectedSplitIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => { onSelectSplit(idx); onPumpPowerChange(1); }}
                    className="cursor-pointer px-2.5 py-0.5 rounded-lg font-mono font-bold text-sm transition-all"
                    style={{
                      background: done ? 'rgba(0,255,136,0.1)' : active ? 'rgba(191,95,255,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${done ? 'rgba(0,255,136,0.3)' : active ? 'rgba(191,95,255,0.35)' : 'var(--border-dim)'}`,
                      color: done ? 'var(--accent-green)' : active ? 'var(--y-color)' : 'var(--text-muted)',
                    }}
                  >
                    #{idx + 1}{done ? ' ✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>
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
          id="pump-next-btn"
          onClick={onNext}
          disabled={contradictedCount === 0}
          whileHover={contradictedCount > 0 ? { scale: 1.03 } : {}} whileTap={contradictedCount > 0 ? { scale: 0.97 } : {}}
          className="px-10 py-3.5 rounded-2xl font-bold transition-all duration-300"
          style={{
            fontSize: '1.05rem',
            background: contradictedCount > 0 ? 'linear-gradient(135deg, #00d4ff, #4f46e5)' : 'rgba(255,255,255,0.04)',
            color: contradictedCount > 0 ? 'white' : 'var(--text-muted)',
            boxShadow: contradictedCount > 0 ? '0 4px 24px rgba(0,212,255,0.3)' : 'none',
            cursor: contradictedCount > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Generate Proof →
        </motion.button>
      </div>
    </motion.div>
  );
}
