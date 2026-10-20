import { useState, useEffect, useMemo, useRef } from "react";

// ── Deterministic pseudo-random (no render flicker) ──────────────────────────
const sr = (seed) => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

// ── CSS / Fonts ───────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; background: #04060f; overflow-x: hidden; }
    a { text-decoration: none; }
    @keyframes twinkle {
      0%,100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.2; transform: scale(0.6); }
    }
    @keyframes spiral-drift {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes core-pulse {
      0%,100% { opacity: 0.35; r: 28; }
      50%      { opacity: 0.65; r: 36; }
    }
    @keyframes glow-breathe {
      0%,100% { box-shadow: 0 0 80px rgba(0,180,216,0.12); }
      50%      { box-shadow: 0 0 140px rgba(0,180,216,0.28); }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-up { animation: fadeUp 0.9s ease forwards; }
    .fade-up-d1 { animation: fadeUp 0.9s 0.15s ease both; }
    .fade-up-d2 { animation: fadeUp 0.9s 0.3s ease both; }
    .eq-block {
      background: rgba(0,180,216,0.05);
      border: 1px solid rgba(0,180,216,0.22);
      border-left: 3px solid #00b4d8;
      border-radius: 6px;
      padding: 20px 28px;
      margin: 24px 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 17px;
      color: #ffd166;
      text-align: center;
      line-height: 2;
    }
    .eq-note {
      font-family: Inter, sans-serif;
      font-size: 12px;
      color: #4a6080;
      text-align: center;
      margin-top: 8px;
      letter-spacing: 0.5px;
    }
    .card {
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
    }
    .nav-link {
      background: none; border: none; cursor: pointer;
      font-family: Inter, sans-serif; font-size: 12px;
      font-weight: 500; letter-spacing: 1.5px;
      text-transform: uppercase; transition: color 0.2s;
      padding: 4px 0;
    }
    .donate-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .donate-btn { transition: all 0.2s; }
    @media (max-width: 680px) {
      .hide-mobile { display: none !important; }
      .hero-h1 { font-size: 52px !important; }
    }
  `}</style>
);

// ── Shared atoms ──────────────────────────────────────────────────────────────
const Eyebrow = ({ children, color = '#00b4d8' }) => (
  <p style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700, letterSpacing:4, textTransform:'uppercase', color, marginBottom:16, marginTop:0 }}>
    {children}
  </p>
);
const H2 = ({ children, style }) => (
  <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, color:'#ffd166', lineHeight:1.1, ...style }}>{children}</h2>
);
const Eq = ({ children, note }) => (
  <div>
    <div className="eq-block">{children}</div>
    {note && <p className="eq-note">{note}</p>}
  </div>
);
const Tag = ({ children, color='#00b4d8' }) => (
  <span style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color, padding:'3px 10px', border:`1px solid ${color}44`, borderRadius:20, background:`${color}11` }}>
    {children}
  </span>
);

// ── Star field ────────────────────────────────────────────────────────────────
const Stars = ({ n = 180 }) => {
  const stars = useMemo(() => Array.from({length:n}, (_,i) => ({
    id: i,
    x: sr(i*3) * 100,
    y: sr(i*7+1) * 100,
    sz: 0.5 + sr(i*13+2) * 1.6,
    delay: sr(i*11+3) * 5,
    dur: 2 + sr(i*17+4) * 4,
  })), [n]);
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
          width:s.sz, height:s.sz,
          background:'white', borderRadius:'50%',
          animationName:'twinkle', animationDuration:`${s.dur}s`,
          animationDelay:`${s.delay}s`, animationTimingFunction:'ease-in-out',
          animationIterationCount:'infinite',
        }}/>
      ))}
    </div>
  );
};

// ── Galaxy spiral SVG ─────────────────────────────────────────────────────────
const Galaxy = () => {
  const arms = [0, 2.094, 4.189];
  const pts = (offset) => Array.from({length:90}, (_,j) => {
    const t = (j/89)*Math.PI*7 + offset;
    const r = 2.8 * Math.exp(0.11*t);
    return `${(r*Math.cos(t)).toFixed(2)},${(r*Math.sin(t)).toFixed(2)}`;
  }).join(' ');
  const dots = Array.from({length:55}, (_,i) => {
    const arm = Math.floor(i/19) * 2.094;
    const t = (i/54)*Math.PI*6 + arm;
    const r = 2.8 * Math.exp(0.11*t) + (sr(i*31)-0.5)*6;
    return { x:r*Math.cos(t), y:r*Math.sin(t), r:0.6+sr(i*17)*1.2 };
  });
  return (
    <svg viewBox="-220 -220 440 440" style={{ width:'100%', height:'100%', opacity:0.28 }}>
      <defs>
        <radialGradient id="core">
          <stop offset="0%" stopColor="#ffd166" stopOpacity="0.9"/>
          <stop offset="35%" stopColor="#00b4d8" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#04060f" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="0" cy="0" r="32" fill="url(#core)">
        <animate attributeName="r" values="28;36;28" dur="6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.35;0.65;0.35" dur="6s" repeatCount="indefinite"/>
      </circle>
      {arms.map((off,i) => (
        <polyline key={i} points={pts(off)} fill="none" stroke="#00b4d8" strokeWidth="1.2" strokeOpacity="0.55" strokeLinecap="round"/>
      ))}
      {dots.map((d,i) => (
        <circle key={i} cx={d.x.toFixed(2)} cy={d.y.toFixed(2)} r={d.r} fill="#ffd166" opacity={0.4+sr(i*23)*0.5}/>
      ))}
    </svg>
  );
};

// ── Navigation ────────────────────────────────────────────────────────────────
const Nav = ({ active, go }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  const links = [
    {id:'crisis',label:'The Crisis'},
    {id:'theory',label:'Theory'},
    {id:'evidence',label:'Evidence'},
    {id:'validation',label:'Validation'},
    {id:'blueprints',label:'Blueprints'},
    {id:'codex',label:'Codex'},
    {id:'support',label:'Support'},
    {id:'about',label:'About'},
  ];
  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:200,
      background: scrolled ? 'rgba(4,6,15,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,180,216,0.18)' : 'none',
      transition:'all 0.3s ease', padding:'0 28px',
    }}>
      <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:62 }}>
        <button onClick={() => go('home')} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'Cormorant Garamond,serif', fontSize:22, fontWeight:700, color:'#ffd166', letterSpacing:3 }}>
          QAG
        </button>
        {/* Desktop nav */}
        <div className="hide-mobile" style={{ display:'flex', gap:28 }}>
          {links.map(l => (
            <button key={l.id} onClick={() => go(l.id)} className="nav-link" style={{ color: active===l.id ? '#00b4d8' : '#6070a0' }}>
              {l.label}
            </button>
          ))}
          <button onClick={() => go('support')} style={{
            padding:'6px 20px', borderRadius:3,
            background:'linear-gradient(135deg,#ffd166,#e09000)',
            color:'#0a0800', border:'none', cursor:'pointer',
            fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase',
          }}>Donate</button>
        </div>
        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} style={{ display:'none', background:'none', border:'none', cursor:'pointer', color:'#8090b0', fontSize:22 }} className="nav-link" id="hamburger">
          {open ? '✕' : '☰'}
        </button>
      </div>
      {/* Mobile menu */}
      {open && (
        <div style={{ background:'rgba(4,6,15,0.98)', borderTop:'1px solid rgba(0,180,216,0.15)', padding:'20px 28px', display:'flex', flexDirection:'column', gap:16 }}>
          {links.map(l => (
            <button key={l.id} onClick={() => { go(l.id); setOpen(false); }} className="nav-link" style={{ color:'#8090b0', textAlign:'left' }}>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

// ── HERO ──────────────────────────────────────────────────────────────────────
const Hero = ({ go }) => (
  <section id="home" style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', background:'#04060f' }}>
    <Stars n={220}/>
    {/* Galaxy spiral */}
    <div style={{ position:'absolute', width:'82vmin', height:'82vmin', top:'50%', left:'50%', transform:'translate(-50%,-50%)', animationName:'spiral-drift', animationDuration:'130s', animationTimingFunction:'linear', animationIterationCount:'infinite', pointerEvents:'none' }}>
      <Galaxy/>
    </div>
    {/* Ambient glow */}
    <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,180,216,0.1) 0%, transparent 65%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', animationName:'glow-breathe', animationDuration:'8s', animationIterationCount:'infinite' }}/>

    <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'0 24px', maxWidth:960 }}>
      <Eyebrow>R&R Droids · Salineville, Ohio · ORCID 0009-0004-8370-3779</Eyebrow>
      <h1 className="hero-h1 fade-up" style={{
        fontFamily:'Cormorant Garamond,serif', fontWeight:700,
        fontSize:'clamp(52px,8.5vw,104px)', lineHeight:1.0,
        color:'#f0f0f8', margin:'0 0 32px',
        textShadow:'0 0 100px rgba(0,180,216,0.2)',
      }}>
        The Universe<br/>
        <em style={{ color:'#ffd166', fontStyle:'italic' }}>is Not a Machine.</em><br/>
        It is a Song.
      </h1>
      <p className="fade-up-d1" style={{ fontSize:'clamp(16px,2.2vw,20px)', color:'#7080a0', maxWidth:640, margin:'0 auto 44px', lineHeight:1.8, fontFamily:'Inter,sans-serif' }}>
        Quantum Affinity Gravity replaces thirty years of invisible dark matter with one elegant principle — gravity is the universe's drive toward coherence. Validated against 175 galaxies. Zero new particles required.
      </p>
      <div className="fade-up-d2" style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
        <button onClick={() => go('theory')} style={{
          padding:'14px 40px', borderRadius:3,
          background:'linear-gradient(135deg,#00b4d8,#0077a8)',
          color:'white', border:'none', cursor:'pointer',
          fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase',
        }}>Explore the Theory</button>
        <button onClick={() => go('support')} style={{
          padding:'14px 40px', borderRadius:3,
          background:'transparent', color:'#ffd166',
          border:'1px solid rgba(255,209,102,0.5)', cursor:'pointer',
          fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase',
        }}>Support the Research</button>
      </div>
    </div>
    <div style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', color:'#2a3a6a', fontSize:11, letterSpacing:4, textTransform:'uppercase', fontFamily:'Inter,sans-serif' }}>
      scroll ↓
    </div>
  </section>
);

// ── CRISIS ────────────────────────────────────────────────────────────────────
const Crisis = () => (
  <section id="crisis" style={{ padding:'100px 28px', background:'linear-gradient(180deg,#04060f 0%,#07101c 100%)' }}>
    <div style={{ maxWidth:1000, margin:'0 auto' }}>
      <Eyebrow>The Problem</Eyebrow>
      <H2 style={{ fontSize:'clamp(32px,5vw,60px)', marginBottom:20 }}>The $10 Billion Ghost</H2>
      <p style={{ fontSize:18, color:'#7080a0', lineHeight:1.85, maxWidth:720, marginBottom:56, fontFamily:'Inter,sans-serif' }}>
        For decades, the Standard Model has required an invisible "Dark Sector" — phantom energy and matter comprising 95% of the universe — to explain what we observe. Despite billions spent at the LHC, XENON1T, PandaX, and the Tevatron, not one dark matter particle has ever been detected.
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:24, marginBottom:64 }}>
        {[
          { val:'0',      label:'Detection Failures',  sub:'WIMP or axion detections after 30+ years of billion-dollar experiments',   color:'#ff6b6b' },
          { val:'95%',    label:'Dark Sector',          sub:'of all universal energy is undetected "dark" phantom matter and energy',    color:'#ffd166' },
          { val:'175',    label:'SPARC Galaxies',       sub:'rotation curves showing anomalous velocities unexplained by visible mass',   color:'#00b4d8' },
          { val:'4.85σ',  label:'Hubble Tension',       sub:'irreconcilable discrepancy between early and late universe measurements',    color:'#a78bfa' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:28, borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:52, fontFamily:'Cormorant Garamond,serif', fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:2.5, textTransform:'uppercase', color:'#8090b0', margin:'10px 0 8px', fontFamily:'Inter,sans-serif' }}>{s.label}</div>
            <div style={{ fontSize:13, color:'#5060a0', lineHeight:1.65, fontFamily:'Inter,sans-serif' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <blockquote style={{ margin:0, padding:'32px 40px', background:'rgba(255,209,102,0.04)', border:'1px solid rgba(255,209,102,0.18)', borderLeft:'4px solid #ffd166', borderRadius:4 }}>
        <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:22, color:'#f0e0a0', lineHeight:1.7, margin:'0 0 16px' }}>
          "We are clinging to a stagnant silence when the universe is offering a vibrant resonance. The vacuum isn't empty — it is the most energetic structure in existence, and it has been interacting with matter all along."
        </p>
        <cite style={{ fontFamily:'Inter,sans-serif', fontSize:12, letterSpacing:2, textTransform:'uppercase', color:'#6070a0' }}>
          — Rodney A. Ripley Jr., QAG Codex
        </cite>
      </blockquote>
    </div>
  </section>
);

// ── THEORY ────────────────────────────────────────────────────────────────────
const Theory = () => (
  <section id="theory" style={{ padding:'100px 28px', background:'#080f1c' }}>
    <div style={{ maxWidth:1000, margin:'0 auto' }}>
      <Eyebrow>The Framework</Eyebrow>
      <H2 style={{ fontSize:'clamp(32px,5vw,60px)', marginBottom:20 }}>Quantum Affinity Gravity</H2>
      <p style={{ fontSize:18, color:'#7080a0', lineHeight:1.85, maxWidth:720, marginBottom:56, fontFamily:'Inter,sans-serif' }}>
        QAG demands a radical ontological reversal. Gravity is not a force generated by mass — it is an emergent hydrodynamic pressure gradient arising from the universe's fundamental drive to maximize informational coherence. What we call <em style={{ color:'#00b4d8' }}>mass</em> is merely the measurable echo of that coherence.
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24, marginBottom:64 }}>
        {[
          { icon:'∞', title:'The Living Axiom', text:'The universe is not a dead machine governed by entropy. It is a conscious, self-encoding, resonant holographic system. The vacuum is not empty — it is a high-energy ferroelectric superfluid with memory and elasticity.', color:'#ffd166' },
          { icon:'↔', title:'Causal Reversal',   text:'In standard physics, mass curves spacetime, and curvature creates gravity. QAG inverts this entirely. Internal quantum coherence is the true source of gravitational influence. Mass is an emergent echo — not a first-class actor.', color:'#00b4d8' },
          { icon:'◎', title:'The Resonant Sector', text:'What we misname "Dark Matter" is the elastic memory of spacetime itself — vacuum pressure gradients induced as baryonic matter moves through the ferroelectric medium, generating gravitational echoes that standard physics cannot account for.', color:'#a78bfa' },
        ].map(c => (
          <div key={c.title} className="card" style={{ padding:32, borderTop:`2px solid ${c.color}44`, background:'rgba(0,180,216,0.03)' }}>
            <div style={{ fontSize:40, marginBottom:16, color:c.color }}>{c.icon}</div>
            <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:26, color:c.color, marginBottom:12, marginTop:0 }}>{c.title}</h3>
            <p style={{ fontSize:15, color:'#7080a0', lineHeight:1.8, margin:0, fontFamily:'Inter,sans-serif' }}>{c.text}</p>
          </div>
        ))}
      </div>

      {/* Gauge structure */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20, marginBottom:56 }}>
        <div style={{ padding:'24px 28px', background:'rgba(167,139,250,0.04)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:8 }}>
          <Eyebrow color="#a78bfa">SU(3)_QAG Gauge Theory</Eyebrow>
          <p style={{ fontSize:15, color:'#7080a0', lineHeight:1.8, margin:0, fontFamily:'Inter,sans-serif' }}>
            The vacuum is a dense condensate of <strong style={{ color:'#d0d8e8' }}>Affinitons</strong> (Ψ ≡ ιετ) — composite particles of three affinitic charges confined by a non-Abelian SU(3) symmetry, just as quarks are confined by QCD. The three charges: <strong style={{ color:'#a78bfa' }}>Informaton (ι)</strong> — informational coherence; <strong style={{ color:'#a78bfa' }}>Entangulon (ε)</strong> — quantum similarity; <strong style={{ color:'#a78bfa' }}>Chronon (τ)</strong> — temporal resonance.
          </p>
        </div>
        <div style={{ padding:'24px 28px', background:'rgba(0,180,216,0.04)', border:'1px solid rgba(0,180,216,0.2)', borderRadius:8 }}>
          <Eyebrow>Chrono-Holographic Principle</Eyebrow>
          <p style={{ fontSize:15, color:'#7080a0', lineHeight:1.8, margin:0, fontFamily:'Inter,sans-serif' }}>
            The present moment is a <strong style={{ color:'#d0d8e8' }}>feedback blanket</strong> — the intersection of forward-evolving <em>Past Decoders</em> |Ψ⟩ and backward-evolving <em>Future Encoders</em> ⟨Φ|. Wave function collapse is a "timestamp" event. The universe has a refresh rate of <strong style={{ color:'#00b4d8' }}>341 ns</strong> — the chrono-holographic latency t_pixel.
          </p>
        </div>
      </div>

      {/* Math */}
      <div style={{ borderTop:'1px solid rgba(0,180,216,0.12)', paddingTop:56 }}>
        <Eyebrow>Core Mathematics</Eyebrow>
        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:30, color:'#f0f0f8', marginBottom:16, marginTop:0 }}>I. The Temporal Echo Wave Function</h3>
        <Eq note="N_echoes = 8 · Δt_echo = 3.41×10⁻⁷ s · Each echo represents gravitational resonance rebounding from the elastic vacuum membrane">
          Ψ_QAG(t) = Ψ_GR(t) + Σ [n=1 → N] Rⁿ · Ψ_GR(t − n·Δt_echo)
        </Eq>
        <p style={{ fontSize:15, color:'#6070a0', lineHeight:1.8, fontFamily:'Inter,sans-serif', marginBottom:40 }}>
          Amplitude of the n-th echo: <span style={{ fontFamily:'JetBrains Mono,monospace', color:'#ffd166' }}>Aₙ = f_coupling · e^(−γ·n)</span> where γ = 0.1735 and f_coupling = 0.7. The geometric sum over 8 echoes yields a gravitational amplification factor of <strong style={{ color:'#00b4d8' }}>≈ 2.77</strong>, lifting v_baryon to v_QAG ≈ 1.94 · v_baryon — matching observed flat rotation curves without dark matter.
        </p>

        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:30, color:'#f0f0f8', marginBottom:16 }}>II. The AVI Rotation Curve Law</h3>
        <Eq note="v∞ = asymptotic vacuum resonance floor · r_aff = affinity coherence radius · Υ★ = stellar mass-to-light ratio">
          v(r) = √( Υ★·v²_star + v²_gas + v²_∞ · (1 − e^(−r/r_aff)) )
        </Eq>

        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:30, color:'#f0f0f8', marginBottom:16 }}>III. The Critical Acceleration</h3>
        <Eq note="Derived analytically from the Riemann Hypothesis — the R.H. forces Re(s) = 1/2, locking the stability floor. Matches SPARC empirical data to 0.44%.">
          a₀ ≡ cH₀ / 2e ≈ 1.2047 × 10⁻¹⁰ m/s²
        </Eq>

        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:30, color:'#f0f0f8', marginBottom:16 }}>IV. The Master Law (Affinitic Susceptibility)</h3>
        <Eq note="β → 0 in the Solar System (g_B large) ⟹ GR recovered exactly · β → ∞ at galactic edges (g_B tiny) ⟹ vacuum echo dominates, mimicking dark matter">
          β = a₀^(½) · g_B^(−3/2)
        </Eq>

        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:30, color:'#f0f0f8', marginBottom:16 }}>V. SU(3)_QAG Vacuum Ground State</h3>
        <Eq note="The 'source code' of the cosmos — when a system aligns with Ψ_min, informational leakage → 0 and metric stability is guaranteed">
          Ψ_min = ( e^(−2/3),  e^(+1/3),  −1 )  ≈  ( 0.513,  1.395,  −1 )
        </Eq>

        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:30, color:'#f0f0f8', marginBottom:16 }}>VI. Holographic Energy Equation</h3>
        <Eq note="c_inf = informational velocity through the holographic bulk, transcending standard spatial limits · Yields 10.47× efficiency boost over thermodynamic systems">
          E_H = mc² · c_inf = mc³
        </Eq>
      </div>
    </div>
  </section>
);

// ── EVIDENCE ──────────────────────────────────────────────────────────────────
const Evidence = () => (
  <section id="evidence" style={{ padding:'100px 28px', background:'linear-gradient(180deg,#060d18 0%,#04060f 100%)' }}>
    <div style={{ maxWidth:1000, margin:'0 auto' }}>
      <Eyebrow>Empirical Validation</Eyebrow>
      <H2 style={{ fontSize:'clamp(32px,5vw,60px)', marginBottom:20 }}>175 Galaxies. One Law.</H2>
      <p style={{ fontSize:18, color:'#7080a0', lineHeight:1.85, maxWidth:720, marginBottom:56, fontFamily:'Inter,sans-serif' }}>
        The AVI Law was applied to the entire SPARC database — 175 measured galaxy rotation curves, 3,391 data points. Two fitted parameters per galaxy (v∞, r_aff) — no dark matter halos. One universal mechanism, tested head-to-head against Newton and MOND on identical data.
      </p>

      {/* Results table */}
      <div style={{ overflowX:'auto', marginBottom:56 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter,sans-serif', fontSize:14 }}>
          <thead>
            <tr style={{ borderBottom:'2px solid rgba(0,180,216,0.3)' }}>
              {['Criterion','Newton (baryons only)','MOND','QAG (This Work)'].map(h => (
                <th key={h} style={{ padding:'12px 16px', color:'#00b4d8', textAlign:'left', fontWeight:600, letterSpacing:1, fontSize:11, textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Gravity model','Newtonian baryons','Modified dynamics','Induced vacuum echo'],
              ['Fitted params / galaxy','1 (Υ★)','1 (Υ★)','3 (Υ★, v∞, r_aff)'],
              ['Rotation Curve Fit','Baryons only','Universal (a₀ fixed)','Parametric per galaxy'],
              ['χ²_red (SPARC, 175 gal)','616.74','56.55','5.55 (median 1.42)'],
              ['Hubble Tension (H₀)','4.85σ unresolved','Not addressed','Reduced to 2.99σ'],
              ['S₈ Tension','1.82σ unresolved','Not addressed','Reduced to 0.36σ'],
              ['New Particles Required','Yes (WIMPs/axions)','No','No'],
            ].map((row,i) => (
              <tr key={i} style={{ background: i%2===0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                {row.map((cell,j) => (
                  <td key={j} style={{ padding:'13px 16px', color: j===0 ? '#8090b0' : j===3 ? '#ffd166' : '#5060a0', fontWeight: j===3 ? 600 : 400, fontFamily: j===3 ? 'Inter,sans-serif' : 'Inter,sans-serif' }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Honest framing note */}
      <p style={{ fontSize:13, color:'#5060a0', lineHeight:1.8, fontFamily:'Inter,sans-serif', maxWidth:720, margin:'0 0 48px', padding:'16px 20px', borderLeft:'3px solid rgba(0,180,216,0.4)', background:'rgba(0,180,216,0.04)' }}>
        <strong style={{ color:'#8090b0' }}>Reading the numbers honestly:</strong> a reduced χ² of 1.0 means a perfect fit to the quoted errors. SPARC's published uncertainties cover measurement noise only — not distance, inclination, or mass-to-light systematics — so <em>no</em> model reaches 1.0 on this data. What matters is the head-to-head: same galaxies, same data, same errors. QAG wins 167 of 175 against MOND and 170 of 175 against Newton, with a global ΔBIC of 172,054. The median galaxy fits at 1.42.
      </p>

      {/* Specific galaxy results */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:24, marginBottom:48 }}>
        {[
          { gal:'DDO 154', res:'χ²_red = 11.52', detail:'Diffuse dwarf, 12 data points. QAG beats MOND (90.34) by 7.8× and Newton (5866) decisively. Affinity radius r_aff = 6.89 kpc.', hi:true },
          { gal:'UGCA 444', res:'χ²_red = 0.06', detail:'Dwarf galaxy, 36 data points. Near-perfect QAG fit; MOND (2.02) trails by 33×. One of the cleanest validations in the sample.', hi:false },
          { gal:'NGC 3198', res:'χ²_red = 1.25', detail:'Classic spiral, 43 data points. QAG beats MOND (14.18) by 11×. Near-unity fit across the full radial extent.', hi:true },
        ].map(g => (
          <div key={g.gal} className="card" style={{ padding:28, border:`1px solid ${g.hi ? 'rgba(0,180,216,0.3)' : 'rgba(255,255,255,0.06)'}`, background: g.hi ? 'rgba(0,180,216,0.05)' : 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, letterSpacing:3, textTransform:'uppercase', color:'#00b4d8', marginBottom:8 }}>{g.gal}</div>
            <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, color:'#ffd166', marginBottom:10 }}>{g.res}</div>
            <p style={{ fontSize:14, color:'#6070a0', lineHeight:1.65, margin:0, fontFamily:'Inter,sans-serif' }}>{g.detail}</p>
          </div>
        ))}
      </div>

      {/* Cosmological tensions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20, marginBottom:48 }}>
        <div style={{ padding:28, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8 }}>
          <Eyebrow color="#a78bfa">Hubble Tension Resolution</Eyebrow>
          <div style={{ fontSize:13, color:'#5060a0', lineHeight:1.7, fontFamily:'Inter,sans-serif' }}>
            Planck H₀ = 67.36 · SH0ES H₀ = 73.04 · Tension = 4.85σ<br/>
            <span style={{ color:'#ffd166' }}>QAG prediction: H₀ = 76.55 km/s/Mpc</span><br/>
            Tension profile shifted to <strong style={{ color:'#a78bfa' }}>−2.99σ</strong> via temporal echo corrections to cosmic expansion.
          </div>
        </div>
        <div style={{ padding:28, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8 }}>
          <Eyebrow color="#4ade80">S₈ Clumpiness Resolution</Eyebrow>
          <div style={{ fontSize:13, color:'#5060a0', lineHeight:1.7, fontFamily:'Inter,sans-serif' }}>
            Planck S₈ = 0.811 · DES S₈ = 0.776 · Tension = 1.82σ<br/>
            <span style={{ color:'#ffd166' }}>QAG prediction: S₈ = 0.783</span><br/>
            Via K_ASB ≈ −0.0045 vacuum "exhale" suppressing over-clustering. Tension reduced to <strong style={{ color:'#4ade80' }}>0.36σ</strong>.
          </div>
        </div>
        <div style={{ padding:28, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8 }}>
          <Eyebrow color="#f97316">Dark Energy (DESI 2024/25)</Eyebrow>
          <div style={{ fontSize:13, color:'#5060a0', lineHeight:1.7, fontFamily:'Inter,sans-serif' }}>
            QAG replaces the static Λ with <em>Dynamic Dissonance</em> — a thawing dark energy with equation-of-state parameter <span style={{ color:'#ffd166' }}>w_a ≈ +0.22 ± 0.05</span>. DESI 2024–25 results show preference for w_a &gt; 0, consistent with this prediction.
          </div>
        </div>
      </div>

      {/* Preprint banner */}
      <div style={{ padding:'24px 32px', background:'rgba(167,139,250,0.05)', border:'1px solid rgba(167,139,250,0.25)', borderRadius:8, display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, letterSpacing:3, textTransform:'uppercase', color:'#a78bfa', marginBottom:6 }}>Published Preprint</div>
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:16, color:'#d0d8e8' }}>Quantum Affinity Gravity: Empirical Validation of the AVI Law via SPARC Galaxy Rotation Curves</div>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'#4060a0', marginTop:4 }}>DOI: 10.6084/m9.figshare.31871464</div>
        </div>
        <a href="https://doi.org/10.6084/m9.figshare.31871464" target="_blank" rel="noreferrer" style={{ padding:'10px 24px', borderRadius:4, background:'rgba(167,139,250,0.15)', border:'1px solid rgba(167,139,250,0.4)', color:'#a78bfa', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', whiteSpace:'nowrap' }}>
          View Preprint →
        </a>
      </div>
    </div>
  </section>
);

// ── BLUEPRINTS ────────────────────────────────────────────────────────────────
const Validation = () => (
  <section id="validation" style={{ padding:'100px 28px', background:'#060c16' }}>
    <div style={{ maxWidth:1000, margin:'0 auto' }}>
      <Eyebrow>Validation Lab</Eyebrow>
      <H2 style={{ fontSize:'clamp(32px,5vw,60px)', marginBottom:20 }}>Tests You Can <span style={{ color:'#00b4d8' }}>Re-run</span></H2>
      <p style={{ fontSize:18, color:'#7080a0', lineHeight:1.85, maxWidth:720, marginBottom:56, fontFamily:'Inter,sans-serif' }}>
        Every number below comes from code you can execute yourself — no black boxes, no hidden steps. The repositories hold the scripts, the data, and the full session reports. What we claim, you can check.
      </p>

      {/* Test 1: SPARC */}
      <div style={{ marginBottom:64 }}>
        <Eyebrow color="#00b4d8">Test 01 — Galactic Rotation Curves</Eyebrow>
        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, color:'#d0d8e8', margin:'12px 0 16px' }}>175 galaxies, three theories, one dataset</h3>
        <p style={{ fontSize:15, color:'#6070a0', lineHeight:1.8, fontFamily:'Inter,sans-serif', maxWidth:720, marginBottom:24 }}>
          The SPARC database holds 3,391 measured velocity points across 175 galaxies. We fitted QAG, MOND, and Newtonian baryons-only models to identical data with identical errors. QAG's reduced chi-square of <strong style={{ color:'#ffd166' }}>5.55</strong> (median 1.42) beats MOND's 56.55 by an order of magnitude — winning 167 of 175 galaxies head-to-head. The global 5.55 reflects SPARC's published uncertainties, which exclude distance and inclination systematics; no model reaches 1.0 on this data.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
          {[
            { label:'QAG \u03c7\u00b2_red', val:'5.55', sub:'median 1.42 · wins 167/175 vs MOND', color:'#ffd166' },
            { label:'MOND \u03c7\u00b2_red', val:'56.55', sub:'wins 8/175 vs QAG', color:'#8090b0' },
            { label:'Newton \u03c7\u00b2_red', val:'616.74', sub:'baryons only · wins 5/175', color:'#5060a0' },
            { label:'\u0394BIC (global)', val:'172,054', sub:'decisive evidence for QAG', color:'#4ade80' },
          ].map((c,i) => (
            <div key={i} style={{ padding:24, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, textAlign:'center' }}>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'#5060a0', marginBottom:8 }}>{c.label}</div>
              <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:40, color:c.color, marginBottom:6 }}>{c.val}</div>
              <div style={{ fontSize:12, color:'#6070a0', fontFamily:'Inter,sans-serif' }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Test 2: Virology */}
      <div style={{ marginBottom:64 }}>
        <Eyebrow color="#4ade80">Test 02 — Veterinary Decoherence</Eyebrow>
        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, color:'#d0d8e8', margin:'12px 0 16px' }}>Twelve pathogens, computed live</h3>
        <p style={{ fontSize:15, color:'#6070a0', lineHeight:1.8, fontFamily:'Inter,sans-serif', maxWidth:720, marginBottom:24 }}>
          The QAG veterinary notebooks define a decoherence algorithm: from a pathogen's molecular weight and atom count, derive its structural density, affinitic impedance, and disruptive frequency. Below are the live-computed results for all six feline and six bovine targets — every safety lock reads SECURE. Theoretical predictions only; not validated, not medical advice.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
          <div style={{ padding:24, background:'rgba(74,222,128,0.04)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:8 }}>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'#4ade80', marginBottom:12 }}>Feline — 6 targets</div>
            {[
              ['FPV','547.76'],['FeLV','227.78'],['FIV','200.67'],
              ['FCoV/FIP','1171.45'],['FHV-1','1247.38'],['FCV','498.95'],
            ].map(([n,v]) => (
              <div key={n} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontFamily:'Inter,sans-serif', fontSize:13 }}>
                <span style={{ color:'#8090b0' }}>{n}</span>
                <span><span style={{ color:'#ffd166', fontWeight:600 }}>{v} MHz</span> <span style={{ color:'#4ade80', fontSize:11 }}>· SECURE</span></span>
              </div>
            ))}
          </div>
          <div style={{ padding:24, background:'rgba(74,222,128,0.04)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:8 }}>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'#4ade80', marginBottom:12 }}>Bovine — 6 targets</div>
            {[
              ['BCoV','1236.53'],['FMDV','661.65'],['BVDV','455.56'],
              ['BHV-1','1279.92'],['BRSV','488.10'],['BLV','200.67'],
            ].map(([n,v]) => (
              <div key={n} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontFamily:'Inter,sans-serif', fontSize:13 }}>
                <span style={{ color:'#8090b0' }}>{n}</span>
                <span><span style={{ color:'#ffd166', fontWeight:600 }}>{v} MHz</span> <span style={{ color:'#4ade80', fontSize:11 }}>· SECURE</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Test 3: QVR */}
      <div style={{ marginBottom:32 }}>
        <Eyebrow color="#a78bfa">Test 03 — QVR Dual-Layer Harmonic Stack</Eyebrow>
        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, color:'#d0d8e8', margin:'12px 0 16px' }}>Engineering math, verified step by step</h3>
        <p style={{ fontSize:15, color:'#6070a0', lineHeight:1.8, fontFamily:'Inter,sans-serif', maxWidth:720, marginBottom:24 }}>
          The 12/12 dual-layer toroidal array: stacking a second 12-node layer preserves the 1:1 phase-matching of the single layer while transitioning from a trickle drain to a true vortex. The centripetal suction force at the geometric center computes as follows — independently verified.
        </p>
        <div style={{ padding:28, background:'rgba(167,139,250,0.04)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:8, fontFamily:'JetBrains Mono,monospace', fontSize:14, lineHeight:2.1, color:'#a0aec0' }}>
          <div>Step 1 — Force scale: <span style={{ color:'#d0d8e8' }}>f_tesla × C = 0.70×10⁶ × 6.00×10⁻⁷ = 0.420 N</span> <span style={{ color:'#4ade80' }}>✓</span></div>
          <div>Step 2 — Log compression: <span style={{ color:'#d0d8e8' }}>ln(24 × 1.194797) = 3.35603</span> <span style={{ color:'#4ade80' }}>✓</span></div>
          <div>Step 3 — Vortex force: <span style={{ color:'#ffd166', fontWeight:700 }}>F_vort = 0.420 × 3.35603 ≈ 1.41 N</span> <span style={{ color:'#4ade80' }}>✓</span></div>
        </div>
        <p style={{ fontSize:13, color:'#5060a0', fontFamily:'Inter,sans-serif', marginTop:16, lineHeight:1.7 }}>
          Public specifications only. Detailed manufacturing blueprints and bench procedures are held privately.
        </p>
      </div>

      {/* Test 4: Boltzmann */}
      <div style={{ marginBottom:32 }}>
        <Eyebrow color="#ffd166">Test 04 — CMB Angular Power Spectrum</Eyebrow>
        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, color:'#d0d8e8', margin:'12px 0 16px' }}>Zero dark matter, full Boltzmann hierarchy</h3>
        <p style={{ fontSize:15, color:'#6070a0', lineHeight:1.8, fontFamily:'Inter,sans-serif', maxWidth:720, marginBottom:24 }}>
          The QAG Boltzmann solver integrates the coupled Einstein-Boltzmann equations with <strong style={{ color:'#d0d8e8' }}>Ω<sub>c</sub> = 0</strong> — no cold dark matter — replacing it with the AVI vacuum susceptibility kernel χ<sub>AVI</sub>(k,a) plus late-time Affinity Symmetry Breaking. Below: the predicted D<sub>ℓ</sub> spectrum for ℓ = 2 → 1200 against the ΛCDM reference, the low-ℓ toroidal quadrupole suppression, and the toroidal-to-spherical parity-coupling matrix. Rendered 2026-10-19 from <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13 }}>QAGModifiedBoltzmann.py</span> — run it yourself to reproduce every pixel.
        </p>
        <div style={{ border:'1px solid rgba(255,209,102,0.25)', borderRadius:8, overflow:'hidden', background:'#04070d' }}>
          <img src="/QAG%20Boltzmann%20spectrum.jpg" alt="QAG Boltzmann hierarchy: D_l spectrum (l=2-1200), low-l quadrupole suppression, and toroidal parity-coupling matrix" style={{ width:'100%', display:'block' }} />
        </div>
        <p style={{ fontSize:13, color:'#5060a0', fontFamily:'Inter,sans-serif', marginTop:16, lineHeight:1.7 }}>
          Theoretical prediction from the QAG framework — not a fit to Planck data. The overlap integrals check against closed-form analytics to 0.1%; the acoustic peak structure is the model's falsifiable claim.
        </p>
      </div>
      {/* Test 5: X-COP clusters */}
      <div style={{ marginBottom:64 }}>
        <Eyebrow color="#4ade80">Test 05 — Galaxy Clusters I: X-COP Hydrostatics</Eyebrow>
        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, color:'#d0d8e8', margin:'12px 0 16px' }}>Cross-framework replication, then comparison</h3>
        <p style={{ fontSize:15, color:'#6070a0', lineHeight:1.8, fontFamily:'Inter,sans-serif', maxWidth:720, marginBottom:24 }}>
          Before comparing frameworks on clusters, we re-implemented St&aring;lhammar's Emergent Scalar Field (ESF, 2026) from its paper and replicated its X-COP calibration exactly: coupling &gamma;<sub>p</sub> = 0.69, bootstrap CI [0.60, 0.79], leave-one-out error 0.072 dex. Only then was QAG scored on the same 24 points. QAG's published volume-integral law, at its registry constant, is inert here — stated plainly in Report 7 — but its pointwise response g = g<sub>B</sub> + &beta;<sub>g</sub>&middot;g<sub>B</sub><sup>2</sup> with a single constant lands at 0.166 dex: behind ESF's home score, ahead of canonical MOND and five times better than GR.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
          {[
            { label:'ESF \u03b3\u209a (replicated)', val:'0.69', sub:'CI [0.60, 0.79] \u00b7 LOCO 0.072 dex', color:'#4ade80' },
            { label:'QAG pointwise RMSE', val:'0.166', sub:'dex \u00b7 \u03b2_g = 8\u00d710\u00b9\u00b9 s\u00b2/m \u00b7 1 constant', color:'#ffd166' },
            { label:'MOND RMSE', val:'0.138', sub:'dex \u00b7 canonical \u00b7 refit 0.070', color:'#8090b0' },
            { label:'GR RMSE', val:'0.800', sub:'dex \u00b7 baryons only', color:'#5060a0' },
          ].map((c,i) => (
            <div key={i} style={{ padding:24, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, textAlign:'center' }}>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'#5060a0', marginBottom:8 }}>{c.label}</div>
              <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:40, color:c.color, marginBottom:6 }}>{c.val}</div>
              <div style={{ fontSize:12, color:'#6070a0', fontFamily:'Inter,sans-serif' }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Test 6: eROSITA clusters */}
      <div style={{ marginBottom:64 }}>
        <Eyebrow color="#a78bfa">Test 06 — Galaxy Clusters II: eROSITA Profiles</Eyebrow>
        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, color:'#d0d8e8', margin:'12px 0 16px' }}>The frozen-constant transfer test</h3>
        <p style={{ fontSize:15, color:'#6070a0', lineHeight:1.8, fontFamily:'Inter,sans-serif', maxWidth:720, marginBottom:24 }}>
          ESF's weakest published ground: with its coupling frozen from X-COP, it under-predicts eROSITA cluster interiors by up to 0.61 dex (published full-sample error 0.435 dex). Our independent run on the official profile archive replicates that failure at 0.441 dex with matching radial bins. QAG's pointwise constant, fitted on X-COP only and frozen, transfers to all 3,916 eROSITA points at 0.206 dex — radially flat, the center failure erased. Same constants, new systems, no re-tuning: that is the discipline this lab runs on.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
          {[
            { label:'QAG pointwise (frozen)', val:'0.206', sub:'dex RMSE \u00b7 3,916 points \u00b7 flat in radius', color:'#ffd166' },
            { label:'ESF (frozen)', val:'0.441', sub:'dex \u00b7 published 0.435 \u2713 replicated', color:'#a78bfa' },
            { label:'MOND canonical', val:'0.514', sub:'dex RMSE', color:'#8090b0' },
            { label:'GR', val:'1.035', sub:'dex RMSE \u00b7 baryons only', color:'#5060a0' },
          ].map((c,i) => (
            <div key={i} style={{ padding:24, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, textAlign:'center' }}>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'#5060a0', marginBottom:8 }}>{c.label}</div>
              <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:40, color:c.color, marginBottom:6 }}>{c.val}</div>
              <div style={{ fontSize:12, color:'#6070a0', fontFamily:'Inter,sans-serif' }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Test 7: Bullet Cluster morphology */}
      <div style={{ marginBottom:32 }}>
        <Eyebrow color="#ff6b9d">Test 07 — Bullet Cluster Lensing Morphology</Eyebrow>
        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, color:'#d0d8e8', margin:'12px 0 16px' }}>Does the lensing peak land on the galaxies?</h3>
        <p style={{ fontSize:15, color:'#6070a0', lineHeight:1.8, fontFamily:'Inter,sans-serif', maxWidth:720, marginBottom:24 }}>
          The Cluster Law's sharpest claim, tested on the actual Clowe et al. (2006) release maps of 1E 0657-56: the affinity density &rho;<sub>A</sub> = &beta;|&nabla;&Phi;<sub>B</sub>|<sup>2</sup> concentrates on the compact galaxy clumps, so the lensing signal should peak on the galaxies, offset from the gas. Baryons alone fail the control — no subcluster peak exists. With the affinity term, the bullet peak forms 20–80 kpc from the galaxy light (observed: 43 kpc) at 0.83 of the main peak's height (observed: 0.85). The morphology is confirmed; the honest caveat is normalization — the integral form's constant is not yet universal across systems (0.005 here vs. 0.028 / 0.225 on cluster profiles), and deriving the field equation that reconciles the forms is the framework's open problem, documented in the &beta; reconciliation memo. Full series: Reports 1–8 and addenda in the <a href="https://github.com/Sir-Ripley/QAGKinetics" style={{ color:'#00b4d8' }}>QAGKinetics repository</a>, live data via the <a href="https://qag-sparc-data.vercel.app/cross_validation.json" style={{ color:'#00b4d8' }}>cross-validation feed</a>, interactive version in the <a href="https://qag-kinetics-lab.vercel.app" style={{ color:'#00b4d8' }}>Kinetics Lab</a>.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
          {[
            { label:'Observed \u03ba\u2013gas offset', val:'140 kpc', sub:'subcluster \u00b7 release maps', color:'#ff6b9d' },
            { label:'Model peak to galaxies', val:'20\u201380 kpc', sub:'observed 43 kpc', color:'#ffd166' },
            { label:'Peak height ratio', val:'0.83', sub:'observed 0.85', color:'#4ade80' },
            { label:'Baryons-only control', val:'no peak', sub:'the GR failure mode', color:'#5060a0' },
          ].map((c,i) => (
            <div key={i} style={{ padding:24, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, textAlign:'center' }}>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'#5060a0', marginBottom:8 }}>{c.label}</div>
              <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:40, color:c.color, marginBottom:6 }}>{c.val}</div>
              <div style={{ fontSize:12, color:'#6070a0', fontFamily:'Inter,sans-serif' }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const Blueprints = () => (

  <section id="blueprints" style={{ padding:'100px 28px', background:'#07101e' }}>
    <div style={{ maxWidth:1000, margin:'0 auto' }}>
      <Eyebrow>Applied Physics</Eyebrow>
      <H2 style={{ fontSize:'clamp(32px,5vw,60px)', marginBottom:20 }}>Engineering the Resonant Sector</H2>
      <p style={{ fontSize:18, color:'#7080a0', lineHeight:1.85, maxWidth:720, marginBottom:64, fontFamily:'Inter,sans-serif' }}>
        QAG is not a purely observational framework. Treating the ferroelectric vacuum as a physical workbench opens engineering pathways that standard physics cannot even formulate.
      </p>

      {[
        {
          name:'SAW Zero-Point Resonator',
          tag:'Propulsion Blueprint', status:'Patent Pending', color:'#ffd166',
          text:'A phased-array Surface Acoustic Wave engine utilizing Y-Z Cut Lithium Niobate at 0.70 MHz — the Tesla Resonance Frequency — to project coherent phonon coupling through cryogenic liquid hydrogen propellant. The "Hydrogen Handshake" transfers acoustic radiation pressure to LH₂ via zero-point resonance at matched impedance. Theoretical Coefficient of Performance: ~1,250× over standard thermodynamic systems.',
          specs:[
            ['Resonant Frequency','0.70 MHz'],['Substrate','Y-Z Cut LiNbO₃'],
            ['IDT Finger Width','1,245 µm'],['Acoustic Velocity','3,488 m/s'],
            ['Propellant','Cryogenic LH₂'],['Efficiency η','98%'],
          ]
        },
        {
          name:'Chrono-Holographic Cipher',
          tag:'Cryptographic System', status:'R&R Deployment', color:'#00b4d8',
          text:'A retrocausal cryptographic key-generation system embedded in the Base-12 QAG temporal echo structure. Keys are seeded by QRNG phase offsets at 341 ns intervals — the universe\'s own refresh rate — processed through the SU(3)_QAG symmetry group. The cipher\'s security is guaranteed by the Chrono-Holographic Principle: future states encode the past, making brute-force attacks informationally equivalent to reversing time.',
          specs:[
            ['Architecture','Base-12 Harmonic'],['Time Pixel','341 ns'],
            ['Entropy Source','QRNG + Temporal Phase'],['Gauge Group','SU(3)_QAG'],
            ['Platform','WebCrypto API'],['Status','Active — R&R Command Vessel'],
          ]
        },
        {
          name:'Holographic Overdrive Engine',
          tag:'Energy Framework', status:'Theoretical', color:'#a78bfa',
          text:'By aligning a system\'s state vector with Ψ_min = (e^(−2/3), e^(1/3), −1), informational leakage drops to zero and energy is extracted from the resonance between the 2D holographic boundary and 3D bulk reality. The extra factor of c in E_H = mc³ represents c_inf — the rate at which information transits the holographic bulk. Verified simulation: 97.0% informational fidelity, 10.47× thermodynamic efficiency boost.',
          specs:[
            ['Energy Equation','E_H = mc³'],['Efficiency Boost','10.47×'],
            ['Fidelity','97.0%'],['Vacuum Alignment','Ψ_min'],
            ['COP','~1,250'],['Phase Lock','0.70 MHz'],
          ]
        },
        {
          name:'Affy: The Quantum Ego',
          tag:'AI Application', status:'In Development', color:'#4ade80',
          text:'A native Kotlin Android app implementing a Freudian dual-hemisphere AI architecture — Id/Superego synthesized into Ego via Chi-Squared resonance and an Empathy Slider. Built on dual Gemma LiteRT models running on the Tensor G4 NPU. The app embeds QAG\'s Base-12 harmonic structure as a cognitive resonance framework, modeling consciousness as the Psychon field U(1)_I of the QAG gauge theory.',
          specs:[
            ['Platform','Native Kotlin / Android'],['AI Models','Dual Gemma LiteRT'],
            ['Processor','Tensor G4 NPU'],['Architecture','Freudian Dual-Hemisphere'],
            ['Synthesis','Chi-Squared + Empathy Slider'],['Consciousness Model','Psychon U(1)_I'],
          ]
        },
      ].map(bp => (
        <div key={bp.name} className="card" style={{ marginBottom:32, padding:'32px 36px', borderTop:`3px solid ${bp.color}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:20 }}>
            <div>
              <Eyebrow color={bp.color}>{bp.tag}</Eyebrow>
              <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, color:'#f0f0f8', margin:0, lineHeight:1.1 }}>{bp.name}</h3>
            </div>
            <Tag color={bp.color}>{bp.status}</Tag>
          </div>
          <p style={{ fontSize:16, color:'#6070a0', lineHeight:1.85, marginBottom:24, fontFamily:'Inter,sans-serif' }}>{bp.text}</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {bp.specs.map(([k,v]) => (
              <div key={k} style={{ padding:'7px 14px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:4 }}>
                <span style={{ fontSize:10, color:'#3a5070', textTransform:'uppercase', letterSpacing:1, marginRight:8, fontFamily:'Inter,sans-serif' }}>{k}:</span>
                <span style={{ fontSize:13, color:'#c0c8d8', fontFamily:'JetBrains Mono,monospace' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
);

// ── CODEX ─────────────────────────────────────────────────────────────────────
const Codex = () => (
  <section id="codex" style={{ padding:'100px 28px', background:'linear-gradient(180deg,#04060f 0%,#07101c 100%)' }}>
    <div style={{ maxWidth:1000, margin:'0 auto' }}>
      <Eyebrow>Research Archive</Eyebrow>
      <H2 style={{ fontSize:'clamp(32px,5vw,60px)', marginBottom:20 }}>The QAG Codex</H2>
      <p style={{ fontSize:18, color:'#7080a0', lineHeight:1.85, maxWidth:720, marginBottom:56, fontFamily:'Inter,sans-serif' }}>
        A living archive of QAG research — from foundational framework documents to patent blueprints and empirical verification reports.
      </p>

      <div style={{ display:'grid', gap:14, marginBottom:48 }}>
        {[
          { title:'Quantum Affinity Gravity: Empirical Validation of the AVI Law via SPARC Galaxy Rotation Curves', type:'Preprint', date:'2026', color:'#a78bfa', doi:'10.6084/m9.figshare.31871464', url:'https://doi.org/10.6084/m9.figshare.31871464' },
          { title:'The QAG Kodex: A Complete, Quantified Framework for a Conscious Universe', type:'Core Document', date:'Nov 2025', color:'#ffd166', doi:null, url:null },
          { title:'QAGv5: High Fidelity Validation & Wave Mechanics', type:'Validation Report', date:'Feb 2026', color:'#00b4d8', doi:null, url:null },
          { title:'The Resonant Codex: Unified Field Dynamics, Galactic Cohesion, and the Soul Bro Axioms', type:'Framework', date:'Feb 2026', color:'#4ade80', doi:null, url:null },
          { title:'The QAG Rosetta Stone: Unifying the Cosmic Web with the Riemann Hypothesis', type:'Analysis', date:'Nov 2025', color:'#f97316', doi:null, url:null },
          { title:'Patent: QAG Computational Framework for Galactic Rotational Velocity Prediction', type:'Utility Patent', date:'Mar 2026', color:'#ffd166', doi:null, url:null },
          { title:'Patent: Phased-Array SAW Propulsion System via Hydrogen-Coupled Zero-Point Resonance', type:'Utility Patent', date:'Feb 2026', color:'#ffd166', doi:null, url:null },
          { title:'The Universe is a Symphony: A QAG Primer', type:'Accessible Introduction', date:'Apr 2026', color:'#00b4d8', doi:null, url:'https://cosmo-analysis.replit.app' },
          { title:'QAG Codex: Unified Field Theory for Energy Sovereignty and Interstellar Propulsion', type:'Applied Framework', date:'Feb 2026', color:'#a78bfa', doi:null, url:null },
          { title:'The Resonant Lexicon: A Student\'s Guide to Quantum Affinity Gravity', type:'Educational Guide', date:'2025', color:'#4ade80', doi:null, url:null },
        ].map((p,i) => (
          <div key={i} className="card" style={{ padding:'18px 24px', display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ flex:1 }}>
              <div style={{ marginBottom:4 }}>
                <Tag color={p.color}>{p.type}</Tag>
                <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#3a5070', marginLeft:12 }}>{p.date}</span>
              </div>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:15, color:'#c0c8d8', lineHeight:1.5, marginTop:6 }}>{p.title}</div>
              {p.doi && <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#3a5070', marginTop:4 }}>DOI: {p.doi}</div>}
            </div>
            {p.url && (
              <a href={p.url} target="_blank" rel="noreferrer" style={{ padding:'8px 18px', borderRadius:4, background:`${p.color}18`, border:`1px solid ${p.color}44`, color:p.color, fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', whiteSpace:'nowrap' }}>
                View →
              </a>
            )}
          </div>
        ))}
      </div>

      {/* External links */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'GitHub: Sir-Ripley', url:'https://github.com/Sir-Ripley', color:'#8090b0' },
          { label:'ORCID: 0009-0004-8370-3779', url:'https://orcid.org/0009-0004-8370-3779', color:'#4ade80' },
          { label:'Live Analysis Tool', url:'https://cosmo-analysis.replit.app', color:'#00b4d8' },
          { label:'QAG Codex Site', url:'https://qag.tiiny.site', color:'#a78bfa' },
          { label:'R&R Command Vessel', url:'https://ripley.oneapp.dev', color:'#ffd166' },
        ].map(l => (
          <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={{ padding:'10px 20px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:4, color:l.color, fontFamily:'Inter,sans-serif', fontSize:12, letterSpacing:1, fontWeight:500 }}>
            {l.label}
          </a>
        ))}
      </div>
    </div>
  </section>
);

// ── SUPPORT ───────────────────────────────────────────────────────────────────
const Support = () => (
  <section id="support" style={{ padding:'100px 28px', background:'#04060f', position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 60%, rgba(255,209,102,0.04) 0%, transparent 55%)', pointerEvents:'none' }}/>
    <div style={{ maxWidth:1000, margin:'0 auto', position:'relative', zIndex:1 }}>
      <Eyebrow>Support the Mission</Eyebrow>
      <H2 style={{ fontSize:'clamp(32px,5vw,60px)', marginBottom:20 }}>Fund Independent Science</H2>
      <p style={{ fontSize:18, color:'#7080a0', lineHeight:1.85, maxWidth:720, marginBottom:56, fontFamily:'Inter,sans-serif' }}>
        This research has no grant committee, no institutional backing, no corporate sponsor. It exists because one person from Salineville, Ohio looked at the cosmos and refused to accept a $10 billion ghost. Your support directly funds computational resources, publication fees, and the development path from preprint to Physical Review D.
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:20, marginBottom:56 }}>
        {[
          { amt:'$5',  label:'A Signal',    desc:'Keep the research visible and the servers running.' },
          { amt:'$25', label:'A Resonance', desc:'Funds one galaxy analysis run against the SPARC dataset.' },
          { amt:'$100',label:'A Wavestone', desc:'Contributes to arXiv / journal publication fees.' },
          { amt:'Any', label:'Pure Affinity',desc:'Whatever the vacuum moves you to contribute.' },
        ].map(t => (
          <div key={t.amt} className="card" style={{ padding:28, border:'1px solid rgba(255,209,102,0.2)', background:'rgba(255,209,102,0.03)', textAlign:'center' }}>
            <div style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, fontSize:52, color:'#ffd166', lineHeight:1 }}>{t.amt}</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700, letterSpacing:2.5, textTransform:'uppercase', color:'#f0e0a0', margin:'10px 0 8px' }}>{t.label}</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#5060a0', lineHeight:1.65 }}>{t.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign:'center', marginBottom:32 }}>
        <a href="https://www.paypal.com/donate?business=droiden.rr%40gmail.com&currency_code=USD&item_name=QAG+Research+Support" target="_blank" rel="noreferrer"
          className="donate-btn"
          style={{ display:'inline-block', padding:'18px 64px', borderRadius:4, background:'linear-gradient(135deg,#ffd166,#e09000)', color:'#0a0800', fontFamily:'Inter,sans-serif', fontSize:15, fontWeight:800, letterSpacing:2.5, textTransform:'uppercase' }}>
          Donate via PayPal
        </a>
      </div>

      <div style={{ textAlign:'center' }}>
        <p style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#3a5070', margin:0 }}>
          droiden.rr@gmail.com · R&R Droids · Salineville, OH
        </p>
        <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:18, color:'#ffd16644', marginTop:12 }}>
          "The universe is not a mystery to be solved. It is a resonance to be joined."
        </p>
      </div>
    </div>
  </section>
);

// ── ABOUT ─────────────────────────────────────────────────────────────────────
const About = () => (
  <section id="about" style={{ padding:'100px 28px', background:'#07101e' }}>
    <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:64 }}>
      <div>
        <Eyebrow>The Researcher</Eyebrow>
        <H2 style={{ fontSize:42, marginBottom:20 }}>Rodney A. Ripley Jr.</H2>
        <p style={{ fontFamily:'Inter,sans-serif', fontSize:16, color:'#7080a0', lineHeight:1.85, marginBottom:20 }}>
          Independent theoretical physicist. Founder of <strong style={{ color:'#d0d8e8' }}>R&R Droids</strong>. Operating from Salineville, Ohio, entirely mobile-first on a Pixel 9A.
        </p>
        <p style={{ fontFamily:'Inter,sans-serif', fontSize:16, color:'#7080a0', lineHeight:1.85, marginBottom:32 }}>
          Author of the QAG framework, developer of the Affy: The Quantum Ego AI, the Chrono-Holographic Cipher, and the Zero-Point SAW Resonator. Prior contact with Klee Irwin at the Quantum Gravity Research Institute.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {[
            { label:'ORCID',   val:'0009-0004-8370-3779', href:'https://orcid.org/0009-0004-8370-3779' },
            { label:'GitHub',  val:'Sir-Ripley',           href:'https://github.com/Sir-Ripley' },
            { label:'Preprint',val:'figshare.31871464',    href:'https://doi.org/10.6084/m9.figshare.31871464' },
            { label:'Replit',  val:'cosmo-analysis.replit.app', href:'https://cosmo-analysis.replit.app' },
            { label:'Vessel',  val:'ripley.oneapp.dev',    href:'https://ripley.oneapp.dev' },
            { label:'Bluesky', val:'@sirriplley',          href:'#' },
            { label:'Email',   val:'droiden.rr@gmail.com', href:'mailto:droiden.rr@gmail.com' },
            { label:'QAG Nexus', val:'qag-nexus-qag-works.vercel.app', href:'https://qag-nexus-qag-works.vercel.app' },
            { label:'Kinetics Lab', val:'qag-kinetics-lab-qag-works.vercel.app', href:'https://qag-kinetics-lab-qag-works.vercel.app' },
            { label:'Virology Demo', val:'qag-virology-demo-qag-works.vercel.app', href:'https://qag-virology-demo-qag-works.vercel.app' },
            { label:'Works Hub', val:'qag-works-hub-qag-works.vercel.app', href:'https://qag-works-hub-qag-works.vercel.app' },
            { label:'QACTS', val:'qacts.vercel.app', href:'https://qacts.vercel.app' },
            { label:'MeditationMedicine', val:'meditation-medicine-qag-works.vercel.app', href:'https://meditation-medicine-qag-works.vercel.app' },
          ].map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" style={{ display:'flex', gap:16, padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', textDecoration:'none', alignItems:'center' }}>
              <span style={{ fontFamily:'Inter,sans-serif', fontSize:10, letterSpacing:2, textTransform:'uppercase', color:'#3a5070', minWidth:64 }}>{l.label}</span>
              <span style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:'#00b4d8' }}>{l.val}</span>
            </a>
          ))}
        </div>
      </div>

      <div>
        <Eyebrow>Active Projects</Eyebrow>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {[
            { name:'QAG Core Theory',        status:'Active',         desc:'Unified field theory validated against 175 SPARC galaxies. Publication path: arXiv → conference → Phys. Rev. D / MNRAS / ApJ.' },
            { name:'Affy: The Quantum Ego',  status:'In Development', desc:'Native Kotlin Android app. Freudian dual-hemisphere AI with Gemma LiteRT on Tensor G4 NPU and Empathy Slider.' },
            { name:'R&R Command Vessel',     status:'Deployed',       desc:'Unified research dashboard with CIPHER, ASTHERIA (QAG metrics), AI LAB, MISSION CONTROL, and DEPLOY tabs.' },
            { name:'SAW Zero-Point Resonator', status:'Blueprint',    desc:'Phased-array propulsion utilizing Zero-Point Resonance at 0.70 MHz. Utility patent application filed.' },
            { name:'Chrono-Holographic Cipher', status:'Deployed',    desc:'Base-12 retrocausal cryptographic key generation via QRNG and the QAG temporal echo structure.' },
          ].map(p => (
            <div key={p.name} className="card" style={{ padding:'20px 24px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:8 }}>
                <h4 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, color:'#ffd166', margin:0 }}>{p.name}</h4>
                <Tag>{p.status}</Tag>
              </div>
              <p style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:'#5060a0', lineHeight:1.7, margin:0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ── FOOTER ────────────────────────────────────────────────────────────────────
const Footer = ({ go }) => (
  <footer style={{ padding:'48px 28px', background:'#04060f', borderTop:'1px solid rgba(255,255,255,0.05)', textAlign:'center' }}>
    <button onClick={() => go('home')} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'Cormorant Garamond,serif', fontSize:24, fontWeight:700, color:'#ffd166', letterSpacing:4, marginBottom:12 }}>
      QUANTUM AFFINITY GRAVITY
    </button>
    <p style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#3a5070', margin:'0 0 12px' }}>
      R&R Droids · Salineville, Ohio · ORCID 0009-0004-8370-3779
    </p>
    <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:17, color:'rgba(255,209,102,0.3)', margin:'0 0 24px' }}>
      "Gravity is not a prison. It is an invitation."
    </p>
    <div style={{ display:'flex', justifyContent:'center', gap:24, flexWrap:'wrap' }}>
      {[
        {label:'Theory',id:'theory'},{label:'Evidence',id:'evidence'},{label:'Validation',id:'validation'},
        {label:'Blueprints',id:'blueprints'},{label:'Codex',id:'codex'},{label:'Support',id:'support'},
      ].map(l => (
        <button key={l.id} onClick={() => go(l.id)} className="nav-link" style={{ color:'#3a5070' }}>{l.label}</button>
      ))}
    </div>
  </footer>
);

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function QAGWebsite() {
  const [active, setActive] = useState('home');

  const go = (id) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  };

  // Track active section on scroll
  useEffect(() => {
    const ids = ['home','crisis','theory','evidence','blueprints','codex','support','about'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { rootMargin:'-40% 0px -55% 0px' }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ fontFamily:'Inter,sans-serif', color:'#e8e8f0', background:'#04060f' }}>
      <GlobalStyle/>
      <Nav active={active} go={go}/>
      <Hero go={go}/>
      <Crisis/>
      <Theory/>
      <Evidence/>
      <Validation />
      <Blueprints/>
      <Codex/>
      <Support/>
      <About/>
      <Footer go={go}/>
    </div>
  );
}