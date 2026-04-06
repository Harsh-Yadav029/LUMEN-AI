import { motion, useMotionValue, useSpring, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

function useTypewriter(texts, speed = 48) {
  const [display, setDisplay]   = useState('');
  const [textIdx, setTextIdx]   = useState(0);
  const [charIdx, setCharIdx]   = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[textIdx];
    const timeout = setTimeout(() => {
      if (!deleting) {
        if (charIdx < current.length) { setDisplay(current.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }
        else setTimeout(() => setDeleting(true), 1800);
      } else {
        if (charIdx > 0) { setDisplay(current.slice(0, charIdx - 1)); setCharIdx(c => c - 1); }
        else { setDeleting(false); setTextIdx(i => (i + 1) % texts.length); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, textIdx, texts, speed]);
  return display;
}

const demoMessages = [
  { role: 'user', text: 'What are the key findings in this research paper?' },
  { role: 'ai',   text: 'Based on the document, the three key findings are: improved model accuracy by 23%, reduced inference time, and lower resource consumption on edge devices.' },
  { role: 'user', text: 'Explain the methodology in simple terms.' },
  { role: 'ai',   text: 'The researchers used a novel transformer architecture with sparse attention — processing longer sequences with O(n log n) complexity instead of O(n²).' },
];

function LiveDemo() {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    if (visible >= demoMessages.length) return;
    const t = setTimeout(() => setVisible(v => v + 1), visible === 0 ? 600 : 1400);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
      {/* Titlebar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-bg-secondary border-b border-border">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        <span className="ml-2 text-xs font-mono text-text-muted">Lumen — research-paper.pdf</span>
      </div>
      {/* Messages */}
      <div className="flex flex-col gap-3 p-4 min-h-[220px]">
        <AnimatePresence>
          {demoMessages.slice(0, visible).map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5 ${m.role === 'ai' ? 'bg-accent-faint border border-accent/20 text-accent' : 'bg-bg-hover border border-border text-text-muted'}`}>
                {m.role === 'ai' ? 'L' : 'U'}
              </div>
              <div className={`text-xs leading-relaxed px-3 py-2 rounded-xl max-w-[85%] ${m.role === 'ai' ? 'bg-bg-secondary border border-border text-text-primary' : 'bg-accent-faint border border-accent/15 text-text-primary'}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {visible < demoMessages.length && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent-faint border border-accent/20 flex items-center justify-center text-[9px] font-bold text-accent">L</div>
            <div className="flex gap-1 px-3 py-2.5 bg-bg-secondary border border-border rounded-xl">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-accent" style={{ animation: `typing 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }) {
  const ref  = useRef(null);
  const x    = useMotionValue(0);
  const y    = useMotionValue(0);
  const rotX = useSpring(y, { stiffness: 200, damping: 25 });
  const rotY = useSpring(x, { stiffness: 200, damping: 25 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true }}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d', perspective: 800 }}
      onMouseMove={e => { const r = ref.current.getBoundingClientRect(); x.set((e.clientX - r.left - r.width/2) / r.width * 18); y.set(-(e.clientY - r.top - r.height/2) / r.height * 18); }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className="bg-bg-card border border-border rounded-xl p-5 hover:border-accent/25 transition-colors duration-200 cursor-default relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="w-9 h-9 rounded-lg bg-accent-faint border border-accent/15 flex items-center justify-center text-accent mb-3.5">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1.5">{title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
    </motion.div>
  );
}

const features = [
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>, title: 'Semantic Search', desc: 'Understands meaning, not keywords. Ask naturally, get exactly what you need from deep inside any document.' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, title: 'Contextual Memory', desc: 'Every conversation is remembered. Come back days later — Lumen knows exactly where you left off.' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, title: 'Instant Answers', desc: 'Groq-powered inference means answers stream in under a second. No waiting, no spinning.' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: 'Private by Default', desc: 'Documents live in your own namespace. Nothing shared, nothing trained on. Your data stays yours.' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, title: 'Any PDF, Any Size', desc: 'Research papers, contracts, textbooks — smart chunking handles long documents without losing context.' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title: 'Dual AI Fallback', desc: 'Groq as primary, Gemini as backup. One hits a limit, the other kicks in — zero downtime, always available.' },
];

export default function LandingPage({ goToLogin, goToRegister }) {
  const cursorX = useMotionValue(-300);
  const cursorY = useMotionValue(-300);
  const glowX   = useSpring(cursorX, { stiffness: 80, damping: 20 });
  const glowY   = useSpring(cursorY, { stiffness: 80, damping: 20 });
  const { scrollY } = useScroll();
  const heroY       = useTransform(scrollY, [0, 500], [0, 80]);
  const typeword    = useTypewriter(['research papers', 'legal contracts', 'financial reports', 'academic theses', 'technical manuals']);

  useEffect(() => {
    const move = (e) => { cursorX.set(e.clientX); cursorY.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans overflow-x-hidden">

      {/* Cursor glow */}
      <motion.div
        className="fixed w-80 h-80 rounded-full pointer-events-none z-0"
        style={{ x: glowX, y: glowY, translateX: '-50%', translateY: '-50%', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%)' }}
      />

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg-primary/80 backdrop-blur-xl"
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-8">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">LUMEN</span>
          <div className="flex gap-6 flex-1">
            {['Features', 'Demo', 'How it works'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToLogin} className="text-xs font-medium text-text-secondary border border-border rounded-lg px-4 py-2 hover:border-border-light hover:text-text-primary transition-all duration-150">
              Sign in
            </button>
            <button onClick={goToRegister} className="text-xs font-semibold text-bg-primary bg-accent rounded-lg px-4 py-2 hover:bg-accent-soft transition-all duration-150">
              Sign up
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative z-10 min-h-screen flex items-center max-w-6xl mx-auto px-6 pt-14 gap-12">
        <motion.div style={{ y: heroY }} className="flex-1 flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/20 bg-accent-faint text-xs text-accent font-medium w-fit"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
            AI-powered document intelligence
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-6xl font-bold leading-[1.07] tracking-tight"
          >
            Talk to your<br />
            <span className="text-accent italic">
              {typeword}<span className="animate-blink not-italic font-light">|</span>
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-base text-text-secondary max-w-md leading-relaxed"
          >
            Upload any PDF. Ask anything. Get answers grounded in your document — with the depth of a senior analyst explaining it to you.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-center gap-3">
            <button onClick={goToRegister} className="flex items-center gap-2 px-5 py-2.5 bg-accent text-bg-primary text-sm font-semibold rounded-xl hover:bg-accent-soft transition-all duration-150 shadow-lg shadow-accent/20">
              Start for free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <a href="#demo" className="px-5 py-2.5 text-sm text-text-secondary border border-border rounded-xl hover:border-border-light hover:text-text-primary transition-all duration-150">
              See it in action
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 max-w-[460px] hidden md:block"
        >
          <LiveDemo />
        </motion.div>
      </section>

      {/* ── Tagline ── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
        className="relative z-10 border-y border-border bg-bg-secondary/40 py-16 px-6"
      >
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-2xl md:text-3xl font-semibold leading-snug text-text-primary">
            Turn complex documents into{' '}
            <span className="text-accent">clear, intelligent conversations</span>
            {' '}— instantly.
          </p>
          <motion.div
            initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.8 }} viewport={{ once: true }}
            className="h-px mt-6 mx-auto w-2/5 origin-left"
            style={{ background: 'linear-gradient(90deg, transparent, #10B981, transparent)' }}
          />
        </div>
      </motion.section>

      {/* ── Stats ── */}
      <section id="how-it-works" className="relative z-10 max-w-4xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { val: '500+', label: 'Documents processed' },
          { val: '98%',  label: 'Answer accuracy' },
          { val: '<1s',  label: 'Response time' },
          { val: '100%', label: 'Private by default' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="text-center">
            <p className="text-3xl font-bold text-accent mb-1">{s.val}</p>
            <p className="text-xs text-text-secondary">{s.label}</p>
          </motion.div>
        ))}
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-accent mb-3">Capabilities</p>
          <h2 className="text-3xl font-bold text-text-primary">Everything you need to understand any document</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-4">
          {features.map((f, i) => <FeatureCard key={i} {...f} delay={i * 0.07} />)}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="demo" className="relative z-10 max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-accent mb-3">How it works</p>
          <h2 className="text-3xl font-bold text-text-primary">Three steps to document clarity</h2>
        </motion.div>
        <div className="flex flex-col gap-0">
          {[
            { n: '01', title: 'Upload your PDF', desc: 'Drop any PDF — research paper, contract, report. Lumen chunks and embeds it into a private vector store in seconds.' },
            { n: '02', title: 'Ask in plain English', desc: 'No special syntax. No keyword tricks. Just ask what you want to know, exactly how you\'d ask a human expert.' },
            { n: '03', title: 'Get expert answers', desc: 'Lumen surfaces exact context from your document, then explains it with the depth of a knowledgeable analyst.' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }}
              className="flex gap-5 pb-10 relative"
            >
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-accent-faint border border-accent/20 flex items-center justify-center text-[11px] font-semibold text-accent font-mono flex-shrink-0">
                  {s.n}
                </div>
                {i < 2 && <div className="w-px flex-1 mt-2 bg-gradient-to-b from-accent/20 to-transparent" />}
              </div>
              <div className="pb-2">
                <h3 className="text-sm font-semibold text-text-primary mb-1.5">{s.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
        className="relative z-10 text-center py-24 px-6 overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(16,185,129,0.06), transparent)' }} />
        <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 leading-tight relative z-10">
          Your documents are waiting<br />to talk back.
        </h2>
        <p className="text-base text-text-secondary mb-8 relative z-10">Upload your first PDF and get an answer in under 30 seconds.</p>
        <button
          onClick={goToRegister}
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent text-bg-primary text-sm font-semibold rounded-xl hover:bg-accent-soft transition-all duration-150 shadow-xl shadow-accent/20 relative z-10"
        >
          Open Lumen — it's free
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border py-8 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-1">LUMEN</p>
        <p className="text-xs text-text-muted">Built with intelligence. Designed for clarity.</p>
        <p className="text-xs text-text-muted mt-1">© {new Date().getFullYear()} Lumen. All rights reserved.</p>
      </footer>
    </div>
  );
}
