import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Login({ onVisitante }) {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [modo, setModo]         = useState('login')
  const [nombre, setNombre]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [msg, setMsg]           = useState('')

  async function handleSubmit() {
    setError(''); setMsg(''); setLoading(true)
    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
      } else {
        // Registro deshabilitado — solo admins pueden crear cuentas
        setError('')
        setMsg('El registro está deshabilitado. Solo los doctores autorizados pueden acceder al sistema. Contacta al administrador para solicitar acceso.')
        setLoading(false)
        return
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'1.5rem' }}>
      <div style={{ width:'100%', maxWidth:'400px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'2rem', boxShadow:'var(--shadow)' }}>

        {/* Logo — clic va al landing */}
        <div
          onClick={() => navigate('/')}
          style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'2rem', cursor:'pointer' }}
        >
          <div style={{ width:'32px', height:'32px', background:'var(--accent)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight:500, fontSize:'15px', margin:0 }}>NeuroScan AI</p>
            <p style={{ fontSize:'12px', color:'var(--muted)', margin:0 }}>Clasificador de Alzheimer · MRI</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:'1px solid var(--border)', borderRadius:'8px', overflow:'hidden', marginBottom:'1.5rem' }}>
          {['login','registro'].map(m => (
            <button key={m} onClick={() => { setModo(m); setError(''); setMsg('') }} style={{
              padding:'8px', border:'none',
              background: modo === m ? 'var(--accent)' : 'transparent',
              color: modo === m ? '#fff' : 'var(--muted)',
              fontSize:'13px', fontFamily:'DM Sans, sans-serif',
              cursor:'pointer', fontWeight: modo === m ? 500 : 400,
            }}>
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        {/* Campos */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'1rem' }}>
          {modo === 'registro' && (
            <>
              {/* Aviso registro deshabilitado */}
              <div style={{ padding:'12px 14px', background:'var(--warn-lt)', border:'1px solid #fde68a', borderRadius:'8px', display:'flex', gap:'10px', alignItems:'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0, marginTop:'1px' }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ fontSize:'12px', color:'#92400e', margin:0, lineHeight:1.6 }}>
                  El acceso al sistema está reservado para doctores autorizados. Si eres médico y necesitas una cuenta, por favor contacta al administrador del sistema.
                </p>
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--muted)', display:'block', marginBottom:'4px' }}>Nombre completo</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Dr. Juan Pérez" disabled
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'14px', fontFamily:'DM Sans, sans-serif', background:'var(--bg)', color:'var(--muted)', outline:'none', boxSizing:'border-box', cursor:'not-allowed', opacity:0.6 }}
                />
              </div>
            </>
          )}
          <div>
            <label style={{ fontSize:'12px', color:'var(--muted)', display:'block', marginBottom:'4px' }}>Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@clinica.com"
              disabled={modo === 'registro'}
              style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'14px', fontFamily:'DM Sans, sans-serif', background:'var(--bg)', color: modo === 'registro' ? 'var(--muted)' : 'var(--text)', outline:'none', boxSizing:'border-box', cursor: modo === 'registro' ? 'not-allowed' : 'text', opacity: modo === 'registro' ? 0.6 : 1 }}
            />
          </div>
          <div>
            <label style={{ fontSize:'12px', color:'var(--muted)', display:'block', marginBottom:'4px' }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              disabled={modo === 'registro'}
              onKeyDown={e => e.key === 'Enter' && modo === 'login' && handleSubmit()}
              style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'14px', fontFamily:'DM Sans, sans-serif', background:'var(--bg)', color: modo === 'registro' ? 'var(--muted)' : 'var(--text)', outline:'none', boxSizing:'border-box', cursor: modo === 'registro' ? 'not-allowed' : 'text', opacity: modo === 'registro' ? 0.6 : 1 }}
            />
          </div>
        </div>

        {error && <div style={{ padding:'10px 12px', background:'var(--danger-lt)', border:'1px solid #fecaca', borderRadius:'8px', fontSize:'13px', color:'var(--danger)', marginBottom:'1rem' }}>{error}</div>}

        <button
          onClick={modo === 'registro' ? null : handleSubmit}
          disabled={loading || modo === 'registro'}
          style={{
            width:'100%', padding:'10px',
            background: modo === 'registro' ? 'var(--border)' : loading ? 'var(--border)' : 'var(--accent)',
            color: modo === 'registro' || loading ? 'var(--muted)' : '#fff',
            border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:500,
            fontFamily:'DM Sans, sans-serif',
            cursor: modo === 'registro' || loading ? 'not-allowed' : 'pointer',
            marginBottom:'12px',
          }}
        >
          {loading ? 'Cargando...' : modo === 'login' ? 'Iniciar sesión' : 'Registro no disponible'}
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
          <div style={{ flex:1, height:'1px', background:'var(--border)' }}/>
          <span style={{ fontSize:'12px', color:'var(--muted)' }}>o</span>
          <div style={{ flex:1, height:'1px', background:'var(--border)' }}/>
        </div>

        <button onClick={() => navigate('/consulta')} style={{
          width:'100%', padding:'10px', background:'transparent',
          color:'var(--muted)', border:'1px solid var(--border)', borderRadius:'8px',
          fontSize:'14px', fontFamily:'DM Sans, sans-serif', cursor:'pointer',
        }}>
          Ingresar como visitante
        </button>

        <p style={{ fontSize:'11px', color:'var(--muted)', textAlign:'center', marginTop:'1rem', lineHeight:1.5 }}>
          El acceso como visitante solo permite consultas rápidas sin guardar datos.
        </p>
      </div>
    </div>
  )
}
