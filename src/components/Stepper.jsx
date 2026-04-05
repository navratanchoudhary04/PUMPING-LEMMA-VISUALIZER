import { motion } from 'framer-motion';

const STEPS = [
  { key: 'SETUP',     label: 'Setup',     icon: '⚙' },
  { key: 'INPUT',     label: 'Input',     icon: '✎' },
  { key: 'PARTITION', label: 'Partition', icon: '⊞' },
  { key: 'PUMP',      label: 'Pump',      icon: '∞' },
  { key: 'PROOF',     label: 'Proof',     icon: '∎' },
];

const STEP_ORDER = STEPS.map((s) => s.key);

export default function Stepper({ currentStep }) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-0 py-5">
      {STEPS.map((step, index) => {
        const isActive    = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isLast      = index === STEPS.length - 1;

        return (
          <div key={step.key} className="flex items-center">
            {/* Step node */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={false}
              animate={{ scale: isActive ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Circle */}
              <div className="relative">
                <div
                  className={`step-indicator ${
                    isActive
                      ? 'step-indicator-active'
                      : isCompleted
                      ? 'step-indicator-completed'
                      : 'step-indicator-inactive'
                  }`}
                >
                  {isCompleted ? '✓' : step.icon}
                </div>

                {/* Celebrate ping on completion */}
                {isCompleted && (
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'rgba(0,255,136,0.25)',
                      animation: 'celebrate-ping 1.2s ease-out forwards',
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase transition-colors duration-300"
                style={{
                  color: isActive
                    ? '#00d4ff'
                    : isCompleted
                    ? 'rgba(0,255,136,0.7)'
                    : '#4a6491',
                }}
              >
                {step.label}
              </span>
            </motion.div>

            {/* Connector line */}
            {!isLast && (
              <div className="mx-2 sm:mx-3 mb-5 relative overflow-hidden" style={{ width: '48px', height: '3px', borderRadius: '2px', background: 'rgba(71,85,105,0.25)' }}>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: index < currentIndex ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    transformOrigin: 'left',
                    background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
                    boxShadow: '0 0 8px rgba(0,212,255,0.4)',
                    borderRadius: '2px',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
