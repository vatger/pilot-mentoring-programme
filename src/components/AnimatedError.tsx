import Link from 'next/link';
import React from 'react';

export default function AnimatedError({
  title,
  message,
  reset,
  showHome = true,
}: {
  title: string;
  message?: string;
  reset?: () => void;
  showHome?: boolean;
}) {
  return (
    <main className="container" aria-labelledby="ae-title" role="main" style={{ paddingTop: 36 }}>
      {/* animated-error becomes the error card and will host the radar as a positioned background */}
      <div className="card animated-error" role="status" aria-live="polite">
        {/* make the visual an inert background layer */}
        <div className="ae-visual ae-visual--bg" aria-hidden>
          {/* Radar-only SVG (now sized to viewport so it can cover the entire site) */}
          <svg
            /* center the coordinate system: viewBox min is -260,-260 so (0,0) is the visual center */
            viewBox="-260 -260 520 520"
            className="ae-scene"
            preserveAspectRatio="xMidYMid meet"
            width="100vw"
            height="100vh"
            focusable="false"
            aria-hidden
          >
            <defs>
              <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#76ff9a" stopOpacity="0.18" />
                <stop offset="60%" stopColor="#076b1f" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#00110a" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="sweepGrad" x1="0" x2="1">
                <stop offset="0%" stopColor="#7dff9f" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#2fb44c" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0a260f" stopOpacity="0" />
              </linearGradient>
            </defs>

            <rect x="-260" y="-260" width="520" height="520" fill="#03120a" rx="10" />

            {/* the SVG is now centered: elements below are positioned relative to (0,0) = center */}
            <g className="ae-radar-scope">
              <circle cx="0" cy="0" r="240" fill="url(#radarGlow)" />
              <g className="ae-rings" stroke="#36ff7a" strokeOpacity="0.14" strokeWidth="1" fill="none">
                <circle r="48" />
                <circle r="96" />
                <circle r="144" />
                <circle r="192" />
                <circle r="240" strokeOpacity="0.09" />
              </g>

              <g className="ae-radials" stroke="#36ff7a" strokeOpacity="0.10" strokeWidth="0.9">
                <line x1="0" y1="0" x2="0" y2="-240" />
                <line x1="0" y1="0" x2="170" y2="-170" />
                <line x1="0" y1="0" x2="240" y2="0" />
                <line x1="0" y1="0" x2="170" y2="170" />
                <line x1="0" y1="0" x2="0" y2="240" />
                <line x1="0" y1="0" x2="-170" y2="170" />
                <line x1="0" y1="0" x2="-240" y2="0" />
                <line x1="0" y1="0" x2="-170" y2="-170" />
              </g>

              <g className="ae-radar-sweep">
                <path d="M0 0 L240 -20 A240 240 0 0 1 240 20 Z" fill="url(#sweepGrad)" opacity="0.95" />
                {/* rotation handled by CSS to ensure consistent center-origin behavior across viewports */}
              </g>

              <g className="ae-center">
                <circle r="4" fill="#baffc9" />
                <circle r="8" fill="none" stroke="#baffc9" strokeOpacity="0.28" strokeWidth="1" />
              </g>

              <g className="ae-targets">
                <g className="ae-target ae-target--p1" transform="translate(90,-60)">
                  <circle r="4" fill="#00ff6b" />
                  <circle r="10" className="ae-target-pulse" fill="none" stroke="#00ff6b" strokeOpacity="0.18" strokeWidth="1.5" />
                </g>
                <g className="ae-target ae-target--p2" transform="translate(-130,30)">
                  <circle r="3.5" fill="#8cffb8" />
                  <circle r="9" className="ae-target-pulse" fill="none" stroke="#8cffb8" strokeOpacity="0.16" strokeWidth="1.2" />
                </g>
                <g className="ae-target ae-target--p3" transform="translate(30,160)">
                  <circle r="3.8" fill="#6bff9a" />
                  <circle r="11" className="ae-target-pulse" fill="none" stroke="#6bff9a" strokeOpacity="0.14" strokeWidth="1.4" />
                </g>
                <g className="ae-target ae-target--p4" transform="translate(-40,-180)">
                  <circle r="3.2" fill="#a6ffd1" />
                  <circle r="8.5" className="ae-target-pulse" fill="none" stroke="#a6ffd1" strokeOpacity="0.12" strokeWidth="1" />
                </g>
              </g>
            </g>
          </svg>
        </div>

        {/* textual content sits in front */}
        <div className="ae-content">
          <h1 id="ae-title" className="ae-title">{title}</h1>
          {message ? (
            <p className="ae-message">{message}</p>
          ) : (
            <p className="ae-message">Ein unerwartetes Problem ist aufgetreten. Versuche es erneut oder kehre zur Startseite zurück.</p>
          )}

          <div className="ae-cta">
            {showHome && (
              <Link href="/" className="button" aria-label="Zur Startseite">
                Zur Startseite
              </Link>
            )}
            {reset && (
              <button
                type="button"
                className="button"
                onClick={() => {
                  try { reset(); } catch { /* ignore */ }
                }}
                aria-label="Erneut versuchen"
                style={{ marginLeft: 8 }}
              >
                Erneut versuchen
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}


