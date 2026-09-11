"use client";
import React from 'react';
import { Jurisdiction } from '@/types/domain';

interface Props {
  value: Jurisdiction;
  onChange: (j: Jurisdiction) => void;
  compact?: boolean;
}

const OPTIONS: { value: Jurisdiction; label: string; short: string }[] = [
  { value: 'INDIA', label: '🇮🇳 Indian Regime', short: '🇮🇳 India' },
  { value: 'INTERNATIONAL', label: '🌐 International (WIPO)', short: '🌐 WIPO' },
  { value: 'USPTO', label: '🇺🇸 USPTO', short: '🇺🇸 US' },
  { value: 'EPO', label: '🇪🇺 EPO', short: '🇪🇺 EU' },
];

/**
 * Segmented jurisdiction control — instantly re-runs the analysis under the
 * selected regime (Indian Patents Act + BDA vs WIPO GRATK PCT track vs
 * USPTO / EPO lenses).
 */
export default function JurisdictionToggle({ value, onChange, compact }: Props) {
  return (
    <div
      className="glass-panel flex"
      role="tablist"
      aria-label="Jurisdiction regime"
      style={{ padding: '0.2rem', borderRadius: '10px', gap: '0.15rem' }}
    >
      {OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            title={o.label}
            style={{
              padding: compact ? '0.3rem 0.6rem' : '0.35rem 0.75rem',
              background: active ? 'var(--bg-glass-hover)' : 'transparent',
              border: active ? '1px solid rgba(16,185,129,0.35)' : '1px solid transparent',
              borderRadius: '8px',
              color: active ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: compact ? '0.72rem' : '0.8rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {compact ? o.short : o.label}
          </button>
        );
      })}
    </div>
  );
}
