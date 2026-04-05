import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * KaTeX math renderer component
 * Renders LaTeX strings using KaTeX
 */
export default function KaTeXBlock({ latex, displayMode = true, className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && latex) {
      try {
        katex.render(latex, containerRef.current, {
          displayMode,
          throwOnError: false,
          trust: true,
          strict: false,
        });
      } catch (e) {
        containerRef.current.textContent = latex;
      }
    }
  }, [latex, displayMode]);

  if (displayMode) {
    return <div ref={containerRef} className={className} />;
  }
  return <span ref={containerRef} className={className} />;
}
