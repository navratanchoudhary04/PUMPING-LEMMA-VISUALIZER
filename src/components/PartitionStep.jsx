import { motion } from 'framer-motion';
import KaTeXBlock from './KaTeXBlock';

/**
 * PartitionStep v3 — Full-screen partition explorer
 * Large color-coded string visualizer + card-based split selection
 */
export default function PartitionStep({
  inputString, pValue, availableSplits, selectedSplitIndex,
  onSelectSplit, onNext, onBack,
}) {
  const currentSplit = availableSplits[selectedSplitIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* ── Heading ── */}
      <div className="space-y-2">
        <h2 className="text-h1 text-slate-100">Partition the String</h2>
        <p className="text-body-lg" style={{ color: 'var(--text-secondary)' }}>
          The adversary chooses any valid split <em>s = xyz</em>. Your goal: find <em>i</em> such that xyⁱz ∉ L for <strong>every</strong> split.
        </p>
      </div>

      {/* ── Two-column: visual left, table right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* LEFT: Large string visual + constraint cards */}
        <div className="space-y-5">
          {/* Constraint chips */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: '|s| ≥ p',
                value: `${inputString.length} ≥ ${pValue}`,
                ok: inputString.length >= pValue,
                note: 'String length condition',
              },
              {
                label: '|xy| ≤ p',
                value: currentSplit ? `${currentSplit.xLen + currentSplit.yLen} ≤ ${pValue}` : '—',
                ok: currentSplit ? (currentSplit.xLen + currentSplit.yLen) <= pValue : true,
                note: 'Prefix constraint',
              },
              {
                label: '|y| ≥ 1',
                value: currentSplit ? `${currentSplit.yLen} ≥ 1` : '—',
                ok: currentSplit ? currentSplit.yLen >= 1 : true,
                note: 'Non-empty y',
              },
            ].map((c) => (
              <div key={c.label}
                className="p-4 rounded-2xl text-center space-y-1"
                style={{
                  background: c.ok ? 'rgba(0,255,136,0.06)' : 'rgba(255,59,92,0.06)',
                  border: `1px solid ${c.ok ? 'rgba(0,255,136,0.2)' : 'rgba(255,59,92,0.25)'}`,
                }}
              >
                <div className="text-sm-label" style={{ color: c.ok ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {c.label}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: c.ok ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {c.value}
                </div>
                <div className="text-sm-label" style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>
                  {c.note}
                </div>
              </div>
            ))}
          </div>

          {/* Large string visualizer */}
          {currentSplit && (
            <div className="glass-elevated p-6 space-y-4 rounded-2xl">
              <div className="text-sm-label" style={{ color: 'var(--text-muted)' }}>
                Selected split #{selectedSplitIndex + 1} of {availableSplits.length}
              </div>

              {/* Characters */}
              <div className="flex flex-wrap gap-1.5 justify-center py-2">
                {inputString.split('').map((ch, i) => {
                  let segClass = 'seg-x-char';
                  if (i >= currentSplit.xLen && i < currentSplit.xLen + currentSplit.yLen) segClass = 'seg-y-char';
                  else if (i >= currentSplit.xLen + currentSplit.yLen) segClass = 'seg-z-char';
                  return (
                    <motion.div
                      key={i}
                      className={`string-char ${segClass}`}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 18 }}
                    >
                      {ch}
                    </motion.div>
                  );
                })}
              </div>

              {/* Segment labels */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { lbl: 'x', val: currentSplit.x || 'ε', len: currentSplit.xLen, cls: 'seg-x', color: 'var(--x-color)' },
                  { lbl: 'y', val: currentSplit.y, len: currentSplit.yLen, cls: 'seg-y', color: 'var(--y-color)' },
                  { lbl: 'z', val: currentSplit.z || 'ε', len: currentSplit.zLen ?? (inputString.length - currentSplit.xLen - currentSplit.yLen), cls: 'seg-z', color: 'var(--z-color)' },
                ].map((s) => (
                  <div key={s.lbl} className={`px-3 py-3 rounded-xl ${s.cls}`} style={{ borderRadius: '12px' }}>
                    <div className="text-sm-label" style={{ color: s.color, opacity: 0.7 }}>{s.lbl}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: s.color }}>
                      {s.val.length > 10 ? s.val.slice(0, 10) + '…' : s.val}
                    </div>
                    <div className="text-sm-label" style={{ color: s.color, opacity: 0.5 }}>|{s.lbl}| = {s.len}</div>
                  </div>
                ))}
              </div>

              {/* KaTeX constraint check */}
              <div className="text-center" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.6rem' }}>
                <KaTeXBlock
                  latex={`|xy| = ${currentSplit.xLen + currentSplit.yLen} \\leq ${pValue} = p \\;\\checkmark \\qquad |y| = ${currentSplit.yLen} \\geq 1 \\;\\checkmark`}
                  displayMode={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Scrollable split table */}
        <div className="glass-elevated rounded-2xl overflow-hidden">
          {/* Table header */}
          <div
            className="grid px-4 py-3 text-sm-label"
            style={{
              gridTemplateColumns: '2.8rem 1fr 1fr 1fr 2.5rem 2.5rem 4.5rem',
              background: 'rgba(0,0,0,0.3)',
              borderBottom: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            <span>#</span><span>x</span><span style={{color:'var(--y-color)'}}>y</span><span>z</span>
            <span>|y|</span><span style={{color:'var(--text-muted)'}}>|z|</span>
            <span>💡 Hint</span>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
            {availableSplits.map((split, idx) => {
              const isSelected = idx === selectedSplitIndex;
              const zLen = split.zLen ?? (inputString.length - split.xLen - split.yLen);
              const hint = split.contradictingI !== null && split.contradictingI !== undefined
                ? `i = ${split.contradictingI}` : '—';
              const hintColor = hint !== '—' ? 'var(--accent-primary)' : 'var(--text-muted)';

              return (
                <button
                  key={idx}
                  onClick={() => onSelectSplit(idx)}
                  className={`w-full text-left cursor-pointer transition-all split-row ${isSelected ? 'selected' : ''}`}
                  style={{
                    gridTemplateColumns: '2.8rem 1fr 1fr 1fr 2.5rem 2.5rem 4.5rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    display: 'grid',
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                  }}
                >
                  <span style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }}>#{idx + 1}</span>
                  <span style={{ color: 'var(--x-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {split.x || 'ε'}
                  </span>
                  <span style={{ color: 'var(--y-color)', fontWeight: 700 }}>
                    {split.y}
                  </span>
                  <span style={{ color: 'var(--z-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {split.z || 'ε'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{split.yLen}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{zLen}</span>
                  <span style={{ color: hintColor, fontWeight: 700, fontSize: '0.85rem' }}>{hint}</span>
                </button>
              );
            })}
          </div>

          <div
            className="px-4 py-2.5 flex items-center justify-between text-sm-label"
            style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            <span>{availableSplits.length} decompositions found</span>
            <span style={{ color: 'var(--accent-primary)' }}>
              Split {selectedSplitIndex + 1} selected
            </span>
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
          id="partition-next-btn"
          onClick={onNext}
          whileHover={{ scale: 1.03, x: 2 }} whileTap={{ scale: 0.97 }}
          className="px-10 py-3.5 rounded-2xl font-bold cursor-pointer transition-all duration-300 flex items-center gap-2"
          style={{ fontSize: '1.05rem', background: 'linear-gradient(135deg, #00d4ff, #4f46e5)', color: 'white', boxShadow: '0 4px 24px rgba(0,212,255,0.3)' }}
        >
          Pump This Split
          <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}>→</motion.span>
        </motion.button>
      </div>
    </motion.div>
  );
}
