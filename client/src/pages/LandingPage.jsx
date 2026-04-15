import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';

function useTypewriter(texts, speed = 48) {
  const [display, setDisplay]   = useState('');
  const [textIdx, setTextIdx]   = useState(0);
  const [charIdx, setCharIdx]   = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!texts || texts.length === 0) return;
    const current = texts[textIdx];
    const timeout = setTimeout(() => {
      if (!deleting) {
        if (charIdx < current.length) { setDisplay(current.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }
        else setTimeout(() => setDeleting(true), 2500);
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
  { role: 'user', text: 'Can you summarize the key findings in the Q4 Financial Report?' },
  { role: 'ai',   text: 'Certainly. The primary takeaways are a 14% increase in core software revenue, a reduction in operating costs due to new cloud infrastructure, and a projected 5% growth in Q1.' }
];

function LiveDemo() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= demoMessages.length) return;
    const t = setTimeout(() => setVisible(v => v + 1), visible === 0 ? 800 : 2500);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] p-6 shadow-[0px_24px_48px_rgba(47,51,51,0.06)] relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-container" />
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-outline-variant/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-outline-variant/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-outline-variant/30" />
        </div>
        <span className="text-xs font-semibold tracking-wide text-on-surface-variant font-body">Lumen Analysis</span>
      </div>

      <div className="flex flex-col gap-5 min-h-[200px]">
        <AnimatePresence>
          {demoMessages.slice(0, visible).map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${m.role === 'ai' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface'}`}>
                {m.role === 'ai' ? 'L' : 'U'}
              </div>
              <div className={`text-sm leading-relaxed px-4 py-3 font-body ${m.role === 'ai' ? 'bg-surface-container-low text-on-surface rounded-2xl rounded-tl-sm' : 'bg-surface text-on-surface border border-outline-variant/15 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%]'}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {visible < demoMessages.length && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary-container">L</div>
            <div className="flex gap-1 px-4 py-3 bg-surface-container-low rounded-2xl rounded-tl-sm">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60" style={{ animation: `typing 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// 3D Background Material / Object
function BackgroundShape() {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1} >
      <Sphere args={[1, 64, 64]} scale={2.2}>
        <MeshDistortMaterial
          color="#c9e9e0"
          attach="material"
          distort={0.4}
          speed={1.5}
          roughness={0.2}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.2}
          transparent
          opacity={0.65}
        />
      </Sphere>
    </Float>
  );
}

export default function LandingPage({ goToLogin, goToRegister }) {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 80]);
  const opacityFade = useTransform(scrollY, [0, 300], [1, 0.4]);

  const typeword = useTypewriter(['research papers', 'legal contracts', 'financial reports', 'academic theses']);

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
      
      {/* 3D Floating Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1} color="#faf9f8" />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#c9e9e0" />
          <BackgroundShape />
        </Canvas>
      </div>

      {/* Modern TopAppBar */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-[24px] border-b border-outline-variant/10"
      >
        <div className="flex justify-between items-center px-6 md:px-12 py-4 w-full max-w-[1920px] mx-auto">
          <div className="text-xl font-extrabold tracking-tight text-primary font-headline cursor-default">
            Lumen
          </div>
          <div className="hidden md:flex gap-10 items-center">
            <a className="text-on-surface font-semibold text-sm border-b-2 border-primary pb-1 font-body transition-colors" href="#">Product</a>
            {/* <a className="text-on-surface-variant font-medium text-sm hover:text-on-surface rounded-lg transition-colors font-body" href="#">Solutions</a> */}
            <a className="text-on-surface-variant font-medium text-sm hover:text-on-surface rounded-lg transition-colors font-body" href="#">Pricing</a>
            <button onClick={goToLogin} className="text-on-surface-variant font-semibold text-sm hover:text-on-surface transition-colors font-body">
              Sign In
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={goToRegister} className="bg-gradient-to-tr from-primary to-primary-dim text-on-primary px-5 py-2.5 rounded-full font-bold text-sm shadow-[0_4px_14px_rgba(71,100,93,0.2)] hover:shadow-[0_6px_20px_rgba(71,100,93,0.3)] hover:-translate-y-0.5 transition-all duration-300 font-body">
              Get Started
            </button>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 pt-32 pb-20">
        {/* Soft Hero Section */}
        <section className="px-6 md:px-12 max-w-7xl mx-auto min-h-[80vh] flex flex-col md:flex-row items-center gap-12 lg:gap-20">
          <motion.div 
            style={{ y: heroY, opacity: opacityFade }}
            className="flex-1 flex flex-col items-start"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold mb-8 font-body border border-outline-variant/20 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
              Lumen 1.0
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-6xl lg:text-[5rem] font-headline font-bold leading-[1.05] tracking-tight mb-6"
            >
              Understand <br/>
              <span className="text-primary italic font-light relative">
                {typeword}<span className="inline-block w-1 h-[1em] bg-primary/70 animate-blink align-text-bottom ml-1" />
              </span><br/>
              effortlessly.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7 }}
              className="text-lg md:text-xl text-on-surface-variant max-w-lg font-body leading-relaxed mb-10"
            >
              Move beyond keyword search. Lumen transforms complex documents into clear, human-centered narratives, providing the editorial depth your decisions deserve.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="flex flex-wrap items-center gap-4"
            >
              <button onClick={goToRegister} className="bg-primary text-on-primary px-8 py-3.5 rounded-full font-bold shadow-ambient hover:shadow-[0_16px_40px_rgba(71,100,93,0.2)] hover:-translate-y-1 transition-all duration-300 font-body">
                Open Workspace
              </button>
              {/* <button className="px-8 py-3.5 rounded-full font-semibold text-on-surface bg-surface-container-low hover:bg-surface-container-high transition-colors duration-300 font-body">
                Book a Demo
              </button> */}
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full max-w-[500px]"
          >
            <LiveDemo />
          </motion.div>
        </section>

        {/* Feature Highlights - The "Notion" spacious scroll effect */}
        <section className="px-6 md:px-12 max-w-7xl mx-auto mt-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-headline font-bold mb-5">Designed for the human mind.</h2>
            <p className="text-on-surface-variant font-body text-lg max-w-2xl mx-auto">We use intentional asymmetry, tonal depth, and generous whitespace to guide your eye to the insights that actually matter. No clutter, just clarity.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              { icon: 'auto_awesome', title: 'Contextual Memory', desc: 'Lumen remembers your entire conversation history, mapping concepts over time without losing the plot.' },
              { icon: 'speed', title: 'Instant Synthesis', desc: 'Powered by highly optimized inference, complex syntheses stream to your screen in mere seconds.' },
              { icon: 'shield_lock', title: 'Private & Secure', desc: 'Your data forms an isolated enclave. Nothing is shared, nothing is trained upon without explicit intent.' }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="group p-8 rounded-[2rem] bg-surface-container-low hover:bg-surface-container shadow-sm hover:shadow-ambient hover:-translate-y-2 transition-all duration-500 cursor-default"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary-container text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <span className="material-symbols-outlined">{f.icon}</span>
                </div>
                <h3 className="text-xl font-headline font-bold mb-3">{f.title}</h3>
                <p className="text-on-surface-variant font-body leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mt-40 mb-10 px-6 md:px-12 max-w-5xl mx-auto"
        >
          <div className="bg-primary text-on-primary rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            {/* Subtle inner gradient shift */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            
            <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6 relative z-10">
              Ready to seek clarity?
            </h2>
            <p className="font-body text-primary-container text-lg md:text-xl mb-10 max-w-xl mx-auto relative z-10">
              Join thousands of professionals transforming how they interact with monumental documents and complex research.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <button onClick={goToRegister} className="bg-surface text-on-surface px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-body">
                Get Early Access
              </button>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 border-t border-outline-variant/20 py-10 text-center bg-surface-container-lowest">
        <p className="text-xl font-headline font-bold text-on-surface mb-2">Lumen</p>
        <p className="text-sm text-on-surface-variant font-body mb-6">Designed with intention. Built for clarity.</p>
        <div className="flex gap-6 justify-center text-sm font-body text-on-surface-variant">
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
          <a href="#" className="hover:text-primary transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
