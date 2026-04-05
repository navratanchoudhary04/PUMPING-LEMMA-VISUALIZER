import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

/**
 * StringVisualizer — "The Ruler"
 *
 * Renders a horizontal track of character tiles with semantic coloring
 * for x (gray), y (cyan), z (muted) segments.
 * 
 * Behaviours:
 *   pumpPower = 0  → y tiles fade out (struck-through style)
 *   pumpPower = 1  → normal display
 *   pumpPower > 1  → extra copies shown in green with ×i badge
 */
export default function StringVisualizer({
  x = '',
  y = '',
  z = '',
  pumpPower = 1,
  pValue = 4,
  showPZone = true,
  showLabels = true,
  showLoopArrow = true,
  compact = false,
}) {
  // Build the character list with segment metadata
  const characters = useMemo(() => {
    const chars = [];
    let idx = 0;

    // x segment
    for (let i = 0; i < x.length; i++) {
      chars.push({ char: x[i], segment: 'x', key: `x-${i}`, idx: idx++ });
    }

    // y segment: 0 times → zero-style tiles; 1+ times → normal + pumped
    if (pumpPower === 0) {
      // Show y chars as faded/struck-through to visualise removal
      for (let i = 0; i < y.length; i++) {
        chars.push({ char: y[i], segment: 'y-zero', key: `y-zero-${i}`, idx: idx++ });
      }
    } else {
      for (let rep = 0; rep < pumpPower; rep++) {
        for (let i = 0; i < y.length; i++) {
          chars.push({
            char: y[i],
            segment: rep === 0 ? 'y' : 'pumped',
            key: `y-${rep}-${i}`,
            idx: idx++,
            pumpRep: rep,
          });
        }
      }
    }

    // z segment
    for (let i = 0; i < z.length; i++) {
      chars.push({ char: z[i], segment: 'z', key: `z-${i}`, idx: idx++ });
    }

    return chars;
  }, [x, y, z, pumpPower]);

  const totalLength = characters.length;
  const blockW = compact ? 30 : 36;

  // P-zone width in px
  const pZoneWidth = Math.min(pValue, x.length + (pumpPower > 0 ? y.length : 0));

  const segmentClass = (seg) => {
    switch (seg) {
      case 'x':      return 'char-block-x';
      case 'y':      return 'char-block-y';
      case 'y-zero': return 'char-block-y-zero';
      case 'pumped': return 'char-block-pumped';
      case 'z':      return 'char-block-z';
      default:       return 'char-block-z';
    }
  };

  return (
    <div className="space-y-3">
      {/* Legend labels */}
      {showLabels && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-400 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(148,163,184,0.15)', border: '1px solid rgba(148,163,184,0.25)' }} />
            <span>x ({x.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)' }} />
            <span style={{ color: pumpPower === 0 ? '#64748b' : '#00d4ff' }}>
              y ({y.length}) {pumpPower !== 1 && `× ${pumpPower}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(71,85,105,0.15)', border: '1px solid rgba(71,85,105,0.25)' }} />
            <span>z ({z.length})</span>
          </div>
          <div className="ml-auto text-slate-500 text-[11px]">
            |xy<sup>{pumpPower}</sup>z| = {totalLength}
          </div>
        </div>
      )}

      {/* Ruler track */}
      <div className="relative">
        {/* P-Zone overlay */}
        {showPZone && pumpPower <= 1 && (
          <div
            className="p-zone-overlay"
            style={{ width: `${pZoneWidth * (blockW + 4) + 8}px` }}
          >
            <span
              className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono"
              style={{ color: 'rgba(0,212,255,0.55)' }}
            >
              p = {pValue}
            </span>
          </div>
        )}

        {/* Characters */}
        <div className="flex flex-wrap gap-1 relative z-10">
          <AnimatePresence mode="popLayout">
            {characters.map((char, i) => (
              <motion.div
                key={char.key}
                layout
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{
                  opacity: char.segment === 'y-zero' ? 0.35 : 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{ opacity: 0, scale: 0.5, y: -10 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                  delay: Math.min(i * 0.012, 0.4),
                }}
                className={`char-block ${compact ? 'w-8 h-10 text-sm' : ''} ${segmentClass(char.segment)}`}
                title={`[${char.segment}] index ${char.idx}`}
              >
                {char.char}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bracket annotations row */}
        {showLabels && (
          <div className="flex gap-1 mt-2 relative z-10 flex-wrap">
            {/* x bracket */}
            {x.length > 0 && (
              <div
                className="flex items-center justify-center"
                style={{ width: `${x.length * (blockW + 4) - 4}px`, minWidth: '20px' }}
              >
                <span className="char-bracket-label char-bracket-label-x">
                  x
                </span>
              </div>
            )}
            {/* y bracket */}
            {y.length > 0 && pumpPower > 0 && (
              <div
                className="flex items-center justify-center"
                style={{ width: `${y.length * pumpPower * (blockW + 4) - 4}px`, minWidth: '20px' }}
              >
                <span className="char-bracket-label char-bracket-label-y">
                  y{pumpPower > 1 ? ` ×${pumpPower}` : ''}
                </span>
              </div>
            )}
            {y.length > 0 && pumpPower === 0 && (
              <div
                className="flex items-center justify-center"
                style={{ width: `${y.length * (blockW + 4) - 4}px`, minWidth: '20px' }}
              >
                <span className="char-bracket-label" style={{ color: 'rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.04)', border: '1px dashed rgba(0,212,255,0.15)', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}>
                  y (removed)
                </span>
              </div>
            )}
            {/* z bracket */}
            {z.length > 0 && (
              <div
                className="flex items-center justify-center"
                style={{ width: `${z.length * (blockW + 4) - 4}px`, minWidth: '20px' }}
              >
                <span className="char-bracket-label char-bracket-label-z">
                  z
                </span>
              </div>
            )}
          </div>
        )}

        {/* Loop arrow above y segment when i > 1 */}
        {showLoopArrow && pumpPower > 1 && y.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="loop-arrow absolute -top-9 z-20"
            style={{
              left: `${x.length * (blockW + 4)}px`,
              width: `${y.length * pumpPower * (blockW + 4)}px`,
            }}
          >
            <svg viewBox="0 0 200 30" className="w-full h-7" preserveAspectRatio="none">
              <defs>
                <marker id="arrowhead-sv" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#00d4ff" opacity="0.7" />
                </marker>
              </defs>
              <path
                d="M 10 28 Q 10 5 100 5 Q 190 5 190 28"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.55"
                markerEnd="url(#arrowhead-sv)"
              />
              <text x="100" y="18" textAnchor="middle" fill="#00d4ff" fontSize="10"
                fontFamily="JetBrains Mono, monospace" opacity="0.85">
                y × {pumpPower}
              </text>
            </svg>
          </motion.div>
        )}
      </div>
    </div>
  );
}
