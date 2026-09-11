"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled statutory runtime error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'radial-gradient(ellipse at top, var(--accent-gold-glow) 0%, var(--bg-primary) 70%)'
      }}
    >
      <div
        className="luxury-card"
        style={{
          padding: '3rem 2.5rem',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}
        >
          <AlertTriangle size={32} />
        </div>

        <div
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.18em',
            fontWeight: 700,
            color: 'var(--accent-gold)',
            textTransform: 'uppercase'
          }}
        >
          SESSION RECOVERY
        </div>

        <h1
          style={{
            fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif",
            fontSize: '1.8rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0
          }}
        >
          An Unexpected Event Occurred
        </h1>

        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {error.message || 'The application encountered an unexpected state. Your statutory session data is safe.'}
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.4rem',
              borderRadius: '10px',
              background: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              fontWeight: 600,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.4rem',
              borderRadius: '10px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontWeight: 500,
              fontSize: '0.88rem',
              textDecoration: 'none'
            }}
          >
            <Home size={16} />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
