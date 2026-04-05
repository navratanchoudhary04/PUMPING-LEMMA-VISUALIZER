import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KaTeXBlock from './KaTeXBlock';
import { generateProofNarrative } from '../engine/proofGenerator';
import { pumpString } from '../engine/splitter';

/**
 * ProofStep — Formal proof display with copy, print, and session history
 *
 * Props:
 *   validator       : object — active language validator
 *   inputString     : string
 *   pValue          : number
 *   availableSplits : Array<{x,y,z,xLen,yLen}>
 *   contradictions  : { [splitIdx]: pumpPower }
 *   sessionHistory  : Array<HistoryEntry>
 *   onBack          : () => void
 *   onReset         : () => void
 */
export default function ProofStep({
  validator,
  inputString,
  pValue,
  availableSplits,
  contradictions,
  sessionHistory,
  onBack,
  onReset,
}) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Pick first contradiction as showcase
  const showcaseIndex = Object.keys(contradictions)[0];
  const showcaseSplit = availableSplits[showcaseIndex];
  const showcaseI     = contradictions[showcaseIndex];
  const pumpedStr     = showcaseSplit
    ? pumpString(showcaseSplit.x, showcaseSplit.y, showcaseSplit.z, showcaseI)
    : '';

  const proof = useMemo(() => {
    if (!showcaseSplit || !validator) return null;
    return generateProofNarrative({
      languageName:  validator.name,
      languageLatex: validator.latex,
      p:             pValue,
      s:             inputString,
      x:             showcaseSplit.x,
      y:             showcaseSplit.y,
      z:             showcaseSplit.z,
      i:             showcaseI,
      pumpedString:  pumpedStr,
      isInLanguage:  false,
    });
  }, [showcaseSplit, showcaseI, validator, pValue, inputString, pumpedStr]);

  if (!proof) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm font-mono">
        No contradictions found yet. Go back and pump the string.
      </div>
    );
  }

  // ── Plain-text proof for clipboard ───────────────────────
  const buildPlainTextProof = () => {
    const lines = [
      `PUMPING LEMMA PROOF`,
      `Language: ${validator?.name || '?'}`,
      `String: ${inputString}   |p| = ${pValue}`,
      ``,
      ...proof.steps.map((step, i) => [
        `Step ${i + 1}: ${step.title}`,
        step.latex.replace(/\\[a-zA-Z]+|[{}\\]/g, ' ').replace(/\s+/g, ' ').trim(),
        '',
      ].join('\n')),
      `Contradictions: ${Object.keys(contradictions).length}/${availableSplits.length} splits`,
      `Verdict: ${validator?.name || 'L'} is NOT regular. □`,
    ];
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainTextProof());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = buildPlainTextProof();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="w-full space-y-8"
    >
      {/* ── Verdict Banner ── */}
      <div className="verdict-banner">
        <div className="verdict-text mb-2">✅ PROVED: L is NOT regular!</div>
        <p className="text-sm" style={{ color: 'rgba(0,255,136,0.6)' }}>
          Formal proof by contradiction using the Pumping Lemma
        </p>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs font-mono text-slate-500">
          <span>Language: <span className="text-slate-300">{validator?.name}</span></span>
          <span>p = <span style={{ color: '#00d4ff' }}>{pValue}</span></span>
          <span>
            Contradictions:{' '}
            <span style={{ color: '#00ff88' }}>
              {Object.keys(contradictions).length}/{availableSplits.length}
            </span>
          </span>
        </div>
      </div>

      {/* ── Summary Card ── */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg,#00d4ff,#a78bfa)' }} />
          <h3 className="text-sm font-semibold text-slate-200">Proof Summary</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <SummaryCell label="Language" value={validator?.name} color="#00d4ff" />
          <SummaryCell label="Pumping Length" value={`p = ${pValue}`} color="#a78bfa" mono />
          <SummaryCell
            label="String"
            value={inputString.length > 12 ? inputString.slice(0, 12) + '…' : inputString}
            mono
          />
          <SummaryCell
            label="Contradictions"
            value={`${Object.keys(contradictions).length}/${availableSplits.length}`}
            color="#00ff88"
          />
        </div>
      </div>

      {/* ── Proof Narrative ── */}
      <div className="glass-card-elevated p-6 sm:p-8 space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(180deg,#0ea5e9,#a78bfa)' }} />
          <h3 className="text-lg font-bold text-slate-100">Formal Proof</h3>
        </div>

        {proof.steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * index, duration: 0.4 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0"
                style={{
                  background: 'rgba(14,165,233,0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(14,165,233,0.25)',
                }}
              >
                {index + 1}
              </span>
              <h4 className="text-sm font-semibold text-slate-200">{step.title}</h4>
            </div>
            <div
              className="ml-10 p-4 rounded-xl overflow-x-auto"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <KaTeXBlock latex={step.latex} displayMode={true} />
            </div>
            {index < proof.steps.length - 1 && (
              <div
                className="ml-[13px] w-[2px] h-4 rounded-full"
                style={{ background: 'rgba(71,85,105,0.3)' }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* ── All Contradictions Table ── */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">All Contradictions Found</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800/50">
                <th className="text-left py-2 px-3">Split #</th>
                <th className="text-left py-2 px-3">x</th>
                <th className="text-left py-2 px-3">y</th>
                <th className="text-left py-2 px-3">z</th>
                <th className="text-left py-2 px-3">i</th>
                <th className="text-left py-2 px-3">xy<sup>i</sup>z</th>
                <th className="text-left py-2 px-3">Result</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(contradictions).map(([idx, i]) => {
                const split = availableSplits[idx];
                const ps    = pumpString(split.x, split.y, split.z, i);
                return (
                  <tr
                    key={idx}
                    className="border-b border-slate-800/40 transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(26,35,64,0.4)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td className="py-2 px-3 text-slate-400">#{parseInt(idx) + 1}</td>
                    <td className="py-2 px-3 text-slate-300">{split.x || 'ε'}</td>
                    <td className="py-2 px-3 font-semibold" style={{ color: '#00d4ff' }}>{split.y}</td>
                    <td className="py-2 px-3 text-slate-400">{split.z || 'ε'}</td>
                    <td className="py-2 px-3" style={{ color: '#fbbf24' }}>{i}</td>
                    <td className="py-2 px-3 text-slate-300 max-w-[140px] truncate">
                      {ps.length > 18 ? ps.slice(0, 18) + '…' : ps}
                    </td>
                    <td className="py-2 px-3 font-semibold" style={{ color: '#f87171' }}>∉ L</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Session History ── */}
      {sessionHistory && sessionHistory.length > 1 && (
        <div className="glass-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">Session History</h3>
          <div className="space-y-2">
            {sessionHistory.map((entry, idx) => (
              <div key={idx} className="history-card">
                <span className="text-slate-300 font-mono">{entry.language}</span>
                <span className="text-slate-500 font-mono truncate">
                  {entry.string.length > 10 ? entry.string.slice(0, 10) + '…' : entry.string}
                </span>
                <span style={{ color: '#00ff88' }} className="font-semibold text-xs">
                  NOT REGULAR
                </span>
                <span className="text-slate-600 text-[10px]">{entry.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div
        className="glass-card p-4 flex flex-wrap items-center gap-3 no-print"
        style={{ borderColor: 'rgba(0,212,255,0.1)' }}
      >
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">
          Export
        </h4>

        {/* Copy */}
        <motion.button
          onClick={handleCopy}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          style={{
            background: copySuccess ? 'rgba(0,255,136,0.12)' : 'rgba(0,212,255,0.1)',
            border: copySuccess ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(0,212,255,0.25)',
            color: copySuccess ? '#00ff88' : '#00d4ff',
          }}
        >
          {copySuccess ? '✓ Copied!' : '⧉ Copy Proof'}
        </motion.button>

        {/* Print / PDF */}
        <motion.button
          onClick={handlePrint}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          style={{
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.25)',
            color: '#a78bfa',
          }}
        >
          ⬇ Download PDF
        </motion.button>
      </div>

      {/* ── Navigation ── */}
      <div className="flex justify-between no-print">
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="px-6 py-3 rounded-xl text-sm font-medium text-slate-400
            border border-slate-700/40 hover:border-slate-600/60 hover:text-slate-300
            transition-all duration-300 cursor-pointer"
        >
          ← Back to Pump
        </motion.button>
        <motion.button
          id="reset-btn"
          onClick={onReset}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 30px rgba(124,58,237,0.5)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.3)')}
        >
          Start New Proof ↻
        </motion.button>
      </div>
    </motion.div>
  );
}

/** Small summary stat cell */
function SummaryCell({ label, value, color, mono }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div
        className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`}
        style={{ color: color || '#cdd8e7' }}
      >
        {value}
      </div>
    </div>
  );
}
