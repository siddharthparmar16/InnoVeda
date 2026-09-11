"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Home, Search } from 'lucide-react';

export default function NotFound() {
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
            background: 'radial-gradient(circle, var(--accent-gold-glow) 0%, var(--bg-card) 100%)',
            border: '1px solid var(--border-highlight)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-gold)',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <ShieldAlert size={32} />
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
          404 — SECTION UNFOUND
        </div>

        <h1
          style={{
            fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif",
            fontSize: '2rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0
          }}
        >
          Page Not In Statutory Archive
        </h1>

        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          The requested page or statutory citation route does not exist or has been relocated within the research archive.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            href="/"
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
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            <Home size={16} />
            <span>Return to Research Hub</span>
          </Link>

          <Link
            href="/dashboard"
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
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            <Search size={16} style={{ color: 'var(--accent-gold)' }} />
            <span>Open Query Studio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
