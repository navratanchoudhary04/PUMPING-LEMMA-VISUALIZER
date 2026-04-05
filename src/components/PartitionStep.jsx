import { useMemo } from 'react';
import { motion } from 'framer-motion';
import KaTeXBlock from './KaTeXBlock';
import StringVisualizer from './StringVisualizer';

/**
 * PartitionStep — Examine all valid decompositions s = xyz
 *
 * Props:
 *   inputString        : string
 *   pValue             : number
 *   availableSplits    : Array<{x,y,z,xLen,yLen}>
 *   selectedSplitIndex : number
 *   onSelectSplit      : (index) => void
 *   onNext             : () => void
 *   onBack             : () => void
 */
export default function PartitionStep({
  inputString,
  pValue,
  availableSplits,
  selectedSplitIndex,
  onSelectSplit,
  onNext,
  onBack,
}) {
  const currentSplit = availableSplits[selectedSplitIndex];

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
          Examine Partitions
        </h2>
        <p className="text-slate-400 text-sm">
          The adversary presents all valid decompositions of{' '}
          <span className="font-mono" style={{ color: '#00d4ff' }}>s = xyz</span>
        </p>
      </div>

      {/* String Ruler Preview */}
      {currentSplit && (
        <div className="glass-card-elevated p-6">
          <StringVisualizer
            x={currentSplit.x}
            y={currentSplit.y}
            z={currentSplit.z}
            pumpPower={1}
            pValue={pValue}
            showPZone={true}
            showLoopArrow={false}
          />
        </div>
      )}

      {/* Split Detail Card */}
      {currentSplit && (
        <div className="glass-card p-4">
          <div className="flex flex-wrap gap-6 justify-center text-sm font-mono mb-3">
            <SegmentChip label="x" value={currentSplit.x} len={currentSplit.xLen} color="#94a3b8" bg="rgba(148,163,184,0.08)" border="rgba(148,163,184,0.18)" />
            <SegmentChip label="y" value={currentSplit.y} len={currentSplit.yLen} color="#00d4ff" bg="rgba(0,212,255,0.08)" border="rgba(0,212,255,0.25)" />
            <SegmentChip
              label="z"
              value={currentSplit.z}
              len={inputString.length - currentSplit.xLen - currentSplit.yLen}
              color="#64748b"
              bg="rgba(71,85,105,0.08)"
              border="rgba(71,85,105,0.18)"
            />
          </div>
          <div className="text-center">
            <KaTeXBlock
              latex={`|xy| = ${currentSplit.xLen + currentSplit.yLen} \\leq ${pValue} = p \\;\\checkmark \\qquad |y| = ${currentSplit.yLen} \\geq 1 \\;\\checkmark`}
              displayMode={false}
            />
          </div>
        </div>
      )}

      {/* Split Selector Table */}
      <div className="glass-card-elevated p-5 space-y-3">
        {/* Table header row */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-200">All Valid Splits</h3>
          <span
            className="text-xs font-mono font-semibold px-3 py-1 rounded-full"
            style={{
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.2)',
              color: '#00d4ff',
            }}
          >
            {availableSplits.length} decomposition{availableSplits.length !== 1 ? 's' : ''} found
          </span>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
          {availableSplits.map((split, index) => {
            const isSelected = index === selectedSplitIndex;
            const zLen = inputString.length - split.xLen - split.yLen;
            return (
              <motion.button
                key={index}
                onClick={() => onSelectSplit(index)}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                title={`|x| = ${split.xLen}, |y| = ${split.yLen}, |z| = ${zLen}`}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left cursor-pointer transition-all duration-200"
                style={{
                  background: isSelected
                    ? 'rgba(0,212,255,0.07)'
                    : 'rgba(26,35,64,0.35)',
                  border: isSelected
                    ? '1px solid rgba(0,212,255,0.3)'
                    : '1px solid rgba(71,85,105,0.15)',
                  boxShadow: isSelected ? '0 0 15px rgba(0,212,255,0.07)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.15)';
                    e.currentTarget.style.background = 'rgba(26,35,64,0.55)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(71,85,105,0.15)';
                    e.currentTarget.style.background = 'rgba(26,35,64,0.35)';
                  }
                }}
              >
                {/* Index badge */}
                <span
                  className="text-xs font-mono min-w-[2.5rem] text-center py-0.5 rounded shrink-0"
                  style={{
                    background: isSelected ? 'rgba(0,212,255,0.12)' : 'rgba(26,35,64,0.8)',
                    color: isSelected ? '#00d4ff' : '#4a6491',
                    border: isSelected ? '1px solid rgba(0,212,255,0.2)' : '1px solid rgba(71,85,105,0.15)',
                  }}
                >
                  #{index + 1}
                </span>

                {/* xyz display */}
                <div className="flex items-center gap-1 font-mono text-xs flex-1 min-w-0">
                  <span className="text-slate-400 truncate">{split.x || 'ε'}</span>
                  <span className="text-slate-700 shrink-0">|</span>
                  <span className="font-semibold shrink-0" style={{ color: '#00d4ff' }}>{split.y}</span>
                  <span className="text-slate-700 shrink-0">|</span>
                  <span className="text-slate-500 truncate">{split.z || 'ε'}</span>
                </div>

                {/* Lengths tooltip */}
                <div className="flex gap-3 text-[10px] font-mono text-slate-600 shrink-0">
                  <span>|x|={split.xLen}</span>
                  <span style={{ color: isSelected ? 'rgba(0,212,255,0.7)' : undefined }}>
                    |y|={split.yLen}
                  </span>
                  <span>|z|={zLen}</span>
                </div>
              </motion.button>
            );
          })}
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
          id="partition-next-btn"
          onClick={onNext}
          whileHover={{ scale: 1.02, x: 2 }}
          whileTap={{ scale: 0.97 }}
          className="px-8 py-3 rounded-xl font-semibold text-sm cursor-pointer transition-all duration-300 flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 30px rgba(14,165,233,0.5)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(14,165,233,0.3)')}
        >
          Pump This Split
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          >
            →
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  );
}

/** Small chip showing one xyz segment */
function SegmentChip({ label, value, len, color, bg, border }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color }}>{label} =</span>
      <span
        className="px-2 py-0.5 rounded font-semibold"
        style={{ background: bg, border: `1px solid ${border}`, color }}
      >
        {value || 'ε'}
      </span>
      <span className="text-slate-600 text-xs">({len})</span>
    </div>
  );
}
