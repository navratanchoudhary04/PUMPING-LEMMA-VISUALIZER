/**
 * Proof Narrative Generator v2.0
 *
 * Generates a formal mathematical proof covering all splits.
 */

/**
 * Escape special LaTeX characters in a string displayed as monospace text
 */
function escapeLatex(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/[{}]/g, (m) => '\\' + m)
    .replace(/#/g, '\\#')
    .replace(/%/g, '\\%')
    .replace(/&/g, '\\&')
    .replace(/_/g, '\\_');
}

/**
 * Format segment for LaTeX — monospace or epsilon
 */
const fmt = (str) => (str && str.length > 0 ? `\\mathtt{${escapeLatex(str)}}` : '\\varepsilon');

/**
 * Generate formal proof steps (multi-split version)
 *
 * @param {object} opts
 *   languageName    : string
 *   languageLatex   : string
 *   p               : number
 *   s               : string
 *   splits          : array of split objects { x, y, z, xLen, yLen, contradictingI }
 *   contradictions  : { [splitIdx]: iValue }
 *   isRegular       : boolean
 * @returns {object} { steps: Step[], textProof: string, isComplete: boolean }
 */
export function generateProofNarrative({
  languageName,
  languageLatex,
  p,
  s,
  splits,
  contradictions,
  isRegular = false,
}) {
  const steps = [];
  const contradictedCount = Object.keys(contradictions).length;
  const isComplete = !isRegular && contradictedCount === splits.length && splits.length > 0;

  // ── Step 1: Claim ──
  if (isRegular) {
    steps.push({
      title: 'Language Regularity',
      latex: `\\text{Note: } ${languageLatex} \\text{ is a REGULAR language.}\\\\
\\text{The Pumping Lemma cannot be used to prove regularity —}\\\\
\\text{only to disprove it. All pumped strings remain in } L.`,
    });
  } else {
    steps.push({
      title: 'Claim',
      latex: `\\textbf{Claim: } ${languageLatex} \\text{ is not regular.}`,
    });

    // ── Step 2: Assumption ──
    steps.push({
      title: 'Assumption (for contradiction)',
      latex: `\\text{Assume for contradiction that } L \\text{ is regular.}\\\\
\\text{Then by the Pumping Lemma, } \\exists\\, p \\geq 1 \\text{ such that every } s \\in L\\\\
\\text{with } |s| \\geq p \\text{ can be written as } s = xyz \\text{ satisfying:}\\\\
\\quad (1)\\; |xy| \\leq p \\quad
(2)\\; |y| \\geq 1 \\quad
(3)\\; \\forall\\, i \\geq 0,\\; xy^iz \\in L`,
    });

    // ── Step 3: String choice ──
    steps.push({
      title: 'String Selection',
      latex: `\\text{Set } p = ${p}. \\text{ Choose } s = ${fmt(s)} \\in L\\text{ with } |s| = ${s.length} \\geq p.\\\\
\\text{(This string forces } y \\text{ to lie within certain positions,}\\\\
\\text{giving us the leverage to find contradictions.)}`,
    });

    // ── Step 4: Adversary constraints ──
    const prefix = s.slice(0, p);
    steps.push({
      title: 'Adversary Constraints',
      latex: `\\text{The adversary must choose a split } xyz \\text{ with } |xy| \\leq ${p},\\; |y| \\geq 1.\\\\
\\text{So } y \\text{ is confined to the prefix } ${fmt(prefix)} \\text{ of length } ${p}.\\\\
\\text{There are } \\mathbf{${splits.length}} \\text{ valid decompositions total.}`,
    });

    // ── Step 5: Each split analysis ──
    const splitLines = splits.map((split, idx) => {
      const i = contradictions[idx];
      const hasContra = i !== undefined;
      const xStr = split.x || 'ε';
      const yStr = split.y;
      const zStr = split.z || 'ε';
      if (hasContra) {
        const pumped = split.x + split.y.repeat(i) + split.z;
        return `\\text{Split #${idx + 1}: } x=${fmt(split.x) || '\\varepsilon'},\\; y=${fmt(yStr)},\\; z=${fmt(split.z) || '\\varepsilon'}: \\quad xy^{${i}}z = ${fmt(pumped.length > 30 ? pumped.slice(0, 30) + '…' : pumped)} \\notin L \\;\\checkmark`;
      } else {
        return `\\text{Split #${idx + 1}: } x=${fmt(split.x) || '\\varepsilon'},\\; y=${fmt(yStr)},\\; z=${fmt(split.z) || '\\varepsilon'}: \\quad \\text{(no contradiction found)}`;
      }
    });

    if (splits.length > 0) {
      steps.push({
        title: `All ${splits.length} Decompositions`,
        latex: splitLines.join('\\\\'),
      });
    }

    // ── Step 6: Conclusion ──
    if (isComplete) {
      steps.push({
        title: 'Conclusion',
        latex: `\\text{In ALL } ${splits.length} \\text{ valid decompositions, we found } i \\geq 0 \\text{ such that}\\\\
xy^iz \\notin L. \\text{ This violates condition (3) of the Pumping Lemma.}\\\\[0.5em]
\\boxed{\\therefore\\; L = ${languageLatex.replace('L = ', '')} \\text{ is NOT regular.} \\quad \\square}`,
      });
    } else {
      steps.push({
        title: 'Partial Result',
        latex: `\\text{Contradictions found for } ${contradictedCount} \\text{ of } ${splits.length} \\text{ splits.}\\\\
\\text{To complete the proof, all } ${splits.length} \\text{ splits must be contradicted.}\\\\
\\text{Continue pumping the remaining splits.}`,
      });
    }
  }

  // ── Plain text version for copy/PDF ──
  const textProof = generateTextProof({
    languageName,
    p,
    s,
    splits,
    contradictions,
    isComplete,
    isRegular,
  });

  return { steps, textProof, isComplete };
}

