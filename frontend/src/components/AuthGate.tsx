"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthGateProps {
  title?: string;
  subtitle?: string;
  description?: string;
}

export default function AuthGate({
  title,
  subtitle,
  description
}: AuthGateProps) {
  const router = useRouter();
  const { isLoading } = useAuth();

  // Redirect unauthenticated users to /landing immediately
  useEffect(() => {
    if (!isLoading) {
      router.replace('/landing');
    }
  }, [isLoading, router]);

  // Minimal spinner while auth state resolves, then redirect fires
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center', color: 'var(--accent-gold)' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            margin: '0 auto 1.25rem auto',
            border: '2px solid rgba(201, 168, 106, 0.2)',
            borderTopColor: 'var(--accent-gold)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span
          style={{
            fontSize: '0.88rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Redirecting...
        </span>
      </div>
    </div>
  );
}
