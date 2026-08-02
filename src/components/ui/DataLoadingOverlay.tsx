import React from 'react';
import { useDataReady } from '@/lib/sim/dataLoader';

/**
 * DataLoadingOverlay
 *
 * Shows a minimal full-screen loading screen while the 8 JSON datasets
 * are being fetched from /data/*.json. Disappears the moment all data
 * is ready (typically 0.5–2s on fast networks, 2–5s on Slow 4G).
 *
 * Rendered before the full AppLayout so users see instant visual feedback
 * rather than a partial/blank screen. Uses only inline styles and SVG so
 * it renders with zero external resource dependencies.
 */
export const DataLoadingOverlay: React.FC = () => {
  const ready = useDataReady();

  if (ready) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Loading operational data"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0a0e14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* Radar sweep SVG spinner */}
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="none" stroke="#2a3547" strokeWidth="2" />
        <circle cx="32" cy="32" r="20" fill="none" stroke="#2a3547" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="32" cy="32" r="3" fill="#00e5ff" />
        <line x1="32" y1="32" x2="32" y2="6" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" style={{
          transformOrigin: '32px 32px',
          animation: 'radarspin 1.2s linear infinite',
        }} />
        <style>{`@keyframes radarspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </svg>

      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '11px',
          letterSpacing: '0.15em',
          color: '#00e5ff',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: '6px',
        }}>
          VIDP / T3 MASTER CONTROL
        </div>
        <div style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '10px',
          letterSpacing: '0.1em',
          color: '#8b96a8',
          textTransform: 'uppercase',
        }}>
          Indexing Operational Records…
        </div>
      </div>
    </div>
  );
};
