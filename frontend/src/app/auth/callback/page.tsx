"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      router.push('/');
      return;
    }

    const handleAuthCallback = async () => {
      try {
        // Exchange auth code if present in search params
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // If using implicit hash flow, getSession resolves it
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
        }

        router.push('/dashboard');
      } catch (err: any) {
        console.error('Error in auth callback:', err);
        setErrorMsg(err.message || 'Authentication failed. Please try again.');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

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
          padding: '3rem',
          maxWidth: '440px',
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
          {errorMsg ? (
            <ShieldCheck size={32} style={{ color: '#ef4444' }} />
          ) : (
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-gold)' }} />
          )}
        </div>

        <h2
          style={{
            fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif",
            fontSize: '1.5rem',
            margin: 0,
            color: 'var(--text-primary)'
          }}
        >
          {errorMsg ? 'Authentication Alert' : 'Verifying Researcher Credentials'}
        </h2>

        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {errorMsg
            ? errorMsg
            : 'Establishing secure statutory session with Supabase and synchronizing your IP research profile...'}
        </p>
      </div>
    </div>
  );
}
