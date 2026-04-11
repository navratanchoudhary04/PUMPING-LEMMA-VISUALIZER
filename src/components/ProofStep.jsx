import { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KaTeXBlock from './KaTeXBlock';
import { generateProofNarrative } from '../engine/proofGenerator';
import { pumpString } from '../engine/splitter';

export default function ProofStep({
  validator, inputString, pValue,
  availableSplits, contradictions,
  sessionHistory, onBack, onReset,
}) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const isRegular = validator?.isRegular === true;

  const proof = useMemo(() => {
    if (!validator) return null;
    return generateProofNarrative({
      languageName:  validator.name,
      languageLatex: validator.latex,
      p: pValue, s: inputString,
      splits: availableSplits,
      contradictions, isRegular,
    });
  }, [validator, pValue, inputString, availableSplits, contradictions, isRegular]);

  const contradictedCount = Object.keys(contradictions).length;
  const isComplete = !isRegular && contradictedCount === availableSplits.length && availableSplits.length > 0;

  const handleCopy = async () => {
    const text = proof?.textProof || '';
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2200);
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const text = proof?.textProof || 'No proof generated.';
      const lines = doc.splitTextToSize(text, 170);
      const pageH = 297; const margin = 20; let y = margin;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.setTextColor(20, 20, 20);
      doc.text('Pumping Lemma — Formal Proof', margin, y); y += 7;

      doc.setFont('courier', 'normal'); doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Language: ${validator?.name} | p = ${pValue} | ${new Date().toLocaleDateString()}`, margin, y); y += 4;
      doc.setDrawColor(0, 180, 220); doc.setLineWidth(0.5);
      doc.line(margin, y, 190, y); y += 8;

      doc.setFontSize(10); doc.setTextColor(20, 20, 20);
      for (const line of lines) {
        if (y > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(line, margin, y); y += 5;
      }
      doc.save(`proof-${validator?.name?.replace(/[^a-z0-9]/gi, '_') || 'proof'}.pdf`);
    } catch (e) { console.error('PDF failed:', e); window.print(); }
    finally { setPdfLoading(false); }
  };

  if (!proof) {
    return <div className="text-center py-24" style={{ color: 'var(--text-muted)' }}>No proof to display. Go back and find contradictions.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* ── Verdict banner ── */}
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 240, damping: 22 }}
        className="text-center py-8 px-6 rounded-2xl"
        style={
          isRegular
          ? { background: 'rgba(0,212,255,0.05)', border: '1.5px solid rgba(0,212,255,0.2)' }
          : isComplete
          ? { background: 'rgba(0,255,136,0.06)', border: '1.5px solid rgba(0,255,136,0.22)', boxShadow: '0 0 64px rgba(0,255,136,0.07)' }
          : { background: 'rgba(255,214,10,0.05)', border: '1.5px solid rgba(255,214,10,0.18)' }
        }
      >
        <div style={{
          fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900,
          background: isRegular ? 'linear-gradient(90deg,#00d4ff,#bf5fff)' : isComplete ? 'linear-gradient(90deg,#00ff88,#00d4ff)' : 'none',
          color: isRegular || isComplete ? 'transparent' : 'var(--accent-yellow)',
          WebkitBackgroundClip: isRegular || isComplete ? 'text' : undefined,
          backgroundClip: isRegular || isComplete ? 'text' : undefined,
          WebkitTextFillColor: isRegular || isComplete ? 'transparent' : undefined,
          marginBottom: '0.5rem',
        }}>
          {isRegular
            ? 'ℹ Regular Language — No Contradiction Expected'
            : isComplete
            ? `✅ PROVED: ${validator?.name} is NOT regular!`
            : `⚠ Incomplete — ${contradictedCount}/${availableSplits.length} splits contradicted`}
        </div>
        <p className="text-body-lg" style={{ color: 'var(--text-secondary)' }}>
          {isRegular
            ? 'Regular languages satisfy the pumping property — every valid split yields xyⁱz ∈ L.'
            : isComplete
            ? 'All valid decompositions have been contradicted. ∎ QED'
            : 'To complete the proof, every possible split must yield a contradiction.'}
        </p>
        <div className="flex items-center justify-center gap-8 mt-4 flex-wrap">
          {[
            { lbl: 'Language', val: validator?.name, color: 'var(--accent-primary)' },
            { lbl: 'p', val: pValue, color: 'var(--accent-purple)' },
            { lbl: 'String s', val: inputString.length > 14 ? inputString.slice(0,14)+'…' : inputString, color: 'var(--text-primary)', mono: true },
            { lbl: 'Splits done', val: `${contradictedCount}/${availableSplits.length}`, color: isComplete ? 'var(--accent-green)' : 'var(--accent-yellow)' },
          ].map((cell) => (
            <div key={cell.lbl} className="text-center">
              <div className="text-sm-label" style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{cell.lbl}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: cell.color, fontFamily: cell.mono ? 'var(--font-mono)' : undefined }}>{cell.val}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Formal proof steps ── */}
      <div className="glass-elevated p-8 rounded-2xl space-y-8 proof-block">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 rounded-full" style={{ background: 'linear-gradient(180deg,var(--accent-primary),var(--accent-purple))' }} />
          <h2 className="text-h2">Formal Proof</h2>
        </div>

        {proof.steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 * i, duration: 0.4 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0"
                style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--accent-primary)', border: '1.5px solid rgba(0,212,255,0.25)' }}
              >
                {i + 1}
              </span>
              <h3 className="text-h3" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
            </div>
            <div
              className="ml-12 p-5 rounded-xl overflow-x-auto"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <KaTeXBlock latex={step.latex} displayMode={true} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Contradictions table ── */}
      {contradictedCount > 0 && (
        <div className="glass-elevated p-6 rounded-2xl space-y-4">
          <h3 className="text-h3">Found Contradictions ({contradictedCount}/{availableSplits.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
              <thead style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {['Split','x','y','z','i','xyⁱz','Result'].map(h => <th key={h} className="text-left py-2 px-3">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.entries(contradictions).map(([idx, i]) => {
                  const split = availableSplits[idx];
                  if (!split) return null;
                  const ps = pumpString(split.x, split.y, split.z, i);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="py-2.5 px-3" style={{ color: 'var(--text-muted)' }}>#{+idx+1}</td>
                      <td className="py-2.5 px-3" style={{ color: 'var(--x-color)' }}>{split.x||'ε'}</td>
                      <td className="py-2.5 px-3 font-bold" style={{ color: 'var(--y-color)' }}>{split.y}</td>
                      <td className="py-2.5 px-3" style={{ color: 'var(--z-color)' }}>{split.z||'ε'}</td>
                      <td className="py-2.5 px-3 font-bold" style={{ color: 'var(--accent-yellow)' }}>{i}</td>
                      <td className="py-2.5 px-3 max-w-[180px] truncate" style={{ color: 'var(--text-secondary)' }}>
                        {ps.length > 20 ? ps.slice(0,20)+'…' : ps}
                      </td>
                      <td className="py-2.5 px-3 font-bold" style={{ color: 'var(--accent-red)' }}>∉ L ✗</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Export buttons ── */}
      <div className="glass p-5 rounded-2xl flex flex-wrap items-center gap-3 no-print">
        <span className="text-sm-label" style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>Export Proof</span>
        <motion.button
          onClick={handleCopy} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all"
          style={{
            background: copySuccess ? 'rgba(0,255,136,0.1)' : 'rgba(0,212,255,0.08)',
            border: `1px solid ${copySuccess ? 'rgba(0,255,136,0.3)' : 'rgba(0,212,255,0.2)'}`,
            color: copySuccess ? 'var(--accent-green)' : 'var(--accent-primary)',
            fontSize: '0.9rem',
          }}
        >
          {copySuccess ? '✓ Copied!' : '📋 Copy Proof'}
        </motion.button>
        <motion.button
          onClick={handleDownloadPDF} disabled={pdfLoading}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all"
          style={{
            background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
            color: 'var(--accent-purple)', opacity: pdfLoading ? 0.7 : 1, fontSize: '0.9rem',
          }}
        >
          {pdfLoading ? '⏳ Generating…' : '📄 Download PDF'}
        </motion.button>
      </div>

      {/* ── Navigation ── */}
      <div className="flex justify-between pt-2 no-print">
        <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="px-7 py-3.5 rounded-xl font-semibold cursor-pointer transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-dim)', color: 'var(--text-secondary)', fontSize: '1rem' }}>
          ← Back to Pump
        </motion.button>
        <motion.button
          id="reset-btn"
          onClick={onReset} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="px-10 py-3.5 rounded-2xl font-bold cursor-pointer transition-all"
          style={{ fontSize: '1.05rem', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', boxShadow: '0 4px 24px rgba(124,58,237,0.3)' }}
        >
          Start New Proof ↻
        </motion.button>
      </div>
    </motion.div>
  );
}
