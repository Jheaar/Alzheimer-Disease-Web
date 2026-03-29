import { useState } from 'react'
import { supabase } from '../supabase'

export default function ModalVisitante({ onConfirmar, onSaltar }) {
  const hoy = new Date().toISOString().split('T')[0]
  const [form, setForm]         = useState({ nombre:'', apellido:'', dni:'', edad:'', sexo:'Masculino', correo:'' })
  const [consentimiento, setConsentimiento] = useState(false)
  const [shake, setShake]       = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  async function handleEnviar() {
    if (!form.nombre || !form.apellido || !form.edad || !form.dni) {
      setError('Por favor completa los campos obligatorios.'); return
    }
    if (!consentimiento) {
      setError('')
      triggerShake()
      return
    }
    setLoading(true); setError('')
    try {
      await supabase.from('pacientes').insert({
        nombre: form.nombre,
        apellido: form.apellido,
        dni: form.dni,
        edad: parseInt(form.edad),
        sexo: form.sexo,
        fecha_consulta: hoy,
        notas: form.correo ? `Correo visitante: ${form.correo}` : 'Registro visitante',
      })
      onConfirmar()
    } catch {
      onConfirmar()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100% { transform:translateX(0); }
          15%      { transform:translateX(-6px); }
          30%      { transform:translateX(6px); }
          45%      { transform:translateX(-5px); }
          60%      { transform:translateX(5px); }
          75%      { transform:translateX(-3px); }
          90%      { transform:translateX(3px); }
        }
        @keyframes pulse-border {
          0%,100% { box-shadow:0 0 0 0px rgba(220,38,38,0); }
          50%      { box-shadow:0 0 0 4px rgba(220,38,38,0.2); }
        }
        .shake { animation: shake 0.6s ease, pulse-border 0.6s ease; }
        .checkbox-custom {
          width:18px; height:18px; min-width:18px;
          border-radius:5px; border:1.5px solid var(--border);
          background:var(--bg); cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          transition:all 0.2s ease;
        }
        .checkbox-custom.checked  { background:var(--accent); border-color:var(--accent); }
        .checkbox-custom.errored  { border-color:#dc2626; background:#fef2f2; }
      `}</style>

      <div style={{ position:'fixed', inset:0, background:'rgba(15,17,23,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:'1rem' }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'14px', padding:'2rem', maxWidth:'460px', width:'100%', boxShadow:'0 8px 32px rgba(0,0,0,0.12)', maxHeight:'90vh', overflowY:'auto' }}>

          <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.25rem' }}>
            <div style={{ width:'48px', height:'48px', background:'var(--accent-lt)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            </div>
          </div>

          <h2 style={{ fontSize:'17px', fontWeight:500, textAlign:'center', margin:'0 0 8px', letterSpacing:'-0.01em' }}>Ayúdanos a salvar vidas</h2>
          <p style={{ fontSize:'13px', color:'var(--muted)', textAlign:'center', lineHeight:1.6, margin:'0 0 1.5rem' }}>
            Cada imagen de resonancia magnética que compartes nos acerca a un modelo más preciso que puede detectar el Alzheimer a tiempo. Si deseas apoyar esta causa, déjanos tus datos — son completamente confidenciales y solo se usan para mejorar el modelo.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'1.25rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <div>
                <label style={{ fontSize:'12px', color:'var(--muted)', display:'block', marginBottom:'4px' }}>Nombre *</label>
                <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan"
                  style={{ width:'100%', padding:'8px 11px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'13px', fontFamily:'DM Sans, sans-serif', background:'var(--bg)', color:'var(--text)', outline:'none', boxSizing:'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--muted)', display:'block', marginBottom:'4px' }}>Apellido *</label>
                <input value={form.apellido} onChange={e => set('apellido', e.target.value)} placeholder="Pérez"
                  style={{ width:'100%', padding:'8px 11px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'13px', fontFamily:'DM Sans, sans-serif', background:'var(--bg)', color:'var(--text)', outline:'none', boxSizing:'border-box' }}
                />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <div>
                <label style={{ fontSize:'12px', color:'var(--muted)', display:'block', marginBottom:'4px' }}>DNI *</label>
                <input value={form.dni} onChange={e => set('dni', e.target.value)} placeholder="12345678"
                  style={{ width:'100%', padding:'8px 11px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'13px', fontFamily:'DM Sans, sans-serif', background:'var(--bg)', color:'var(--text)', outline:'none', boxSizing:'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--muted)', display:'block', marginBottom:'4px' }}>Edad *</label>
                <input type="number" value={form.edad} onChange={e => set('edad', e.target.value)} placeholder="65" min={0} max={120}
                  style={{ width:'100%', padding:'8px 11px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'13px', fontFamily:'DM Sans, sans-serif', background:'var(--bg)', color:'var(--text)', outline:'none', boxSizing:'border-box' }}
                />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <div>
                <label style={{ fontSize:'12px', color:'var(--muted)', display:'block', marginBottom:'4px' }}>Sexo</label>
                <select value={form.sexo} onChange={e => set('sexo', e.target.value)}
                  style={{ width:'100%', padding:'8px 11px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'13px', fontFamily:'DM Sans, sans-serif', background:'var(--bg)', color:'var(--text)', outline:'none' }}
                >
                  <option>Masculino</option><option>Femenino</option><option>Otro</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--muted)', display:'block', marginBottom:'4px' }}>Correo electrónico</label>
                <input type="email" value={form.correo} onChange={e => set('correo', e.target.value)} placeholder="juan@email.com"
                  style={{ width:'100%', padding:'8px 11px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'13px', fontFamily:'DM Sans, sans-serif', background:'var(--bg)', color:'var(--text)', outline:'none', boxSizing:'border-box' }}
                />
              </div>
            </div>
          </div>

          {/* Checkbox consentimiento */}
          <div
            className={shake ? 'shake' : ''}
            onClick={() => setConsentimiento(v => !v)}
            style={{
              display:'flex', alignItems:'flex-start', gap:'10px',
              padding:'12px 14px', borderRadius:'10px', cursor:'pointer',
              border:`1.5px solid ${shake && !consentimiento ? '#dc2626' : consentimiento ? 'var(--accent)' : 'var(--border)'}`,
              background: consentimiento ? 'var(--accent-lt)' : shake && !consentimiento ? '#fef2f2' : 'var(--bg)',
              marginBottom:'1rem', transition:'all 0.2s ease', userSelect:'none',
            }}
          >
            <div className={`checkbox-custom ${consentimiento ? 'checked' : ''} ${shake && !consentimiento ? 'errored' : ''}`}>
              {consentimiento && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 6 5 9 10 3"/>
                </svg>
              )}
            </div>
            <p style={{ fontSize:'12px', color: consentimiento ? 'var(--accent)' : 'var(--muted)', margin:0, lineHeight:1.5, transition:'color 0.2s' }}>
              Acepto que mis datos sean utilizados <strong>única y exclusivamente</strong> para mejorar el modelo de detección de Alzheimer con fines de investigación científica, y que no serán compartidos con terceros ni usados para ningún otro propósito.
            </p>
          </div>

          {error && (
            <div style={{ padding:'9px 12px', background:'var(--danger-lt)', border:'1px solid #fecaca', borderRadius:'8px', fontSize:'12px', color:'var(--danger)', marginBottom:'1rem' }}>
              {error}
            </div>
          )}
          {shake && !consentimiento && (
            <div style={{ padding:'9px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', fontSize:'12px', color:'#dc2626', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Debes aceptar el consentimiento para continuar.
            </div>
          )}

          <button onClick={handleEnviar} disabled={loading} style={{
            width:'100%', padding:'10px', background: loading ? 'var(--border)' : 'var(--accent)',
            color: loading ? 'var(--muted)' : '#fff', border:'none', borderRadius:'8px',
            fontSize:'14px', fontWeight:500, fontFamily:'DM Sans, sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer', marginBottom:'8px',
          }}>
            {loading ? 'Enviando...' : 'Enviar y continuar'}
          </button>

          <button onClick={onSaltar} style={{
            width:'100%', padding:'10px', background:'transparent', color:'var(--muted)',
            border:'none', borderRadius:'8px', fontSize:'13px', fontFamily:'DM Sans, sans-serif', cursor:'pointer',
          }}>
            Prefiero no compartir mis datos
          </button>

          <p style={{ fontSize:'11px', color:'var(--muted)', textAlign:'center', marginTop:'10px', lineHeight:1.5 }}>
            Tus datos son confidenciales y solo se usan con fines de investigación científica.
          </p>
        </div>
      </div>
    </>
  )
}
