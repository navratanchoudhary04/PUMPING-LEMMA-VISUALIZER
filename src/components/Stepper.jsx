/**
 * Stepper v3 — horizontal step indicator with glow on active
 */
const STEPS = [
  { id: 'SETUP',     icon: '⚙',  label: 'Setup' },
  { id: 'INPUT',     icon: '✎',  label: 'Input' },
  { id: 'PARTITION', icon: '⊞',  label: 'Partition' },
  { id: 'PUMP',      icon: '∞',  label: 'Pump' },
  { id: 'PROOF',     icon: '∎',  label: 'Proof' },
];
const ORDER = STEPS.map((s) => s.id);

export default function Stepper({ currentStep }) {
  const currentIdx = ORDER.indexOf(currentStep);

  return (
    <div className="stepper-wrapper">
      {STEPS.map((step, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        const cls = done ? 'done' : active ? 'active' : '';

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div className={`step-node ${cls}`}>
              <div className="step-icon">{done ? '✓' : step.icon}</div>
              <div className="step-label">{step.label}</div>
            </div>
            {i < STEPS.length - 1 && <div className={`step-connector ${done ? 'done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}
