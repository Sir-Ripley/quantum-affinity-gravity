import { useState, useEffect, useMemo } from "react";

// ── Deterministic pseudo-random (no render flicker) ──────────────────────────
const sr = (seed) => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

// ── CSS / Fonts ───────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; overflow-x: hidden; }
    body { margin: 0; background: #05070f; overflow-x: hidden; }
    img, svg, video, canvas { max-width: 100%; }
    a { text-decoration: none; overflow-wrap: break-word; }
    @keyframes twinkle {
      0%,100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.2; transform: scale(0.6); }
    }
    @keyframes spiral-drift {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes glow-breathe {
      0%,100% { box-shadow: 0 0 80px rgba(56,225,255,0.12); }
      50%      { box-shadow: 0 0 140px rgba(56,225,255,0.28); }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-up { animation: fadeUp 0.9s ease forwards; }
    .fade-up-d1 { animation: fadeUp 0.9s 0.15s ease both; }
    .fade-up-d2 { animation: fadeUp 0.9s 0.3s ease both; }
    .eq-block {
      background: rgba(56,225,255,0.05);
      border: 1px solid rgba(56,225,255,0.22);
      border-left: 3px solid #38e1ff;
      border-radius: 6px;
      padding: 20px 28px;
      margin: 24px 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 16px;
      color: #38e1ff;
      text-align: center;
      line-height: 2;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .eq-note {
      font-family: Inter, sans-serif;
      font-size: 12px;
      color: #8b96b3;
      text-align: center;
      margin-top: 8px;
      letter-spacing: 0.5px;
      line-height: 1.7;
    }
    .card {
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
    }
    .nav-link {
      background: none; border: none; cursor: pointer;
      font-family: Inter, sans-serif; font-size: 11px;
      font-weight: 500; letter-spacing: 1.5px;
      text-transform: uppercase; transition: color 0.2s;
      padding: 4px 0;
    }
    .reg-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .reg-table th {
      text-align: left; font-family: Inter, sans-serif; font-size: 10.5px;
      letter-spacing: 2px; text-transform: uppercase; color: #8b96b3;
      padding: 10px 14px; border-bottom: 1px solid rgba(56,225,255,0.25);
    }
    .reg-table td {
      padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.05);
      color: #c6d2e2; vertical-align: top; line-height: 1.55;
    }
    .reg-table td.sym { font-family: 'JetBrains Mono', monospace; color: #38e1ff; white-space: nowrap; }
    .reg-table td.val { font-family: 'JetBrains Mono', monospace; color: #dbe4ff; white-space: nowrap; }
    .prog-card { transition: border-color 0.25s, transform 0.25s; }
    .prog-card:hover { border-color: rgba(56,225,255,0.45) !important; transform: translateY(-3px); }
    @media (max-width: 680px) {
      .hide-mobile { display: none !important; }
      .hero-h1 { font-size: 40px !important; }
      .eq-block { font-size: 13px; padding: 16px 14px; line-height: 1.8; }
      .reg-table td.val, .reg-table td.sym { white-space: normal; }
      .reg-table { display: block; overflow-x: auto; }
    }
  `}</style>
);

// ── Shared atoms ──────────────────────────────────────────────────────────────
const Eyebrow = ({ children, color = '#38e1ff' }) => (
  <p style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700, letterSpacing:4, textTransform:'uppercase', color, marginBottom:16, marginTop:0 }}>
    {children}
  </p>
);
const H2 = ({ children, style }) => (
  <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontWeight:700, background:'linear-gradient(92deg,#38e1ff,#00E676)', WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent', lineHeight:1.1, fontSize:'clamp(32px,4.5vw,46px)', margin:'0 0 20px', ...style }}>{children}</h2>
);
const Eq = ({ children, note }) => (
  <div>
    <div className="eq-block">{children}</div>
    {note && <p className="eq-note">{note}</p>}
  </div>
);
const Tag = ({ children, color='#38e1ff' }) => (
  <span style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color, padding:'3px 10px', border:`1px solid ${color}44`, borderRadius:20, background:`${color}11`, whiteSpace:'nowrap' }}>
    {children}
  </span>
);
const P = ({ children, style }) => (
  <p style={{ fontFamily:'Inter,sans-serif', fontSize:15.5, lineHeight:1.85, color:'#c6d2e2', margin:'0 0 18px', ...style }}>{children}</p>
);
const Strong = ({ children }) => <strong style={{ color:'#dbe4ff' }}>{children}</strong>;
const Stat = ({ value, label, sub }) => (
  <div className="card" style={{ padding:'26px 22px', textAlign:'center' }}>
    <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:40, fontWeight:700, color:'#38e1ff', lineHeight:1 }}>{value}</div>
    <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:600, letterSpacing:2, textTransform:'uppercase', color:'#38e1ff', marginTop:10 }}>{label}</div>
    {sub && <div style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:'#8b96b3', marginTop:6, lineHeight:1.6 }}>{sub}</div>}
  </div>
);
const Section = ({ id, children, bg }) => (
  <section id={id} style={{ padding:'100px 28px', background: bg || '#0a1226' }}>
    <div style={{ maxWidth:1100, margin:'0 auto' }}>{children}</div>
  </section>
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
          <stop offset="0%" stopColor="#38e1ff" stopOpacity="0.9"/>
          <stop offset="35%" stopColor="#38e1ff" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#05070f" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="0" cy="0" r="32" fill="url(#core)">
        <animate attributeName="r" values="28;36;28" dur="6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.35;0.65;0.35" dur="6s" repeatCount="indefinite"/>
      </circle>
      {arms.map((off,i) => (
        <polyline key={i} points={pts(off)} fill="none" stroke="#38e1ff" strokeWidth="1.2" strokeOpacity="0.55" strokeLinecap="round"/>
      ))}
      {dots.map((d,i) => (
        <circle key={i} cx={d.x.toFixed(2)} cy={d.y.toFixed(2)} r={d.r} fill="#38e1ff" opacity={0.4+sr(i*23)*0.5}/>
      ))}
    </svg>
  );
};

// ── Navigation ────────────────────────────────────────────────────────────────
const NAVLINKS = [
  {id:'theory',label:'Theory'},
  {id:'cosmology',label:'Cosmology'},
  {id:'validation',label:'Validation'},
  {id:'clusters',label:'Clusters'},
  {id:'engineering',label:'Engineering'},
  {id:'programs',label:'Programs'},
  {id:'publications',label:'Publications'},
  {id:'about',label:'About'},
];
// ── Site pages (static pages + fleet subdomains) ──────────────────────────
const SITELINKS = [
  {label:'About Us', href:'/about/', desc:'R&R Droids and the QAG programme'},
  {label:'Site Map', href:'/sitemap/', desc:'Every page and service, with descriptions'},
  {label:'Tools', href:'/tools/', desc:'All utilities in one place'},
  {label:'Research Archive', href:'https://docs.quantumaffinitygravity.com/', desc:'Preprint, documents, notebooks, validation'},
  {label:'Data API', href:'https://api.quantumaffinitygravity.com/', desc:'One front door for all the data APIs'},
  {label:'Fleet Status', href:'https://status.quantumaffinitygravity.com/', desc:'Live health of every service'},
  {label:'Terms of Service', href:'/terms/', desc:'How the sites may be used'},
  {label:'Privacy Policy', href:'/privacy/', desc:'What we collect (almost nothing)'},
];
const Nav = ({ active, go }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:200,
      background: scrolled ? 'rgba(4,6,15,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(56,225,255,0.18)' : 'none',
      transition:'all 0.3s ease', padding:'0 28px',
    }}>
      <div style={{ maxWidth:1180, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:62 }}>
        <button onClick={() => go('home')} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'Cormorant Garamond,serif', fontSize:22, fontWeight:700, backgroundImage:'linear-gradient(92deg,#38e1ff,#00E676)', WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent', letterSpacing:3 }}>
          QAG
        </button>
        <div className="hide-mobile" style={{ display:'flex', gap:24, alignItems:'center' }}>
          {NAVLINKS.map(l => (
            <button key={l.id} onClick={() => go(l.id)} className="nav-link" style={{ color: active===l.id ? '#38e1ff' : '#8b96b3' }}>
              {l.label}
            </button>
          ))}
          <div style={{ position:'relative' }}>
            <button onClick={() => setDrop(!drop)} className="nav-link" style={{ color: drop ? '#38e1ff' : '#8b96b3' }}>
              Site {drop ? '▴' : '▾'}
            </button>
            {drop && (
              <div style={{ position:'absolute', top:'calc(100% + 14px)', right:0, minWidth:300, background:'rgba(4,6,15,0.98)', border:'1px solid rgba(56,225,255,0.25)', borderRadius:12, padding:'10px 0', boxShadow:'0 18px 40px rgba(0,0,0,0.55)', zIndex:300 }}>
                {SITELINKS.map(s => (
                  <a key={s.href} href={s.href} onClick={() => setDrop(false)} style={{ display:'block', padding:'9px 18px', textDecoration:'none', color:'#c6d2e2' }}>
                    <span style={{ display:'block', fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:600, color:'#e9f4f8' }}>{s.label}</span>
                    <span style={{ display:'block', fontFamily:'Inter,sans-serif', fontSize:12, color:'#8b96b3' }}>{s.desc}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <button onClick={() => setOpen(!open)} style={{ background:'none', border:'none', cursor:'pointer', color:'#8b96b3', fontSize:22 }} className="nav-link">
          {open ? '✕' : '☰'}
        </button>
      </div>
      {open && (
        <div style={{ background:'rgba(4,6,15,0.98)', borderTop:'1px solid rgba(56,225,255,0.15)', padding:'20px 28px', display:'flex', flexDirection:'column', gap:16 }}>
          {NAVLINKS.map(l => (
            <button key={l.id} onClick={() => { go(l.id); setOpen(false); }} className="nav-link" style={{ color:'#8b96b3', textAlign:'left' }}>
              {l.label}
            </button>
          ))}
          <div style={{ borderTop:'1px solid rgba(56,225,255,0.15)', paddingTop:14, fontFamily:'Inter,sans-serif', fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'#8b96b3' }}>Site</div>
          {SITELINKS.map(s => (
            <a key={s.href} href={s.href} onClick={() => setOpen(false)} style={{ textDecoration:'none', color:'#8b96b3', fontFamily:'Inter,sans-serif', fontSize:15 }}>
              {s.label} <span style={{ color:'#8b96b3', fontSize:12 }}>— {s.desc}</span>
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

// ── HERO ──────────────────────────────────────────────────────────────────────
const Hero = ({ go }) => (
  <section id="home" style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', background:'#05070f' }}>
    <Stars n={220}/>
    <div style={{ position:'absolute', width:'82vmin', height:'82vmin', top:'50%', left:'50%', transform:'translate(-50%,-50%)', animationName:'spiral-drift', animationDuration:'130s', animationTimingFunction:'linear', animationIterationCount:'infinite', pointerEvents:'none' }}>
      <Galaxy/>
    </div>
    <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(56,225,255,0.1) 0%, transparent 65%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', animationName:'glow-breathe', animationDuration:'8s', animationIterationCount:'infinite' }}/>
    <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'0 24px', maxWidth:980 }}>
      <Eyebrow>R&R Droids · Salineville, Ohio · ORCID 0009-0004-8370-3779</Eyebrow>
      <h1 className="hero-h1 fade-up" style={{
        fontFamily:'Cormorant Garamond,serif', fontWeight:700,
        fontSize:'clamp(40px,8.5vw,104px)', lineHeight:1.0,
        color:'#dbe4ff', margin:'0 0 32px',
        textShadow:'0 0 100px rgba(56,225,255,0.2)',
      }}>
        The Universe<br/>
        <em style={{ background:'linear-gradient(92deg,#38e1ff,#00E676)', WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent', fontStyle:'italic' }}>is Not a Machine.</em><br/>
        It is a Song.
      </h1>
      <p className="fade-up-d1" style={{ fontSize:'clamp(16px,2.2vw,20px)', color:'#8b96b3', maxWidth:680, margin:'0 auto 40px', lineHeight:1.8, fontFamily:'Inter,sans-serif' }}>
        Quantum Affinity Gravity proposes that the phenomena attributed to dark matter and dark energy arise from a single principle — gravity as the universe's drive toward coherence. Tested head-to-head on 175 SPARC galaxies, stress-tested in an open replication lab, and published here with its failures labeled as plainly as its wins.
      </p>
      <div className="fade-up-d2" style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', marginBottom:54 }}>
        <button onClick={() => go('validation')} style={{
          padding:'14px 40px', borderRadius:3,
          background:'linear-gradient(135deg,#38e1ff,#00E676)',
          color:'#04121a', border:'none', cursor:'pointer',
          fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase',
        }}>See the Evidence</button>
        <button onClick={() => go('cosmology')} style={{
          padding:'14px 40px', borderRadius:3,
          background:'transparent',
          color:'#38e1ff', border:'1px solid rgba(56,225,255,0.4)', cursor:'pointer',
          fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase',
        }}>Cosmology</button>
      </div>
      <div className="fade-up-d2" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, maxWidth:820, margin:'0 auto' }}>
        <Stat value="5.55" label="QAG χ² (reduced)" sub="175 SPARC galaxies · median 1.42"/>
        <Stat value="56.55" label="MOND χ²" sub="same data, same errors"/>
        <Stat value="616.74" label="Newton χ²" sub="baryons only"/>
        <Stat value="169 / 175" label="Galaxies won vs MOND" sub="head-to-head, raw χ²"/>
      </div>
    </div>
    <div style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', color:'#8b96b3', fontSize:11, letterSpacing:4, textTransform:'uppercase', fontFamily:'Inter,sans-serif' }}>
      scroll ↓
    </div>
  </section>
);

// ── CRISIS ────────────────────────────────────────────────────────────────────
const Crisis = () => (
  <Section id="crisis" bg="linear-gradient(180deg,#05070f 0%,#07101c 100%)">
    <Eyebrow color="#ff7b72">The Crisis in Physics</Eyebrow>
    <H2>Ninety-five percent of the universe is missing.</H2>
    <P>
      Modern cosmology balances its books with two invisible ingredients: <Strong>dark matter</Strong>, invoked because galaxies rotate as if they held five times more mass than they show, and <Strong>dark energy</Strong>, invoked because the expansion of space is accelerating. Neither has ever been directly detected, despite four decades of increasingly sensitive searches.
    </P>
    <P>
      QAG asks a different question. What if the discrepancy is not missing mass, but a missing <Strong>interaction</Strong> — a vacuum response that strengthens gravity where baryonic gravity alone falls short, and switches off where it does not? That response, written as one saturating term, is the AVI Law. Everything on this page — the wins and the open failures — follows from testing that single idea against real data.
    </P>
  </Section>
);

// ── THEORY ────────────────────────────────────────────────────────────────────
const REGISTRY = [
  ['v(r) — AVI Law', 'v(r) = sqrt( Υ*·v*² + v_gas² + v∞²·(1 − e^(−r/r_aff)) )', 'Fitting law · 2 free params/galaxy'],
  ['a₀', '1.21 × 10⁻¹⁰ m/s² (SPARC fits)', 'Derived conditional — see Cosmology'],
  ['K_ASB', '0.013829', 'Defined: fractional vacuum splitting'],
  ['Φ', '1218 / 1019.42 = 1.194797', 'Settled ratio (notebook original)'],
  ['ν_vac', '16.440266 MHz', 'Exact from Φ'],
  ['μ · m_Affiniton', '10 GeV · 14.14 GeV', 'Canonical mass scale'],
  ['τ_lat', '3.41 × 10⁻⁷ s', 'Chrono-holographic latency (S1-era name: t_pixel)'],
  ['Δτ', '6.58 × 10⁻²⁶ s', 'Vacuum granularity scale'],
  ['R_Li', 'K_ASB^(−1/4) ≈ 2.92 (Route A)', 'Derived — see Cosmology'],
  ['β_g', '8 × 10¹¹ s²/m', 'Interim-empirical, cluster window only'],
  ['σ₈', '0.852 (F = 3.76 adopted)', 'Canonical in the publication volume'],
  ['M_ref (echoes)', '2.74 M☉', 'Echo-delay anchor'],
  ['R (echo reflectivity)', '0.40', 'Main lineage'],
];
const Theory = () => (
  <Section id="theory">
    <Eyebrow>The Framework</Eyebrow>
    <H2>One law for galactic gravity.</H2>
    <P>
      The <Strong>AVI Law</Strong> (Affinity–Vacuum Interaction) adds a single saturating affinity term to the baryonic rotation curve. Two fitted parameters per galaxy — the asymptotic affinity velocity <Strong>v∞</Strong> and the affinity radius <Strong>r_aff</Strong> — with the stellar mass-to-light ratio Υ* fixed at the canonical 0.5. No dark halos, no per-galaxy dark profiles.
    </P>
    <Eq note="v* and v_gas are the measured stellar and gas rotation components from SPARC. The affinity term saturates: it is negligible in the inner galaxy and supplies the flat outer curve.">
      v(r) = sqrt( Υ*·v*² + v_gas² + v∞² · (1 − e^(−r / r_aff)) )
    </Eq>
    <P>
      Around the law sits a wider framework: an affinity field with a vacuum coherence floor (the source of the acceleration scale a₀), gravitational-wave echoes from horizon-scale reflectivity, and a chrono-holographic lattice whose latency τ_lat sets a refresh scale for the vacuum. Each piece is labeled below at its true status — <Strong>defined, derived, derived conditional, interim-empirical, or posed</Strong> — because a framework that hides its own epistemic seams cannot be trusted at its strong points either.
    </P>
    <Eq note="The echo sum: each reflection re-emits the ringdown after Δt_echo. Echo timing is anchored at M_ref = 2.74 M☉ in the current registry.">
      Ψ_QAG(t) = Ψ_GR(t) + Σₙ Rⁿ · Ψ_GR(t − n·Δt_echo)
    </Eq>
    <div style={{ marginTop:36 }}>
      <Eyebrow color="#38e1ff">Parameter Registry — canonical values, November 2026</Eyebrow>
      <div style={{ overflowX:'auto' }}>
        <table className="reg-table">
          <thead>
            <tr><th>Quantity</th><th>Canonical value</th><th>Status</th></tr>
          </thead>
          <tbody>
            {REGISTRY.map((r,i) => (
              <tr key={i}><td className="sym">{r[0]}</td><td className="val">{r[1]}</td><td>{r[2]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="eq-note" style={{ textAlign:'left' }}>
        Retired values are deliberately absent: the old β = 3.14 × 10⁻¹⁹ (split into β_g above; β_ρ withdrawn), the 9.05 GeV mass reading, and the 1.03 × 10⁻²⁵ s granularity figure were superseded during the 2026 canonicalisation programme and are kept out of all current text.
      </p>
    </div>
  </Section>
);

// ── COSMOLOGY ─────────────────────────────────────────────────────────────────
const Cosmology = () => (
  <Section id="cosmology" bg="linear-gradient(180deg,#060d18 0%,#05070f 100%)">
    <Eyebrow>Cosmology</Eyebrow>
    <H2>The acceleration scale, the lithium problem, and the growth of structure.</H2>
    <P>
      Galactic fits fix a₀ empirically. Cosmology asks whether the framework can <Strong>produce</Strong> it. In the current volume, a₀ is <Strong>derived conditional</Strong> on one named, falsifiable postulate — the Coherence-Floor Lemma — and the site states the condition rather than laundering it into a claim:
    </P>
    <Eq note="Factor 2: Mellin–Plancherel marginality at σ_c = 1/2. Factor e: the Chapter 1 invariant. The lemma is new, stated as a postulate in the volume, and carries its own falsifiers (below).">
      a₀ = c·H₀ / (2e) = 1.20472 × 10⁻¹⁰ m/s² — within 0.44% of the SPARC value
    </Eq>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, margin:'30px 0' }}>
      <div className="card" style={{ padding:'24px 22px' }}>
        <Tag color="#38e1ff">Falsifiable</Tag>
        <P style={{ marginTop:14, marginBottom:0, fontSize:14.5 }}>
          <Strong>The H₀ discriminator.</Strong> With Planck's H₀ the lemma lands −0.46% from the SPARC a₀; with the SH0ES value (73) it overshoots by +7.82%. And it predicts a₀ evolves as c·H(z)/(2e), where MOND holds a₀ constant. Either measurement, settled, can kill the lemma.
        </P>
      </div>
      <div className="card" style={{ padding:'24px 22px' }}>
        <Tag color="#38e1ff">Derived</Tag>
        <P style={{ marginTop:14, marginBottom:0, fontSize:14.5 }}>
          <Strong>Lithium.</Strong> The BBN lithium discrepancy is addressed through the ⁷Be(d,p)2⁴He channel with cross-section scaled by ℰ = K_ASB^(−1/2), giving R_Li = K_ASB^(−1/4) ≈ 2.92 — now a derivation, not a fit. Residual: the full-network check of the ρ = ½ input is still unrun, and is labeled as such in the volume.
        </P>
      </div>
      <div className="card" style={{ padding:'24px 22px' }}>
        <Tag color="#c792ea">Adopted</Tag>
        <P style={{ marginTop:14, marginBottom:0, fontSize:14.5 }}>
          <Strong>Structure growth.</Strong> The computed growth factor F = 3.76 is adopted, giving σ₈ = 0.852 — stated in print as sitting just above the cited local-survey band (0.83–0.85), not inside it. The dark-energy equation-of-state slope w_a is <Strong>posed</Strong>, upgraded from asserted, with its background solution still open.
        </P>
      </div>
    </div>
    <P>
      The cosmological sector is also where the framework's treatment is most conservative: the Boltzmann/CMB analysis in the volume is a modified-gravity consistency treatment, not a precision cosmology pipeline, and cluster-scale validation remains <Strong>predictive</Strong> — see the Clusters section for exactly what has and has not been measured there.
    </P>
  </Section>
);

// ── VALIDATION ────────────────────────────────────────────────────────────────
const Validation = () => (
  <Section id="validation" bg="#060c16">
    <Eyebrow>Validation — SPARC v3.0</Eyebrow>
    <H2>175 galaxies. Identical data. No place to hide.</H2>
    <P>
      The AVI Law was applied to the entire SPARC database — <Strong>175 measured galaxy rotation curves, 3,391 data points</Strong> — and fitted head-to-head against MOND and Newtonian baryons-only on identical data with identical errors. (Win counts below use raw per-galaxy χ², the convention the publication volume prints; on reduced χ² the counts are 167 of 170 vs MOND and 170 of 175 vs Newton.)
    </P>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, margin:'28px 0' }}>
      <Stat value="5.549" label="QAG reduced χ²" sub="median galaxy: 1.42"/>
      <Stat value="56.554" label="MOND reduced χ²"/>
      <Stat value="616.742" label="Newton reduced χ²"/>
      <Stat value="172,054" label="ΔBIC in QAG's favour" sub="vs the next-best model"/>
    </div>
    <P>
      Two honest caveats belong next to those numbers. First, no model reaches χ² ≈ 1 on SPARC's published errors — the uncertainties exclude distance and inclination systematics, which our Monte Carlo work (below) shows move all models together without changing their ordering. Second, beating MOND on <Strong>total</Strong> χ² is not the whole story:
    </P>
    <div className="card" style={{ padding:'28px 26px', borderColor:'rgba(56,225,255,0.3)', marginTop:10 }}>
      <Eyebrow color="#38e1ff">From the Replication Lab — the open problem, stated plainly</Eyebrow>
      <P style={{ fontSize:14.5 }}>
        An independent in-house replication programme re-derived every headline figure from the raw SPARC release (Phase 0: exact reproduction, byte-for-byte). It then asked the harder questions:
      </P>
      <P style={{ fontSize:14.5, marginBottom:10 }}>
        • <Strong>Equal-freedom test:</Strong> against a 2-parameter NFW halo given the same fitting freedom, QAG still wins total χ² (16,875 vs 17,897) — but <Strong>NFW wins the median galaxy</Strong> (1.331 vs 1.424).
      </P>
      <P style={{ fontSize:14.5, marginBottom:10 }}>
        • <Strong>Held-out fitting:</Strong> passes. Fit on half a galaxy's points, QAG predicts the other half as well as it fits (test 5.595 vs train 5.539).
      </P>
      <P style={{ fontSize:14.5, marginBottom:10 }}>
        • <Strong>Zero-parameter blind test: QAG fails.</Strong> Asked to predict (v∞, r_aff) from baryons alone — no fitting at all — QAG scores χ² 63.08 and beats MOND in only 26.8% of resamples. The two parameters are essentially <Strong>unpredictable from baryonic properties</Strong> (R² = 0.04–0.17). A 73-system derivation hunt found a genuine zero-constant candidate for v∞ (the a₀–BTFR identity) and <Strong>nothing</Strong> that predicts r_aff. Verdict: <Strong>PARTIAL</Strong>.
      </P>
      <P style={{ fontSize:14.5, marginBottom:0 }}>
        So the accurate one-line summary is: <Strong>as a two-parameter fitting law, AVI leads its class; as a predictive theory, the derivation of its two parameters from first principles is the open problem</Strong> — and it is now the programme's central next test. The full lab report, including every failed system, is part of the research record.
      </P>
    </div>
  </Section>
);

// ── CLUSTERS ──────────────────────────────────────────────────────────────────
const Clusters = () => (
  <Section id="clusters" bg="linear-gradient(180deg,#05070f 0%,#07101c 100%)">
    <Eyebrow>Clusters & Lensing</Eyebrow>
    <H2>Where the framework is tested hardest — and says so.</H2>
    <P>
      The <Strong>Stålhammar cross-framework validation series</Strong> (Reports 1–8, complete) subjected the cluster sector to the same treatment as the galaxies, comparing QAG's affinity-density term ρ_A = β·|∇Φ|² against lensing morphology in merging clusters. Its conclusions are deliberately two-edged: with baryons alone, <Strong>no</Strong> offset subcluster peak forms; with the affinity term, a peak forms for any β_ρ ≥ 0.003 — the morphology mechanism works, but <Strong>β universality is refuted</Strong>: no single β value serves all systems, which is why β_g is carried as interim-empirical and window-scoped in the registry.
    </P>
    <P>
      For <Strong>Abell 520</Strong> (the "Train Wreck"), we measured the gas side directly from the public Chandra archive — five observations, a 513.7 ks stack, 550,114 counts. The result refined the anomaly itself: the famous "dark core" offset is <Strong>resolution-dependent</Strong> (the fine-scale gas peak sits 94 kpc from the Mahdavi et al. position; at lensing smoothing, 16–17 kpc), and A520's anomaly is fundamentally <Strong>mass-to-light</Strong> (M/L_B ≈ 588–721), not a Bullet-style mass–gas displacement. No public convergence map or shape catalogue exists for the mass side — that gap is stated, not papered over: closing it needs either an author data release or a full HST reprocessing.
    </P>
    <P style={{ marginBottom:0 }}>
      Until then, cluster-scale QAG validation remains <Strong>predictive</Strong>, and the portal will keep saying so in those words.
    </P>
  </Section>
);

// ── ENGINEERING ───────────────────────────────────────────────────────────────
const Engineering = () => (
  <Section id="engineering" bg="#0a1226">
    <Eyebrow>Resonant Engineering</Eyebrow>
    <H2>The 0.70 MHz SAW device.</H2>
    <P>
      The framework's engineering arm is a surface-acoustic-wave device on lithium niobate, designed around the 0.70 MHz resonance. Its fabrication geometry is not a rendering — it is generated by a verified DXF blueprint tool and checked dimension-by-dimension: <Strong>die 100 × 50 mm; interdigital finger width 1.245 mm; pitch 4.980 mm; dual banks of 8 finger pairs with an S5 spline twist (2π/3) and a 1.189 mm phase offset</Strong> between banks.
    </P>
    <P>
      The associated thrust model uses the standard acoustic radiation-pressure relation Π = ½·ρ·ω²·A²·η in a liquid-hydrogen medium (at A = 1.2 µm: Π ≈ 967 Pa). That is in-medium acoustics, and it is presented as such — claims beyond the medium are the device's research question, not its result. The device designs sit on a <Strong>separate patent track</Strong> and are deliberately held out of the publication volume.
    </P>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginTop:8 }}>
      <Stat value="0.70 MHz" label="Design resonance" sub="from SAW geometry"/>
      <Stat value="1.245 mm" label="Finger width" sub="generator-verified"/>
      <Stat value="4.980 mm" label="Pitch" sub="full wavelength"/>
      <Stat value="2π / 3" label="Bank twist" sub="S5 symmetry spline"/>
    </div>
  </Section>
);

// ── PROGRAMS ──────────────────────────────────────────────────────────────────
const PROGRAMS = [
  { name:'QAG Nexus', tag:'Education · Live', color:'#38e1ff', url:'https://qag-nexus-qag-works.vercel.app',
    desc:'The teaching platform: a 4-module, 10-lesson course presenting the Standard Model side-by-side with QAG, with the flagship galactic-kinematics lesson (including its Python lab) free. Researcher tier gates the deep QAG modules.' },
  { name:'Kinetics Lab', tag:'Interactive Data · Live', color:'#38e1ff', url:'https://qag-kinetics-lab-qag-works.vercel.app',
    desc:'The SPARC evidence, explorable: rotation-curve fits for all 175 galaxies, the Bullet Cluster and Train Wreck case files, cosmology and kinetics demos — all figures are the team\'s own fits.' },
  { name:'QAG Virology', tag:'Research Demo · Live', color:'#7ee0a3', url:'https://qag-virology-demo-qag-works.vercel.app',
    desc:'The bio-acoustic research line — ultrasonic cavitation and viral-clearance modelling under QAG dynamics — behind a research-use-only safety gate on every page.' },
  { name:'Aestheria', tag:'AI Research · Live', color:'#c792ea', url:'https://aestheria-qag-works.vercel.app',
    desc:'Affy: a dual-hemisphere, offline-first AI assistant built on Base-12/QAG principles, with an Android client and a Python mind. Telemetry live; the token-gated deployment is the current build phase.' },
  { name:'QACTS', tag:'Trading Platform · Live', color:'#38e1ff', url:'https://qacts.vercel.app',
    desc:'A web3 paper-trading and wallet-intelligence platform running the QAG "Grand Breath" regime model, with an on-device offline AI. Users sign every transaction in their own wallet — always.' },
  { name:'MeditationMedicine', tag:'Wellness · Live', color:'#7ee0a3', url:'https://meditation-medicine-9gclcg2pm-qag-works.vercel.app',
    desc:'Breath-pacing and visual-mode meditation tooling with a flicker-safety dialog, built from the Base-12 harmonic work.' },
  { name:'Vajra Casting', tag:'Fabrication · Live', color:'#38e1ff', url:'https://vajra-casting.vercel.app',
    desc:'The Base-12 Meditation Vajra: a 144 mm silicon-bronze casting project with full manufacturing files and a dual-size 3D viewer — the engineering programme in metal.' },
];
const Programs = () => (
  <Section id="programs" bg="linear-gradient(180deg,#0a1226 0%,#05070f 100%)">
    <Eyebrow>The Ecosystem</Eyebrow>
    <H2>One framework, many instruments.</H2>
    <P>
      The portal is the reference point; the work itself is distributed across live applications — teaching, data, simulation, AI, trading, fabrication. Each carries the same rule as this page: <Strong>honest badges, real data, no fake functionality</Strong>.
    </P>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:18, marginTop:30 }}>
      {PROGRAMS.map((p,i) => (
        <a key={i} href={p.url} target="_blank" rel="noreferrer" className="card prog-card" style={{ padding:'26px 24px', display:'block' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontFamily:'Cormorant Garamond,serif', fontSize:24, fontWeight:700, color:'#dbe4ff' }}>{p.name}</span>
            <Tag color={p.color}>{p.tag}</Tag>
          </div>
          <p style={{ fontFamily:'Inter,sans-serif', fontSize:14, lineHeight:1.75, color:'#c6d2e2', margin:0 }}>{p.desc}</p>
        </a>
      ))}
    </div>
  </Section>
);

// ── PUBLICATIONS ──────────────────────────────────────────────────────────────
const Publications = () => (
  <Section id="publications" bg="#060c16">
    <Eyebrow>Publications & Data</Eyebrow>
    <H2>The record, in the open.</H2>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:18, marginTop:10 }}>
      <div className="card" style={{ padding:'28px 26px' }}>
        <Tag color="#38e1ff">Preprint · CC BY 4.0</Tag>
        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:24, color:'#dbe4ff', margin:'16px 0 10px' }}>Empirical Validation of the AVI Law via SPARC Galaxy Rotation Curves</h3>
        <P style={{ fontSize:14.5, marginBottom:14 }}>
          The programme's one item in the public scholarly registries: the AVI velocity law and the DDO 154 case study, published on Figshare (27 March 2026) and registered with ORCID and DataCite.
        </P>
        <a href="https://doi.org/10.6084/m9.figshare.31871464.v1" target="_blank" rel="noreferrer" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, color:'#38e1ff', wordBreak:'break-all' }}>
          doi.org/10.6084/m9.figshare.31871464.v1 →
        </a>
      </div>
      <div className="card" style={{ padding:'28px 26px' }}>
        <Tag color="#38e1ff">Monograph · 65 pages</Tag>
        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:24, color:'#dbe4ff', margin:'16px 0 10px' }}>Quantum Affinity Gravity — The Unified Volume</h3>
        <P style={{ fontSize:14.5, marginBottom:0 }}>
          The single-volume LaTeX publication: galactic validation, the Coherence-Floor Lemma, the derivation programme, clusters, and a Millennium Problems chapter that labels its own contents hypothesis / model / reframing / analogy — none of it presented as Clay-grade proof. Compiled clean at 65 pages; public deposit follows the author's per-item review.
        </P>
      </div>
      <div className="card" style={{ padding:'28px 26px' }}>
        <Tag color="#7ee0a3">Open Data</Tag>
        <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:24, color:'#dbe4ff', margin:'16px 0 10px' }}>SPARC v3.0 & the Replication Lab</h3>
        <P style={{ fontSize:14.5, marginBottom:0 }}>
          The v3.0 fit package is byte-identical to the original SPARC release (zero ingest drift), and the replication lab's artefacts — including the failed blind test and all 73 derivation-hunt systems — are preserved in the research record, not edited away. Data services (qag-data, qag-sparc-data) feed the live sites above.
        </P>
      </div>
    </div>
    <P style={{ marginTop:26, marginBottom:0 }}>
      A note on scope: every figure on this site is the team's own fit or measurement, <Strong>not independently validated</Strong>, except where a public dataset (SPARC, Chandra) is named as the source. Where the record disagreed with itself during canonicalisation, the rulings and their reasoning were written down — that register is part of the research record too.
    </P>
  </Section>
);

// ── ABOUT ─────────────────────────────────────────────────────────────────────
const About = () => (
  <Section id="about" bg="#0a1226">
    <Eyebrow>About</Eyebrow>
    <H2>Rodney A. Ripley Jr.</H2>
    <P>
      Independent theoretical physicist, lead researcher, and software developer working as <Strong>R&R Droids</Strong> (Ripley & Ripley Research) from Salineville, Ohio. The QAG programme — one year of full-time work across theory, simulation, and instrumentation — is built in the open with an AI research partner, and is documented here at the standard he set for it: <Strong>honest, properly derived, and compliant with accepted academic expectations</Strong>, including publishing the failures.
    </P>
    <P style={{ marginBottom:0, overflowWrap:'break-word' }}>
      Research contact: <a href="mailto:droiden.rr@gmail.com" style={{ color:'#38e1ff' }}>droiden.rr@gmail.com</a> · ORCID <a href="https://orcid.org/0009-0004-8370-3779" target="_blank" rel="noreferrer" style={{ color:'#38e1ff', wordBreak:'break-all' }}>0009-0004-8370-3779</a> · Code: <a href="https://github.com/Sir-Ripley" target="_blank" rel="noreferrer" style={{ color:'#38e1ff' }}>github.com/Sir-Ripley</a>
    </P>
  </Section>
);

// ── FOOTER ────────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer style={{ background:'#05070f', borderTop:'1px solid rgba(56,225,255,0.15)', padding:'44px 28px' }}>
    <div style={{ maxWidth:1100, margin:'0 auto' }}>
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:26 }}>
        {SITELINKS.map(s => (
          <a key={s.href} href={s.href} style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#8b96b3', textDecoration:'none', border:'1px solid rgba(56,225,255,0.18)', borderRadius:999, padding:'6px 14px' }}>{s.label}</a>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:20, alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:20, fontWeight:700, color:'#38e1ff', letterSpacing:2 }}>QAG</div>
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:'#8b96b3', marginTop:6 }}>
            Quantum Affinity Gravity · R&R Droids · Salineville, Ohio
          </div>
        </div>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:'#8b96b3', lineHeight:1.9, textAlign:'right' }}>
          <div>All QAG figures are the team's own fits, not independently validated.</div>
          <div>Portal rebuilt November 2026 from the canonical research record.</div>
        </div>
      </div>
    </div>
  </footer>
);

// ── APP ───────────────────────────────────────────────────────────────────────
export default function QAGWebsite() {
  const [active, setActive] = useState('home');
  const go = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior:'smooth' });
  };
  useEffect(() => {
    const ids = ['home','crisis','theory','cosmology','validation','clusters','engineering','programs','publications','about'];
    const h = () => {
      let cur = 'home';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) cur = id;
      }
      setActive(cur);
    };
    window.addEventListener('scroll', h, { passive:true });
    h();
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <div style={{ background:'#05070f', minHeight:'100vh' }}>
      <GlobalStyle/>
      <Nav active={active} go={go}/>
      <Hero go={go}/>
      <Crisis/>
      <Theory/>
      <Cosmology/>
      <Validation/>
      <Clusters/>
      <Engineering/>
      <Programs/>
      <Publications/>
      <About/>
      <Footer/>
    </div>
  );
}
