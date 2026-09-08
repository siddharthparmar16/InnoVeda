"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '999px',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        boxShadow: '0 15px 30px rgba(0,0,0,0.5)'
      }}
    >
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ShieldAlert className="text-emerald" size={22} style={{ color: 'var(--accent-emerald)' }} />
        <span style={{ fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontSize: '1.1rem' }}>IP-SAKTI</span>
      </Link>

      <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }} />

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <Link 
          href="/" 
          style={{ 
            textDecoration: 'none', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            color: pathname === '/' ? 'var(--text-primary)' : 'var(--text-secondary)',
            transition: 'color 0.2s'
          }}
        >
          Project Overview
        </Link>
        <Link 
          href="/dashboard" 
          style={{ 
            textDecoration: 'none', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            color: pathname === '/dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
            transition: 'color 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={16} style={{ color: pathname === '/dashboard' ? 'var(--accent-emerald)' : 'inherit' }} />
            RAG Dashboard
          </div>
        </Link>
      </div>
    </motion.nav>
  );
}
