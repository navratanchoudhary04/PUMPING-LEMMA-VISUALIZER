/**
 * Proof Narrative Generator
 * 
 * Generates a formal mathematical proof narrative based on the user's
 * session values (p, s, x, y, z, i) using KaTeX-compatible LaTeX.
 */

/**
 * Generate the formal proof narrative as a LaTeX string
 * 
 * @param {object} params
 * @param {string} params.languageName - Display name of the language
 * @param {string} params.languageLatex - LaTeX definition of the language
 * @param {number} params.p - The pumping length
 * @param {string} params.s - The chosen string
 * @param {string} params.x - The x segment
 * @param {string} params.y - The y segment
 * @param {string} params.z - The z segment
 * @param {number} params.i - The pump power that creates a contradiction
 * @param {string} params.pumpedString - The resulting pumped string
 * @param {boolean} params.isInLanguage - Whether the pumped string is in the language
 * @returns {object} - { steps: string[], fullProof: string }
 */
export function generateProofNarrative({
  languageName,
  languageLatex,
  p,
  s,
  x,
  y,
  z,
  i,
  pumpedString,
  isInLanguage
}) {
  const steps = [];

  // Helper: format a segment for LaTeX display
  const fmt = (str) => str ? `\\mathtt{${escapeLatex(str)}}` : '\\varepsilon';

  // Step 1: Assumption
  steps.push({
    title: 'Assumption (for contradiction)',
    latex: `\\text{Assume } ${languageLatex} \\text{ is regular.}`
  });

  // Step 2: Pumping Lemma invocation
  steps.push({
    title: 'Pumping Lemma Application',
    latex: `\\text{By the Pumping Lemma, } \\exists \\, p \\geq 1 \\text{ (the pumping length) such that}\\\\
\\text{any string } s \\in L \\text{ with } |s| \\geq p \\text{ can be written as } s = xyz \\text{ where:}\\\\
\\quad 1. \\; |xy| \\leq p \\\\
\\quad 2. \\; |y| \\geq 1 \\\\
\\quad 3. \\; \\forall \\, i \\geq 0, \\; xy^iz \\in L`
  });

  // Step 3: String choice
  steps.push({
    title: 'String Selection',
    latex: `\\text{Let } p = ${p}. \\text{ Choose } s = \\mathtt{${escapeLatex(s)}} \\in L \\text{ with } |s| = ${s.length} \\geq p.`
  });

  // Step 4: Decomposition
  steps.push({
    title: 'Decomposition',
    latex: `\\text{Consider the decomposition } s = xyz \\text{ where:}\\\\
\\quad x = ${fmt(x)}, \\quad |x| = ${x.length}\\\\
\\quad y = ${fmt(y)}, \\quad |y| = ${y.length}\\\\
\\quad z = ${fmt(z)}, \\quad |z| = ${z.length}\\\\
\\text{Verify: } |xy| = ${x.length + y.length} \\leq ${p} = p \\; \\checkmark \\quad |y| = ${y.length} \\geq 1 \\; \\checkmark`
  });

  // Step 5: Pump
  steps.push({
    title: 'Pumping',
    latex: `\\text{Pump with } i = ${i}: \\\\
xy^{${i}}z = ${fmt(x)} \\cdot {${fmt(y)}}^{${i}} \\cdot ${fmt(z)} = \\mathtt{${escapeLatex(pumpedString)}}\\\\
|xy^{${i}}z| = ${pumpedString.length}`
  });

  // Step 6: Contradiction
  if (!isInLanguage) {
    steps.push({
      title: 'Contradiction',
      latex: `\\mathtt{${escapeLatex(pumpedString)}} \\notin L \\\\
\\text{This contradicts condition (3) of the Pumping Lemma.}\\\\
\\text{Therefore, our assumption that } L \\text{ is regular must be false.}\\\\
\\boxed{L = ${languageLatex.replace('L = ', '')} \\text{ is not regular.}}`
    });
  } else {
    steps.push({
      title: 'No Contradiction',
      latex: `\\mathtt{${escapeLatex(pumpedString)}} \\in L \\\\
\\text{No contradiction found with } i = ${i} \\text{ for this split.}\\\\
\\text{Try a different value of } i \\text{ or check other splits.}`
    });
  }

  // Build full proof string
  const fullProof = steps
    .map((step, idx) => `\\textbf{Step ${idx + 1}: ${step.title}}\\\\[0.5em]\n${step.latex}`)
    .join('\\\\[1.5em]\n');

  return { steps, fullProof };
}

/**
 * Escape special LaTeX characters in a string
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
