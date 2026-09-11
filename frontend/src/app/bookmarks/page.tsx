"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Bookmark, 
  Star, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Calendar, 
  ShieldAlert,
  Download,
  Plus,
  Database,
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserBookmarks, deleteUserBookmark } from '@/lib/supabase/database';
import { DatabaseBookmark } from '@/lib/supabase/types';
import AuthGate from '@/components/AuthGate';

interface BookmarkItem {
  id: string;
  title: string;
  regime: string;
  verdict: string;
  verdictColor: string;
  summary: string;
  date: string;
  query: string;
}

export default function BookmarksPage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  const isAuthenticated = Boolean(user || profile);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ textAlign: 'center', color: 'var(--accent-gold)' }}>
          <div style={{ width: '36px', height: '36px', margin: '0 auto 1.25rem auto', border: '2px solid rgba(201, 168, 106, 0.2)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '0.88rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Verifying Researcher Clearance...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthGate 
        title="Bookmarked Patents Restricted" 
        subtitle="Research Dossier Clearance Required" 
        description="Your saved patent analyses, statutory verdicts, and citations are linked to your authenticated researcher account." 
      />
    );
  }

  useEffect(() => {
    async function fetchBookmarks() {
      if (user?.id) {
        setIsSyncing(true);
        const data = await getUserBookmarks(user.id);
        if (data && data.length > 0) {
          const mapped: BookmarkItem[] = data.map((b: DatabaseBookmark) => ({
            id: b.id,
            title: b.title,
            regime: b.regime,
            verdict: b.verdict,
            verdictColor: b.verdict_color,
            summary: b.summary,
            date: b.created_at ? new Date(b.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
            query: b.query
          }));
          setBookmarks(mapped);
        }
        setIsSyncing(false);
      }
    }
    fetchBookmarks();
  }, [user]);

  const removeBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks(prev => prev.filter(b => b.id !== id));
    if (user?.id) {
      await deleteUserBookmark(user.id, id);
    }
  };

  return (
    <div 
      style={{ 
        minHeight: 'calc(100vh - 64px)', 
        padding: '2.5rem 2rem 5rem', 
        maxWidth: '1400px', 
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
    >
      {/* Back Link */}
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          textDecoration: 'none',
          marginBottom: '1.5rem',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-gold)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={14} />
        <span>Back to Research</span>
      </Link>

      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div>
          <div 
            style={{ 
              fontSize: '0.7rem', 
              letterSpacing: '0.18em', 
              fontWeight: 700, 
              color: 'var(--accent-gold)', 
              textTransform: 'uppercase',
              marginBottom: '0.4rem'
            }}
          >
            SAVED RESEARCH
          </div>
          <h1 
            style={{ 
              fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif", 
              fontSize: '2.4rem', 
              fontWeight: 500, 
              color: 'var(--text-primary)', 
              letterSpacing: '-0.01em',
              margin: '0 0 0.5rem 0'
            }}
          >
            Bookmarked Research
          </h1>
          <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
            Important research verdicts, statutory citations, and comparative audit dossiers saved for your reference.
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard?new=true')}
          className="btn-gold"
          style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem' }}
        >
          <Plus size={16} />
          <span>New Research Dossier</span>
        </button>
      </div>

      {bookmarks.length === 0 ? (
        /* Empty State */
        <div 
          className="luxury-card"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}
        >
          <div 
            style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              background: 'rgba(201, 168, 106, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--accent-gold)' 
            }}
          >
            <Star size={24} />
          </div>
          <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0 }}>
            No bookmarks yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: 0 }}>
            Important research results and statutory verdicts can appear here when bookmarking is triggered from the analysis studio.
          </p>
        </div>
      ) : (
        /* Bookmarks List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {bookmarks.map((b) => (
            <div
              key={b.id}
              onClick={() => router.push(`/dashboard?query=${encodeURIComponent(b.query)}`)}
              className="luxury-card"
              style={{
                padding: '1.75rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span 
                    style={{ 
                      fontSize: '0.72rem', 
                      letterSpacing: '0.1em', 
                      fontWeight: 700, 
                      color: 'var(--accent-gold)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {b.regime}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span 
                    style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      color: b.verdictColor,
                      background: 'var(--bg-glass-hover)',
                      padding: '0.15rem 0.6rem',
                      borderRadius: '999px',
                      border: `1px solid ${b.verdictColor}40`
                    }}
                  >
                    {b.verdict}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} />
                    {b.date}
                  </span>
                  <button
                    onClick={(e) => removeBookmark(b.id, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.35rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Remove Bookmark"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 
                style={{ 
                  fontFamily: "var(--font-serif), Georgia, serif", 
                  fontSize: '1.3rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  margin: 0
                }}
              >
                {b.title}
              </h3>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                {b.summary}
              </p>

              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.85rem',
                  marginTop: '0.25rem'
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Click to re-open statutory analysis in Studio
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                  Open Research →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
