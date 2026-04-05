import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const THEORY = {
  SETUP: {
    icon: '⚙',
    title: 'The Pumping Lemma Setup',
    color: '#00d4ff',
    content: [
      {
        heading: 'What is the Pumping Lemma?',
        text: 'For every regular language L, there exists a pumping length p ≥ 1 such that any string s ∈ L with |s| ≥ p can be "pumped".',
      },
      {
        heading: 'The Game-Theoretic View',
        text: 'Think of this as a 2-player game: the Adversary (a DFA) claims L is regular. You (the Prover) try to find a contradiction by pumping a string and showing the result leaves L.',
      },
      {
        heading: 'Why These Languages?',
        text: 'These 4 preset languages are classic non-regular examples — no finite automaton can track the unbounded counting they require.',
      },
      {
        heading: 'Choose Wisely',
        text: 'A larger p forces the adversary to reveal more structure in the decomposition — useful for finding contradictions faster.',
      },
    ],
  },
  INPUT: {
    icon: '✎',
    title: 'Choosing Your String',
    color: '#a78bfa',
    content: [
      {
        heading: 'The Prover\'s First Move',
        text: 'You select a string s ∈ L with |s| ≥ p. This is the string that the adversary must decompose according to the Pumping Lemma conditions.',
      },
      {
        heading: 'Strategy',
        text: 'Pick a string whose structure makes it hard for ANY decomposition to satisfy all pumping conditions. For aⁿbⁿ, use aᵖbᵖ — pumping any y substring within the first p characters will break the balance.',
      },
      {
        heading: 'The Key Insight',
        text: 'Your string must be in the language. The adversary then commits to a split. You need to defeat every possible split they could choose.',
      },
    ],
  },
  PARTITION: {
    icon: '⊞',
    title: 'Examining Decompositions',
    color: '#f59e0b',
    content: [
      {
        heading: 'The Adversary\'s Move',
        text: 'The adversary (the alleged DFA) picks the decomposition s = xyz. The Pumping Lemma guarantees |xy| ≤ p and |y| ≥ 1.',
      },
      {
        heading: 'Why |xy| ≤ p?',
        text: 'In any DFA with p states, by the Pigeonhole Principle, when reading the first p characters, some state must repeat. The "loop" corresponds to y.',
      },
      {
        heading: 'The Universality Requirement',
        text: 'A valid proof must work for ALL valid decompositions — not just one. This is why you must examine every split and find a contradiction for each.',
      },
      {
        heading: 'y is the Loop',
        text: 'The y segment represents the repeatable loop in the DFA. Pumping it (repeating 0 or more times) should stay in L if L were regular.',
      },
    ],
  },
  PUMP: {
    icon: '∞',
    title: 'Pumping & Contradiction',
    color: '#ef4444',
    content: [
      {
        heading: 'Your Final Move',
        text: 'You choose an i ≠ 1 (usually i = 0 or i = 2) and show xyⁱz ∉ L. The Pumping Lemma says xyⁱz MUST be in L for all i ≥ 0 — so this is a contradiction.',
      },
      {
        heading: 'Best Choices for i',
        text: 'i = 0 removes y entirely. i = 2 adds an extra copy. For aⁿbⁿ, i = 0 gives more a\'s than b\'s or vice versa; i = 2 also breaks the balance.',
      },
      {
        heading: 'Why i = 1 Doesn\'t Work',
        text: 'i = 1 gives xy¹z = xyz = s, which is in L by assumption. That\'s no contradiction — always try other values.',
      },
      {
        heading: 'Completeness',
        text: 'A complete proof contradicts EVERY valid decomposition. Partial proofs are illustrative but not logically complete.',
      },
    ],
  },
  PROOF: {
    icon: '∎',
    title: 'Formal Proof Structure',
    color: '#00ff88',
    content: [
      {
        heading: 'Proof by Contradiction',
        text: 'The entire argument is a proof by contradiction: Assume L is regular → Pumping Lemma applies → Choose s → Any decomposition can be pumped to leave L → Contradiction → L is not regular. □',
      },
      {
        heading: 'The 6 Steps',
        text: '1. Assume L is regular.\n2. Apply Pumping Lemma (get p).\n3. Choose s ∈ L with |s| ≥ p.\n4. For ALL decompositions s = xyz with |xy| ≤ p, |y| ≥ 1...\n5. Pick i ≠ 1 such that xyⁱz ∉ L.\n6. Contradiction → L is not regular. □',
      },
      {
        heading: 'Academic Writing',
        text: 'In exams, state each step clearly, cite the Pumping Lemma explicitly, and end with "This contradicts condition (3) of the Pumping Lemma. Therefore L is not regular. □"',
      },
    ],
  },
};

/**
 * TheoryPanel — Floating ? button + collapsible drawer with step-specific theory
 * @param {{ currentStep: string }} props
 */
export default function TheoryPanel({ currentStep }) {
  const [isOpen, setIsOpen] = useState(false);
  const theory = THEORY[currentStep] || THEORY.SETUP;

  return (
    <>
      {/* Floating ? button */}
      <button
        className="theory-fab no-print"
        onClick={() => setIsOpen((v) => !v)}
        title="Theory & Tips"
        aria-label="Open theory panel"
      >
        {isOpen ? '✕' : '?'}
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[98] no-print"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="drawer"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
            className="theory-drawer no-print"
          >
            {/* Drawer Header */}
            <div
              className="p-5 border-b shrink-0"
              style={{
                borderColor: `${theory.color}25`,
                background: `linear-gradient(135deg, ${theory.color}0a, transparent)`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                  style={{
                    background: `${theory.color}18`,
                    border: `1px solid ${theory.color}35`,
                    color: theory.color,
                  }}
                >
                  {theory.icon}
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest mb-0.5" style={{ color: theory.color }}>
                    Step Theory
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">{theory.title}</h3>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {theory.content.map((section, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: theory.color }}
                    />
                    <h4
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: theory.color }}
                    >
                      {section.heading}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pl-4 whitespace-pre-line">
                    {section.text}
                  </p>
                </motion.div>
              ))}

              {/* Pumping Lemma Statement (always visible) */}
              <div
                className="mt-4 p-4 rounded-xl text-xs text-slate-400 leading-relaxed"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="text-slate-500 uppercase tracking-widest text-[10px] mb-2">
                  Pumping Lemma (formal)
                </div>
                <span className="font-mono" style={{ color: '#00d4ff' }}>∀</span> regular L,{' '}
                <span className="font-mono" style={{ color: '#00d4ff' }}>∃</span> p ≥ 1 such that{' '}
                <span className="font-mono" style={{ color: '#a78bfa' }}>∀</span> s ∈ L with |s| ≥ p,{' '}
                <span className="font-mono" style={{ color: '#f59e0b' }}>∃</span> x,y,z: s=xyz,{' '}
                |xy|≤p, |y|≥1,{' '}
                <span className="font-mono" style={{ color: '#00ff88' }}>∀</span> i≥0: xyⁱz ∈ L.
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800/50 shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
              >
                Close Panel
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
