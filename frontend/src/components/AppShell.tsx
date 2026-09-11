"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AppSidebar from "@/components/AppSidebar";
import AppTopHeader from "@/components/AppTopHeader";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Routes that should NOT render the sidebar and top header (immersive full-bleed viewports)
  const isLanding = pathname === '/landing';
  const isAuth = pathname === '/auth';
  const isBareLayout = isLanding || isAuth;

  if (isBareLayout) {
    return (
      <main style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
        {children}
      </main>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Left Persistent Sidebar */}
      <AppSidebar />

      {/* Right Main Content Area */}
      <div 
        style={{ 
          marginLeft: '220px', 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: '100vh',
          position: 'relative',
          width: 'calc(100% - 220px)'
        }}
      >
        <AppTopHeader />
        <main style={{ flex: 1, position: 'relative' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
