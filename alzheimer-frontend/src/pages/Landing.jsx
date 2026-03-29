import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ModalVisitante from '../components/ModalVisitante'

export default function Landing() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap');

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(1.4); }
        }

        .hero-tag   { animation: fadeUp 0.5s ease both; animation-delay: 0.1s; }
        .hero-h1    { animation: fadeUp 0.5s ease both; animation-delay: 0.25s; }
        .hero-sub   { animation: fadeUp 0.5s ease both; animation-delay: 0.4s; }
        .hero-btns  { animation: fadeUp 0.5s ease both; animation-delay: 0.55s; }
        .hero-stats { animation: fadeUp 0.5s ease both; animation-delay: 0.7s; }
        .hero-right { animation: fadeIn 0.8s ease both; animation-delay: 0.3s; }

        .btn-primary {
          padding: 11px 28px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          letter-spacing: -0.01em;
        }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }

        .btn-ghost {
          padding: 11px 20px;
          background: transparent;
          color: var(--muted);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .btn-ghost:hover { background: var(--bg); color: var(--text); }

        .feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 1.25rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        .feature-card:hover { border-color: var(--accent); transform: translateY(-2px); }

        .mri-mockup {
          background: #0a0a0f;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
        }
      `}</style>

          {showModal && (
        <ModalVisitante
          onConfirmar={() => { setShowModal(false); navigate('/consulta') }}
          onSaltar={() => { setShowModal(false); navigate('/consulta') }}
        />
      )}
      <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'DM Sans, sans-serif' }}>

        {/* NAV */}
        <nav style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'0 2rem', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'28px', height:'28px', background:'var(--accent)', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"/>
              </svg>
            </div>
            <span style={{ fontWeight:500, fontSize:'15px', letterSpacing:'-0.01em' }}>NeuroScan AI</span>
          </div>
          <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding:'7px 16px', fontSize:'13px' }}>Iniciar sesión</button>
        </nav>

        {/* HERO */}
        <section style={{ maxWidth:'1100px', margin:'0 auto', padding:'5rem 2rem 4rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4rem', alignItems:'center' }}>

          {/* Izquierda */}
          <div>
            <div className="hero-tag" style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'5px 12px', background:'var(--accent-lt)', borderRadius:'99px', marginBottom:'1.5rem' }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--accent)', animation:'pulse-dot 2s ease infinite' }}/>
              <span style={{ fontSize:'12px', color:'var(--accent)', fontWeight:500 }}>Tecnología de IA clínica</span>
            </div>

            <h1 className="hero-h1" style={{ fontSize:'40px', fontWeight:400, lineHeight:1.15, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 1.25rem' }}>
              Detección temprana<br/>
              del <span style={{ color:'var(--accent)' }}>Alzheimer</span><br/>
              con inteligencia artificial
            </h1>

            <p className="hero-sub" style={{ fontSize:'15px', color:'var(--muted)', lineHeight:1.7, margin:'0 0 2rem', maxWidth:'420px' }}>
              NeuroScan AI analiza imágenes de resonancia magnética cerebral en segundos, clasificando el estadio de la demencia con un 96.8% de precisión para apoyar el diagnóstico clínico.
            </p>

            <div className="hero-btns" style={{ display:'flex', gap:'12px', alignItems:'center', marginBottom:'2.5rem' }}>
              <button className="btn-primary" onClick={() => navigate('/login')}>
                Empezar ahora
              </button>
              <button className="btn-ghost" onClick={() => navigate("/consulta")}>
                Ingresar como visitante →
              </button>
            </div>

            {/* Stats */}
            <div className="hero-stats" style={{ display:'flex', gap:'2rem', paddingTop:'1.5rem', borderTop:'1px solid var(--border)' }}>
              {[
                { value:'96.8%', label:'Precisión del modelo' },
                { value:'4',     label:'Estadios clasificados' },
                { value:'< 2s',  label:'Tiempo de análisis' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p style={{ fontSize:'22px', fontWeight:400, margin:'0 0 2px', letterSpacing:'-0.03em', color:'var(--text)' }}>{value}</p>
                  <p style={{ fontSize:'12px', color:'var(--muted)', margin:0 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Derecha — mockup clínico */}
          <div className="hero-right">
            <div className="mri-mockup" style={{ padding:'1.25rem' }}>
              {/* Barra superior mockup */}
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'1rem' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#ff5f57' }}/>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#febc2e' }}/>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#28c840' }}/>
                <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', marginLeft:'8px', fontFamily:'DM Mono, monospace' }}>neuroscan · análisis MRI</span>
              </div>

              {/* Imagen MRI simulada con SVG cerebro */}
              <div style={{ background:'#000', borderRadius:'8px', padding:'1rem', marginBottom:'1rem', display:'flex', justifyContent:'center' }}>
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <defs>
                    <radialGradient id="brain-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#4a9eff" stopOpacity="0.15"/>
                      <stop offset="100%" stopColor="#000" stopOpacity="0"/>
                    </radialGradient>
                  </defs>
                  <circle cx="100" cy="100" r="90" fill="url(#brain-glow)"/>
                  <ellipse cx="100" cy="100" rx="72" ry="78" fill="none" stroke="#e8e8e8" strokeWidth="1.5" opacity="0.9"/>
                  <ellipse cx="100" cy="100" rx="55" ry="62" fill="none" stroke="#c8c8c8" strokeWidth="1" opacity="0.6"/>
                  <path d="M100 22 Q130 30 148 55 Q165 80 160 105 Q155 135 135 152 Q115 168 100 170 Q85 168 65 152 Q45 135 40 105 Q35 80 52 55 Q70 30 100 22Z" fill="none" stroke="#d0d0d0" strokeWidth="1.5" opacity="0.7"/>
                  <line x1="100" y1="22" x2="100" y2="170" stroke="#888" strokeWidth="0.8" opacity="0.4"/>
                  <path d="M60 70 Q75 60 90 68 Q100 74 100 82" fill="none" stroke="#aaa" strokeWidth="1.2" opacity="0.7"/>
                  <path d="M140 70 Q125 60 110 68 Q100 74 100 82" fill="none" stroke="#aaa" strokeWidth="1.2" opacity="0.7"/>
                  <path d="M55 100 Q70 88 85 95 Q95 100 100 108 Q105 100 115 95 Q130 88 145 100" fill="none" stroke="#aaa" strokeWidth="1.2" opacity="0.6"/>
                  <path d="M62 125 Q80 115 95 122 Q100 126 105 122 Q120 115 138 125" fill="none" stroke="#999" strokeWidth="1" opacity="0.5"/>
                  <circle cx="78" cy="105" r="4" fill="#2563eb" opacity="0.7"/>
                  <circle cx="122" cy="105" r="4" fill="#2563eb" opacity="0.7"/>
                  <circle cx="100" cy="90" r="3" fill="#2563eb" opacity="0.5"/>
                  <circle cx="78" cy="105" r="8" fill="none" stroke="#2563eb" strokeWidth="1" opacity="0.3"/>
                  <circle cx="122" cy="105" r="8" fill="none" stroke="#2563eb" strokeWidth="1" opacity="0.3"/>
                  <text x="100" y="190" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="DM Mono, monospace">axial · T1-weighted</text>
                </svg>
              </div>

              {/* Resultado simulado */}
              <div style={{ background:'rgba(5,150,105,0.12)', border:'1px solid rgba(5,150,105,0.3)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                  <div>
                    <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', margin:'0 0 2px', letterSpacing:'0.06em', textTransform:'uppercase' }}>Diagnóstico detectado</p>
                    <p style={{ fontSize:'15px', fontWeight:500, color:'#34d399', margin:0 }}>No Demencia</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', margin:'0 0 2px', letterSpacing:'0.06em', textTransform:'uppercase' }}>Confianza</p>
                    <p style={{ fontSize:'24px', fontWeight:300, color:'#34d399', margin:0, fontFamily:'DM Mono, monospace' }}>97.4%</p>
                  </div>
                </div>
                {[
                  { label:'No Demencia', pct:97.4, color:'#34d399' },
                  { label:'Demencia Muy Leve', pct:1.8, color:'#fbbf24' },
                  { label:'Demencia Leve', pct:0.6, color:'#f97316' },
                  { label:'Demencia Moderada', pct:0.2, color:'#f87171' },
                ].map(({ label, pct, color }) => (
                  <div key={label} style={{ marginBottom:'5px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', marginBottom:'2px' }}>
                      <span style={{ color:'rgba(255,255,255,0.5)' }}>{label}</span>
                      <span style={{ color:'rgba(255,255,255,0.4)', fontFamily:'DM Mono, monospace' }}>{pct}%</span>
                    </div>
                    <div style={{ height:'3px', background:'rgba(255,255,255,0.08)', borderRadius:'99px' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:'99px', transition:'width 1s ease' }}/>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.2)', textAlign:'center', margin:0, fontFamily:'DM Mono, monospace' }}>
                Solo uso orientativo · No reemplaza diagnóstico médico
              </p>
            </div>
          </div>
        </section>

        {/* CARACTERÍSTICAS */}
        <section style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'4rem 2rem' }}>
          <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
            <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', textAlign:'center', marginBottom:'0.5rem' }}>Funcionalidades</p>
            <h2 style={{ fontSize:'26px', fontWeight:400, letterSpacing:'-0.03em', textAlign:'center', margin:'0 0 3rem' }}>Todo lo que necesitas en un solo sistema</h2>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1rem' }}>
              {[
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
                  title: 'Consulta rápida',
                  desc: 'Analiza cualquier imagen MRI en segundos sin necesidad de crear una cuenta.',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
                  title: 'Gestión de pacientes',
                  desc: 'Registra y accede al historial clínico de cada paciente junto con sus predicciones.',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
                  title: 'Dashboard clínico',
                  desc: 'Visualiza estadísticas, distribución de diagnósticos y tendencias por período.',
                },
                {
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                  title: 'Acceso por roles',
                  desc: 'Sistema de autenticación seguro con roles diferenciados para médicos y visitantes.',
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="feature-card">
                  <div style={{ width:'36px', height:'36px', background:'var(--accent-lt)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}>
                    {icon}
                  </div>
                  <p style={{ fontWeight:500, fontSize:'14px', margin:'0 0 6px' }}>{title}</p>
                  <p style={{ fontSize:'13px', color:'var(--muted)', margin:0, lineHeight:1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CLASIFICACIONES */}
        <section style={{ maxWidth:'1100px', margin:'0 auto', padding:'4rem 2rem' }}>
          <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'0.5rem' }}>Modelo de clasificación</p>
          <h2 style={{ fontSize:'26px', fontWeight:400, letterSpacing:'-0.03em', margin:'0 0 2.5rem' }}>4 estadios de demencia detectados</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1rem' }}>
            {[
              { label:'No Demencia',       color:'#059669', bg:'#ecfdf5', border:'#a7f3d0', pct:'96.8%', desc:'Sin patrones asociados a demencia.' },
              { label:'Demencia Muy Leve', color:'#92400e', bg:'#fffbeb', border:'#fde68a', pct:'97.1%', desc:'Primeros indicios. Seguimiento recomendado.' },
              { label:'Demencia Leve',     color:'#c2410c', bg:'#fff7ed', border:'#fed7aa', pct:'99.6%', desc:'Patrones leves. Evaluación médica indicada.' },
              { label:'Demencia Moderada', color:'#991b1b', bg:'#fef2f2', border:'#fecaca', pct:'100%',  desc:'Atrofia significativa. Atención urgente.' },
            ].map(({ label, color, bg, border, pct, desc }) => (
              <div key={label} style={{ background:bg, border:`1px solid ${border}`, borderRadius:'10px', padding:'1.25rem' }}>
                <p style={{ fontSize:'13px', fontWeight:500, color, margin:'0 0 6px' }}>{label}</p>
                <p style={{ fontSize:'22px', fontWeight:400, color, margin:'0 0 8px', fontFamily:'DM Mono, monospace', letterSpacing:'-0.02em' }}>{pct}</p>
                <p style={{ fontSize:'12px', color, opacity:0.75, margin:0, lineHeight:1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{ background:'var(--accent)', padding:'4rem 2rem', textAlign:'center' }}>
          <h2 style={{ fontSize:'28px', fontWeight:400, color:'#fff', letterSpacing:'-0.03em', margin:'0 0 12px' }}>
            Comienza a analizar imágenes hoy
          </h2>
          <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.75)', margin:'0 0 2rem', maxWidth:'420px', marginLeft:'auto', marginRight:'auto', lineHeight:1.6 }}>
            Accede gratis como visitante o crea una cuenta médica para gestionar pacientes y acceder al dashboard completo.
          </p>
          <button onClick={() => navigate('/login')} style={{
            padding:'12px 32px', background:'#fff', color:'var(--accent)',
            border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:500,
            fontFamily:'DM Sans, sans-serif', cursor:'pointer',
            transition:'opacity 0.2s, transform 0.15s',
          }}
            onMouseEnter={e => { e.target.style.opacity='0.9'; e.target.style.transform='translateY(-1px)' }}
            onMouseLeave={e => { e.target.style.opacity='1'; e.target.style.transform='translateY(0)' }}
          >
            Empezar ahora
          </button>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop:'1px solid var(--border)', padding:'1.25rem 2rem', display:'flex', justifyContent:'center' }}>
          <p style={{ fontSize:'12px', color:'var(--muted)', margin:0 }}>
            NeuroScan AI · Solo uso clínico orientativo · No reemplaza diagnóstico médico
          </p>
        </footer>
      </div>
    </>
  )
}
