"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence, Variants } from 'framer-motion';
import { ShieldAlert, ArrowRight, Gavel, Scale, Lock, Network, Languages, FileText, Fingerprint, Database, CheckCircle2, XCircle, Zap, Search, Cpu } from 'lucide-react';

const rotatingTexts = [
  "Traditional Knowledge.",
  "Ayurvedic Formulations.",
  "Botanical Genetics.",
  "Vernacular Texts."
];

const mockQueries = [
  "Is Curcuma longa patentable for wound healing?",
  "Patent application for Azadirachta indica fungicidal properties",
  "Can I patent a mixture of ginger and honey for coughs?"
];

// Spotlight Card Component (Classy Dark Mode)
const SpotlightCard = ({ children, className = "", style = {} }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => { setIsFocused(true); setOpacity(1); }}
      onBlur={() => { setIsFocused(false); setOpacity(0); }}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.05)] bg-[rgba(15,23,42,0.4)] ${className}`}
      style={{
        backdropFilter: 'blur(32px)',
        transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
        boxShadow: opacity === 1 ? '0 10px 40px -10px rgba(16, 185, 129, 0.1)' : '0 4px 24px -4px rgba(0, 0, 0, 0.5)',
        ...style
      }}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500"
        style={{
          opacity,
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(255, 255, 255, 0.03), transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
};

// 3D Tilt Wrapper (Softened for elegance)
const TiltHero = ({ children }: { children: React.ReactNode }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotateX(((y - rect.height / 2) / (rect.height / 2)) * -2);
    setRotateY(((x - rect.width / 2) / (rect.width / 2)) * 2);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 70, damping: 30, mass: 1 }}
      style={{ perspective: "1200px", width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)' }}>
        {children}
      </div>
    </motion.div>
  );
};

// Scroll Reveal Text Component
const ScrollRevealText = ({ text, className = "" }: { text: string, className?: string }) => {
  const words = text.split(" ");
  return (
    <motion.h2
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className={className}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
          }}
          style={{ display: "inline-block", marginRight: "0.25em", color: 'var(--text-primary)' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.h2>
  );
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  
  // Parallax calculations for Orbs (Subtle)
  const orb1Y = useTransform(scrollYProgress, [0, 1], [0, -400]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  
  // Flowchart animation container tracking
  const flowchartRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: flowchartProgress } = useScroll({
    target: flowchartRef,
    offset: ["start center", "end center"]
  });
  const lineHeight = useTransform(flowchartProgress, [0, 1], ["0%", "100%"]);
  
  const [textIndex, setTextIndex] = useState(0);
  const [queryIndex, setQueryIndex] = useState(0);
  const [displayedQuery, setDisplayedQuery] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Rotating Header Text
  useEffect(() => {
    const interval = setInterval(() => { setTextIndex((prev) => (prev + 1) % rotatingTexts.length); }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Mock Search Typing Effect
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isTyping) {
      if (displayedQuery.length < mockQueries[queryIndex].length) {
        timeout = setTimeout(() => { setDisplayedQuery(mockQueries[queryIndex].slice(0, displayedQuery.length + 1)); }, 50);
      } else {
        timeout = setTimeout(() => { setIsTyping(false); }, 2000);
      }
    } else {
      if (displayedQuery.length > 0) {
        timeout = setTimeout(() => { setDisplayedQuery(displayedQuery.slice(0, -1)); }, 30);
      } else {
        setQueryIndex((prev) => (prev + 1) % mockQueries.length);
        setIsTyping(true);
      }
    }
    return () => clearTimeout(timeout);
  }, [displayedQuery, isTyping, queryIndex]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      
      {/* Global Scroll Progress Bar */}
      <motion.div 
        style={{ scaleX: scrollYProgress, transformOrigin: '0% 50%' }}
        className="fixed top-0 left-0 right-0 h-1 bg-emerald-500 z-50 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
      />

      <div className="bg-grid-pattern" />
      
      {/* Elegant Parallax Background Orbs */}
      <motion.div 
        style={{ y: orb1Y, position: 'absolute', top: '10%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 60%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} 
      />
      <motion.div 
        style={{ y: orb2Y, position: 'absolute', bottom: '10%', left: '-20%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.04) 0%, transparent 60%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} 
      />

      {/* Classy Marquee Banner */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '0.6rem 0', overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', position: 'relative', zIndex: 20 }}>
        <div className="animate-marquee" style={{ color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.15em' }}>
          {[...Array(6)].map((_, i) => (
            <span key={i} style={{ paddingRight: '3rem' }}>
              ✦ COMPLIANT WITH DIGITAL PERSONAL DATA PROTECTION ACT (DPDP) ✦ INTEGRATED WITH TRADITIONAL KNOWLEDGE DIGITAL LIBRARY (TKDL) ✦ ENFORCING SECTION 3(P) OF INDIAN PATENTS ACT 1970 
            </span>
          ))}
        </div>
      </div>

      {/* Space for Floating Navbar */}
      <div style={{ height: '80px', width: '100%', position: 'relative', zIndex: 10 }} />

      {/* Hero Section */}
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', flex: 1, display: 'flex', alignItems: 'center', paddingTop: '6vh', paddingBottom: '10vh', paddingLeft: '2rem', paddingRight: '2rem', position: 'relative', zIndex: 5 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '5rem', width: '100%', alignItems: 'center' }}>
          
          {/* Left Column: Typography & CTA */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1.25rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '999px', color: 'var(--accent-emerald)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2.5rem' }}>
              <Scale size={16} />
              <span>Built for the Indian Patents Act & BDA 2023</span>
            </motion.div>

            <motion.h2 variants={itemVariants} style={{ fontSize: 'clamp(3.5rem, 7vw, 6rem)', fontWeight: 800, lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
              Statutory <br/> Intelligence for <br/>
              <span style={{ position: 'relative', display: 'block', width: '100%', height: '1.5em', marginTop: '0.1em' }}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={textIndex}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4 }}
                    className="text-gradient-animated"
                    style={{ position: 'absolute', left: 0, top: 0, width: '100%', whiteSpace: 'normal', wordBreak: 'keep-all' }}
                  >
                    {rotatingTexts[textIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h2>

            <motion.p variants={itemVariants} style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '580px', lineHeight: 1.6, marginBottom: '3rem' }}>
              A traceable, multilingual RAG assistant that evaluates Ayurvedic formulations against the Traditional Knowledge Digital Library (TKDL) and statutory frameworks to prevent Biopiracy.
            </motion.p>

            <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <button className="group relative overflow-hidden" style={{ padding: '1.1rem 2.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '999px', fontWeight: 600, transition: 'all 0.3s ease', background: 'var(--accent-emerald)', color: '#020617', boxShadow: '0 10px 30px rgba(16,185,129,0.2)', border: 'none' }}>
                  Launch Application 
                  <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <ArrowRight size={20} />
                  </motion.div>
                </button>
              </Link>
              <button className="glass-panel" style={{ padding: '1.1rem 2.5rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', background: 'transparent' }}>
                View Research
              </button>
            </motion.div>
          </motion.div>

          {/* Right Column: AI Generated Hero Graphic, Search Mockup & Tech Badges */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'relative', width: '100%', aspectRatio: '4/3', display: 'flex', justifyContent: 'center' }}
          >
            {/* Floating Tech Badges */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 15, background: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
            >
              <Cpu size={16} className="text-blue-400" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>ChromaDB Vector Store</span>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }} 
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
              style={{ position: 'absolute', top: '35%', left: '-20px', zIndex: 15, background: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
            >
              <Database size={16} className="text-amber-400" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Gemini AI Engine</span>
            </motion.div>

            {/* Interactive Search Mockup Floating Element */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              style={{ position: 'absolute', bottom: '-20px', left: '-30px', right: '20px', zIndex: 10, background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '1.25rem 1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <Search size={22} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: '1rem' }}>
                  {displayedQuery}
                  <span className="cursor-blink" style={{ color: 'var(--text-muted)' }}>|</span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: !isTyping && displayedQuery.length === mockQueries[queryIndex].length ? 'var(--accent-crimson)' : 'var(--accent-amber)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>
                  {!isTyping && displayedQuery.length === mockQueries[queryIndex].length ? 'VERDICT: SEC 3(P) VIOLATION DETECTED' : 'ANALYZING KNOWLEDGE GRAPH...'}
                </span>
              </div>
            </motion.div>

            <TiltHero>
              <img src="/hero_graphic.jpg" alt="AI Ayurvedic Network Graphic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </TiltHero>
          </motion.div>

        </div>
      </div>

      {/* SECTION: Asymmetric Bento Box Feature Grid */}
      <motion.div style={{ zIndex: 10, position: 'relative' }}>
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: '8rem', paddingBottom: '6rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <ScrollRevealText 
              text="Engineered for Examiners." 
              className="text-3xl md:text-4xl font-bold mb-3 tracking-tight"
            />
          </div>

          <motion.div 
            variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridAutoRows: 'minmax(250px, auto)', gap: '1.5rem' }}
          >
            {/* Massive Hero Card */}
            <motion.div variants={itemVariants} style={{ gridColumn: 'span 8', gridRow: 'span 2' }}>
              <SpotlightCard className="glass-panel" style={{ padding: '3rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(16,185,129,0.05) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', opacity: 0.05, transform: 'rotate(-10deg)' }}>
                  <Network size={400} />
                </div>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                  <Gavel size={32} />
                </div>
                <h3 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>Statutory RAG Engine</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.6, maxWidth: '85%', position: 'relative', zIndex: 1 }}>
                  Answers are structurally grounded in the Patents Act 1970 (Sec 3p) and Biological Diversity Act 2023. Every verdict provides a traceable citation vault directly to the TKDL and ancient manuscripts.
                </p>
              </SpotlightCard>
            </motion.div>

            {/* Small Card 1 */}
            <motion.div variants={itemVariants} style={{ gridColumn: 'span 4' }}>
              <SpotlightCard className="glass-panel" style={{ padding: '2rem', height: '100%', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', marginBottom: '1.25rem' }}>
                  <Lock size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '0.5rem' }}>DPDP Compliant</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Zero-retention pipeline with aggressive PII scrubbing. Ensures strict compliance with India's DPDP Act.
                </p>
              </SpotlightCard>
            </motion.div>

            {/* Small Card 2 */}
            <motion.div variants={itemVariants} style={{ gridColumn: 'span 4' }}>
              <SpotlightCard className="glass-panel" style={{ padding: '2rem', height: '100%', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-crimson)', marginBottom: '1.25rem' }}>
                  <Languages size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '0.5rem' }}>Bhashini-Ready</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Native integration with national language infrastructure to support Hindi, Marathi, and English ops.
                </p>
              </SpotlightCard>
            </motion.div>

            {/* Medium Horizontal Card */}
            <motion.div variants={itemVariants} style={{ gridColumn: 'span 12' }}>
              <SpotlightCard className="glass-panel" style={{ padding: '2rem 2.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-amber)', marginBottom: '1.25rem' }}>
                    <Network size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>Prior-Art Knowledge Graph</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '700px' }}>
                    Automatically constructs dynamic relational knowledge graphs to map complex vernacular taxonomies (e.g., 'Haldi') to biological precedents (e.g., 'Curcuma longa').
                  </p>
                </div>
              </SpotlightCard>
            </motion.div>

          </motion.div>
        </div>
      </motion.div>

      {/* SECTION: Flowchart - How it Works */}
      <div style={{ paddingTop: '6rem', paddingBottom: '6rem', position: 'relative', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', paddingLeft: '2rem', paddingRight: '2rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <ScrollRevealText 
              text="How IP-SAKTI Works" 
              className="text-[2.5rem] font-[700] mb-[0.75rem] tracking-tight"
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              A seamless, automated pipeline from user query to statutory verdict.
            </p>
          </div>

          <div ref={flowchartRef} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', paddingBottom: '1rem' }}>
            {/* Background static line */}
            <div style={{ position: 'absolute', left: '50%', top: '40px', bottom: '40px', width: '1px', background: 'rgba(255,255,255,0.08)', transform: 'translateX(-50%)', zIndex: 0 }} />
            
            {/* Draw-on-scroll Line */}
            <motion.div 
              style={{ 
                position: 'absolute', left: '50%', top: '40px', width: '2px', 
                background: 'var(--accent-emerald)', 
                transform: 'translateX(-50%)', zIndex: 1, height: lineHeight,
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
              }} 
            />

            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5 }}>
              <SpotlightCard className="glass-panel" style={{ width: '80%', margin: '0 auto', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 10, position: 'relative' }}>
                <div style={{ position: 'absolute', left: '50%', top: '50%', width: '12px', height: '12px', borderRadius: '50%', background: '#020617', border: '3px solid var(--accent-emerald)', transform: 'translate(-50%, -50%)', zIndex: 5 }} />
                <div style={{ width: '60px', height: '60px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', flexShrink: 0 }}>
                  <Languages size={28} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>1. Multilingual Input</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>User queries via voice or text in Hindi, Marathi, or English. Handled via standard Web APIs.</p>
                </div>
              </SpotlightCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5 }}>
              <SpotlightCard className="glass-panel" style={{ width: '80%', margin: '0 auto', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 10, position: 'relative', flexDirection: 'row-reverse', textAlign: 'right' }}>
                <div style={{ position: 'absolute', left: '50%', top: '50%', width: '12px', height: '12px', borderRadius: '50%', background: '#020617', border: '3px solid var(--accent-emerald)', transform: 'translate(-50%, -50%)', zIndex: 5 }} />
                <div style={{ width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)', flexShrink: 0 }}>
                  <Fingerprint size={28} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>2. DPDP Scrubbing & Ontology Parsing</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>PII is stripped. Vernacular plant names are mapped to botanical binomials.</p>
                </div>
              </SpotlightCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5 }}>
              <SpotlightCard className="glass-panel" style={{ width: '80%', margin: '0 auto', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 10, position: 'relative' }}>
                <div style={{ position: 'absolute', left: '50%', top: '50%', width: '12px', height: '12px', borderRadius: '50%', background: '#020617', border: '3px solid var(--accent-blue)', transform: 'translate(-50%, -50%)', zIndex: 5 }} />
                <div style={{ width: '60px', height: '60px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-amber)', flexShrink: 0 }}>
                  <Database size={28} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>3. Vector RAG Retrieval</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>ChromaDB cross-references the parsed formulation against the TKDL to establish prior-art.</p>
                </div>
              </SpotlightCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5 }}>
              <SpotlightCard className="glass-panel" style={{ width: '80%', margin: '0 auto', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 10, position: 'relative', flexDirection: 'row-reverse', textAlign: 'right' }}>
                <div style={{ position: 'absolute', left: '50%', top: '50%', width: '12px', height: '12px', borderRadius: '50%', background: '#020617', border: '3px solid var(--accent-blue)', transform: 'translate(-50%, -50%)', zIndex: 5 }} />
                <div style={{ width: '60px', height: '60px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-crimson)', flexShrink: 0 }}>
                  <FileText size={28} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>4. Cryptographic Verdict & Escalation</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>A final advisory is generated with SHA-256 hashed citations for the examiner.</p>
                </div>
              </SpotlightCard>
            </motion.div>

          </div>
        </div>
      </div>

      {/* SECTION: The Solution / Final CTA */}
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '8rem', paddingBottom: '8rem', paddingLeft: '2rem', paddingRight: '2rem', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Ready to Protect <br/> <span className="text-gradient-animated">Traditional Knowledge?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto 3rem auto', lineHeight: 1.6 }}>
            IP-SAKTI Sahayak empowers examiners, researchers, and patent agents with instant, legally-grounded intelligence.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <button className="group relative overflow-hidden" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '999px', fontWeight: 600, background: 'var(--accent-emerald)', color: '#020617', transition: 'transform 0.2s ease, box-shadow 0.2s ease', boxShadow: '0 10px 30px rgba(16,185,129,0.2)', border: 'none' }}>
                Launch the Dashboard <ArrowRight size={22} />
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
      
      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', position: 'relative', zIndex: 20 }}>
        Built for Smart India Hackathon 2026. <br/>
        <span style={{ marginTop: '0.5rem', display: 'inline-block' }}>IP-SAKTI Sahayak &copy; 2026</span>
      </footer>
    </main>
  );
}
