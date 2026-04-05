import { useState, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Stepper from './components/Stepper';
import SetupStep from './components/SetupStep';
import InputStep from './components/InputStep';
import PartitionStep from './components/PartitionStep';
import PumpStep from './components/PumpStep';
import ProofStep from './components/ProofStep';
import TheoryPanel from './components/TheoryPanel';
import { generateValidSplits, pumpString } from './engine/splitter';
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
    const splits = generateValidSplits(state.inputString, state.p_value);
    updateState({
      appState: 'PARTITION',
      availableSplits: splits,
      selectedSplitIndex: 0,
      pumpPower: 1,
      contradictions: {},
    });
  }, [state.inputString, state.p_value, updateState]);

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
    const splits = generateValidSplits(suggestedStr, state.p_value);

    // Find contradiction i for each split (cap at i=10)
    const preContradictions = {};
    splits.forEach((split, idx) => {
      for (let i = 0; i <= 10; i++) {
        if (i === 1) continue; // i=1 always keeps the string in L
        const pumped = pumpString(split.x, split.y, split.z, i);
        let inL = true;
        try { inL = lang.validate(pumped); } catch { inL = false; }
        if (!inL) {
          preContradictions[idx] = i;
          break;
        }
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
      {/* ── Header (sticky) ── */}
      <header
        className="border-b border-slate-800/60 backdrop-blur-xl no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(10,14,26,0.85)',
        }}
      >
        <div
          className="mx-auto px-5 sm:px-8 lg:px-12 py-3 flex items-center justify-between"
          style={{ maxWidth: '1200px' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)',
                boxShadow: '0 0 16px rgba(14,165,233,0.3)',
              }}
            >
              PL
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 tracking-tight">
                Pumping Lemma Visualizer
              </h1>
              <p className="text-[10px] text-slate-600 tracking-widest uppercase">
                Mathematical Laboratory
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-3">
            {/* Auto-solve button (shown during SETUP) */}
            {state.appState === 'SETUP' && (
              <button
                className="auto-solve-btn"
                onClick={handleAutoSolve}
                title="Auto-solve: animates the full proof for the current language"
              >
                ▶ Show Me How
              </button>
            )}
            <button
              onClick={handleReset}
              className="text-xs text-slate-600 hover:text-slate-300 transition-colors font-mono cursor-pointer"
            >
              [reset]
            </button>
          </div>
        </div>
      </header>

      {/* ── Stepper (sticky below header) ── */}
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: '57px',
          zIndex: 40,
          background: 'rgba(10,14,26,0.9)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(59,130,246,0.06)',
        }}
      >
        <div className="mx-auto px-5 sm:px-8 lg:px-12" style={{ maxWidth: '1200px' }}>
          <Stepper currentStep={state.appState} />
        </div>
      </div>

      {/* ── Main Content ── */}
      <main
        style={{
          flex: 1,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '2rem 1.25rem 4rem',
        }}
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
        className="border-t border-slate-800/40 py-4 text-center no-print"
        style={{ borderTop: '1px solid rgba(59,130,246,0.06)' }}
      >
        <p className="text-[10px] text-slate-700 tracking-wider">
          PUMPING LEMMA VISUALIZER &middot; THEORY OF COMPUTATION &middot; BTECH PROJECT
        </p>
      </footer>

      {/* ── Theory Panel (floating) ── */}
      <TheoryPanel currentStep={state.appState} />
    </div>
  );
}