/**
 * Generate a plain-text version of the proof (for PDF)
 */
export function generateTextProof({ languageName, p, s, splits, contradictions, isComplete, isRegular }) {
  const lines = [];
  lines.push('═══════════════════════════════════════════════');
  lines.push('  FORMAL PROOF — PUMPING LEMMA VISUALIZER');
  lines.push('═══════════════════════════════════════════════');
  lines.push('');
  if (isRegular) {
    lines.push(`Claim: L = ${languageName} is a REGULAR language.`);
    lines.push('');
    lines.push('Note: The Pumping Lemma cannot prove regularity.');
    lines.push('Every valid split xyz satisfies: for all i ≥ 0, xyⁱz ∈ L.');
    lines.push('This is consistent with L being regular.');
  } else {
    lines.push(`Claim: L = ${languageName} is NOT regular.`);
    lines.push('');
    lines.push('Proof (by contradiction using the Pumping Lemma):');
    lines.push('');
    lines.push(`Assume L is regular. Then ∃ pumping length p = ${p} such that every`);
    lines.push(`s ∈ L with |s| ≥ p can be written as s = xyz where:`);
    lines.push('  (1) |xy| ≤ p');
    lines.push('  (2) |y| ≥ 1');
    lines.push('  (3) ∀ i ≥ 0: xyⁱz ∈ L');
    lines.push('');
    lines.push(`Choose s = "${s}" ∈ L, |s| = ${s.length} ≥ p = ${p}.`);
    lines.push('');
    lines.push(`The adversary must produce xyz with |xy| ≤ ${p}, |y| ≥ 1.`);
    lines.push(`This gives ${splits.length} valid decomposition(s):`);
    lines.push('');
    splits.forEach((split, idx) => {
      const iVal = contradictions[idx];
      const x = split.x || 'ε';
      const y = split.y;
      const z = split.z || 'ε';
      if (iVal !== undefined) {
        const pumped = split.x + split.y.repeat(iVal) + split.z;
        lines.push(`  Split #${idx + 1}: x="${x}", y="${y}", z="${z}"`);
        lines.push(`    → xy^${iVal}z = "${pumped.length > 50 ? pumped.slice(0,50)+'…' : pumped}" ∉ L  ✓ Contradiction`);
      } else {
        lines.push(`  Split #${idx + 1}: x="${x}", y="${y}", z="${z}" — no contradiction found`);
      }
    });
    lines.push('');
    if (isComplete) {
      lines.push(`In all ${splits.length} valid decompositions, ∃ i such that xyⁱz ∉ L.`);
      lines.push('This violates the Pumping Lemma.');
      lines.push('');
      lines.push(`∴ L = ${languageName} is NOT regular. □`);
    } else {
      lines.push(`Contradictions found for ${Object.keys(contradictions).length}/${splits.length} splits.`);
      lines.push('Proof incomplete — not all splits were contradicted.');
    }
  }
  lines.push('');
  lines.push('═══════════════════════════════════════════════');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('Pumping Lemma Visualizer — BTech Theory of Computation');
  return lines.join('\n');
}
