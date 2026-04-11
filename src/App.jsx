import { useState, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Stepper from './components/Stepper';
import SetupStep from './components/SetupStep';
import InputStep from './components/InputStep';
import PartitionStep from './components/PartitionStep';
import PumpStep from './components/PumpStep';
import ProofStep from './components/ProofStep';
import TheoryPanel from './components/TheoryPanel';
import { generateValidSplits } from './engine/splitter';
import { getValidator } from './engine/validators';

// ── Initial wizard state ───────────────────────────────────
const INITIAL_STATE = {
  activeLanguage: 'anbn',
  p_value: 4,
  inputString: '',
  availableSplits: [],
  selectedSplitIndex: 0,
  pumpPower: 1,
  appState: 'SETUP',
  contradictions: {},  // { splitIndex: pumpPower that contradicts }
  customLanguage: null, // custom language object when activeLanguage === 'custom'
};

// Smallest delay promise helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  // Session history survives resets (stays across multiple proofs this session)
  const [sessionHistory, setSessionHistory] = useState([]);
  const autoSolveAbortRef = useRef(false);

  // ── Derived: active validator ──────────────────────────────
  const activeValidator = useMemo(
    () => getValidator(state.activeLanguage, state.customLanguage),
    [state.activeLanguage, state.customLanguage]
  );

  // ── Generic state updater ──────────────────────────────────
  const updateState = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // ── Handlers ──────────────────────────────────────────────

  const handleLanguageChange = useCallback((id) => {
    updateState({
      activeLanguage: id,
      inputString: '',
      availableSplits: [],
      contradictions: {},
      // Don't clear customLanguage when switching back to preset
    });
  }, [updateState]);

  const handlePChange = useCallback((p) => {
    updateState({ p_value: p, inputString: '', availableSplits: [], contradictions: {} });
  }, [updateState]);

  const handleInputChange = useCallback((str) => {
    updateState({ inputString: str });
  }, [updateState]);

  const handleApplyCustomLanguage = useCallback((lang) => {
    updateState({ customLanguage: lang });
  }, [updateState]);

  const handleSelectSplit = useCallback((index) => {
    updateState({ selectedSplitIndex: index, pumpPower: 1 });
  }, [updateState]);

  const handlePumpPowerChange = useCallback((power) => {
    updateState({ pumpPower: power });
  }, [updateState]);

  const handleContradictionFound = useCallback((splitIndex, pumpPower) => {
    setState((prev) => ({
      ...prev,
      contradictions: {
        ...prev.contradictions,
        [splitIndex]: prev.contradictions[splitIndex] ?? pumpPower,
      },
    }));
  }, []);

  const handleReset = useCallback(() => {
    autoSolveAbortRef.current = true; // cancel any running auto-solve
    setState(INITIAL_STATE);
  }, []);

  // ── Navigation ────────────────────────────────────────────

  const goToInput = useCallback(() => {
    updateState({ appState: 'INPUT' });
  }, [updateState]);

  const goToPartition = useCallback(() => {
    const splits = generateValidSplits(
      state.inputString,
      state.p_value,
      activeValidator?.validate ?? null
    );
    updateState({
      appState: 'PARTITION',
      availableSplits: splits,
      selectedSplitIndex: 0,
      pumpPower: 1,
      contradictions: {},
    });
  }, [state.inputString, state.p_value, activeValidator, updateState]);

  const goToPump = useCallback(() => {
    updateState({ appState: 'PUMP', pumpPower: 1 });
  }, [updateState]);

  const goToProof = useCallback(() => {
    // Append to session history before navigating
    const lang = getValidator(state.activeLanguage, state.customLanguage);
    const entry = {
      language: lang?.name || 'Unknown',
      string: state.inputString,
      contradictionCount: Object.keys(state.contradictions).length,
      splitCount: state.availableSplits.length,
      timestamp: new Date().toLocaleTimeString(),
    };
    setSessionHistory((prev) => [...prev, entry]);
    updateState({ appState: 'PROOF' });
  }, [state, updateState]);

  const goBack = useCallback((targetState) => {
    updateState({ appState: targetState });
  }, [updateState]);

  // ── Auto-Solve Mode ───────────────────────────────────────
  const handleAutoSolve = useCallback(async () => {
    const lang = getValidator(state.activeLanguage, state.customLanguage);
    if (!lang) return;

    autoSolveAbortRef.current = false;

    // Pre-compute everything synchronously
    const suggestedStr = lang.generate(state.p_value);
    const splits = generateValidSplits(suggestedStr, state.p_value, lang.validate);

    // Use precomputed contradictingI from each split
    const preContradictions = {};
    splits.forEach((split, idx) => {
      if (split.contradictingI !== null && split.contradictingI !== undefined) {
        preContradictions[idx] = split.contradictingI;
      }
    });

    // How many splits to animate (cap at 5 for speed)
    const MAX_SHOW = Math.min(splits.length, 5);

    // ── Scheduled animation sequence ──
    const schedule = [
      { delay: 0, update: { appState: 'INPUT', inputString: suggestedStr } },
      {
        delay: 900,
        update: {
          appState: 'PARTITION',
          availableSplits: splits,
          selectedSplitIndex: 0,
          pumpPower: 1,
          contradictions: {},
        },
      },
      { delay: 1700, update: { appState: 'PUMP' } },
    ];

    // Animate through each split
    let accumulated = {};
    for (let idx = 0; idx < MAX_SHOW; idx++) {
      if (preContradictions[idx] !== undefined) {
        accumulated[idx] = preContradictions[idx];
      }
      schedule.push({
        delay: 1700 + (idx + 1) * 700,
        update: {
          selectedSplitIndex: idx,
          pumpPower: preContradictions[idx] ?? 2,
          contradictions: { ...accumulated },
        },
      });
    }

    // If we have more splits, add them all instantly at the end
    if (splits.length > MAX_SHOW) {
      schedule.push({
        delay: 1700 + (MAX_SHOW + 1) * 700,
        update: { contradictions: { ...preContradictions } },
      });
    }

    // Fire off all scheduled updates
    const timers = schedule.map(({ delay, update }) =>
      setTimeout(() => {
        if (autoSolveAbortRef.current) return;
        setState((prev) => ({ ...prev, ...update }));
      }, delay)
    );

    // Navigate to proof after animations
    const totalTime = 1700 + (MAX_SHOW + 2) * 700 + 800;
    timers.push(
      setTimeout(() => {
        if (autoSolveAbortRef.current) return;
        const entry = {
          language: lang.name,
          string: suggestedStr,
          contradictionCount: Object.keys(preContradictions).length,
          splitCount: splits.length,
          timestamp: new Date().toLocaleTimeString(),
        };
        setSessionHistory((prev) => [...prev, entry]);
        setState((prev) => ({ ...prev, appState: 'PROOF' }));
      }, totalTime)
    );

    return () => timers.forEach(clearTimeout);
  }, [state.activeLanguage, state.p_value, state.customLanguage]);

  // ── Render ────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <header
        className="border-b no-print"
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(7,9,15,0.9)',
          backdropFilter: 'blur(24px)',
          borderColor: 'rgba(0,212,255,0.07)',
        }}
      >
        <div className="px-6 sm:px-10 lg:px-16 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #bf5fff)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
            >
              PL
            </div>
            <div>
              <h1 className="font-bold text-slate-100 tracking-tight" style={{ fontSize: '1rem' }}>
                Pumping Lemma Visualizer
              </h1>
              <p className="text-slate-600 tracking-widest uppercase" style={{ fontSize: '0.6rem' }}>
                Theory of Computation · Interactive Proof Engine
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {state.appState === 'SETUP' && (
              <button className="auto-solve-btn" onClick={handleAutoSolve} title="Auto-solve demo">
                ▶ Auto Demo
              </button>
            )}
            <button
              onClick={handleReset}
              className="text-slate-600 hover:text-slate-300 transition-colors cursor-pointer"
              style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
            >
              [reset]
            </button>
          </div>
        </div>
      </header>

      {/* ── Stepper ── */}
      <div
        className="no-print"
        style={{
          position: 'sticky', top: '57px', zIndex: 40,
          background: 'rgba(7,9,15,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,212,255,0.05)',
        }}
      >
        <div className="px-6 sm:px-10 lg:px-16">
          <Stepper currentStep={state.appState} />
        </div>
      </div>

      {/* ── Main Content — full width ── */}
      <main
        style={{
          flex: 1,
          width: '100%',
          padding: '2.5rem 1.5rem 5rem',
        }}
        className="px-6 sm:px-10 lg:px-16"
      >
        <AnimatePresence mode="wait">
          {state.appState === 'SETUP' && (
            <SetupStep
              key="setup"
              activeLanguage={state.activeLanguage}
              pValue={state.p_value}
              customLanguage={state.customLanguage}
              onLanguageChange={handleLanguageChange}
              onPChange={handlePChange}
              onApplyCustomLanguage={handleApplyCustomLanguage}
              onNext={goToInput}
            />
          )}
          {state.appState === 'INPUT' && (
            <InputStep
              key="input"
              validator={activeValidator}
              pValue={state.p_value}
              inputString={state.inputString}
              onInputChange={handleInputChange}
              onNext={goToPartition}
              onBack={() => goBack('SETUP')}
            />
          )}
          {state.appState === 'PARTITION' && (
            <PartitionStep
              key="partition"
              inputString={state.inputString}
              pValue={state.p_value}
              availableSplits={state.availableSplits}
              selectedSplitIndex={state.selectedSplitIndex}
              onSelectSplit={handleSelectSplit}
              onNext={goToPump}
              onBack={() => goBack('INPUT')}
            />
          )}
          {state.appState === 'PUMP' && (
            <PumpStep
              key="pump"
              validator={activeValidator}
              inputString={state.inputString}
              pValue={state.p_value}
              availableSplits={state.availableSplits}
              selectedSplitIndex={state.selectedSplitIndex}
              pumpPower={state.pumpPower}
              onPumpPowerChange={handlePumpPowerChange}
              onSelectSplit={handleSelectSplit}
              contradictions={state.contradictions}
              onContradictionFound={handleContradictionFound}
              onNext={goToProof}
              onBack={() => goBack('PARTITION')}
            />
          )}
          {state.appState === 'PROOF' && (
            <ProofStep
              key="proof"
              validator={activeValidator}
              inputString={state.inputString}
              pValue={state.p_value}
              availableSplits={state.availableSplits}
              contradictions={state.contradictions}
              sessionHistory={sessionHistory}
              onBack={() => goBack('PUMP')}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer
        className="py-4 text-center no-print"
        style={{ borderTop: '1px solid rgba(0,212,255,0.05)' }}
      >
        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          PUMPING LEMMA VISUALIZER · THEORY OF COMPUTATION · BTECH PROJECT
        </p>
      </footer>

      {/* ── Theory FAB ── */}
      <TheoryPanel currentStep={state.appState} />
    </div>
  );
}

