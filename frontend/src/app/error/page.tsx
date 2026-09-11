"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ErrorRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
      Redirecting to IP-SAKTI Sahayak Home...
    </div>
  );
}
