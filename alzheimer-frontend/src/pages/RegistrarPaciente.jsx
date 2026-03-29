import { useState, useCallback } from 'react'
import axios from 'axios'
import { supabase } from '../supabase'
import Header from '../components/Header'
import Dropzone from '../components/Dropzone'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const field = (label, children) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
    <label style={{ fontSize:'12px', color:'var(--muted)', fontWeight:500 }}>{label}</label>
    {children}
  </div>
)

const input = (props) => (
  <input {...props} style={{ padding:'9px 12px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'14px', fontFamily:'DM Sans, sans-serif', background:'var(--bg)', color:'var(--text)', outline:'none', boxSizing:'border-box', width:'100%' }} />
)

const select = (props, children) => (
  <select {...props} style={{ padding:'9px 12px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'14px', fontFamily:'DM Sans, sans-serif', background:'var(--bg)', color:'var(--text)', outline:'none', width:'100%' }}>
    {children}
  </select>
)

export default function RegistrarPaciente({ session, perfil, onLogout }) {
  const hoy = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    nombre:'', apellido:'', dni:'', edad:'', sexo:'Masculino',
    fecha_consulta: hoy, notas:'',
  })
  const [file, setFile]         = useState(null)
  const [resultado, setResultado] = useState(null)
  const [status, setStatus]     = useState('idle')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleFile = useCallback((f) => {
    setFile(f); setResultado(null)
  }, [])

  const predecir = async () => {
    if (!file) return
    setStatus('predicting')
    try {
      const fd = new FormData(); fd.append('file', file)
      const { data } = await axios.post(`${API_URL}/predict`, fd, { timeout: 30000 })
      setResultado(data); setStatus('idle')
    } catch {
      setError('Error al obtener predicción. Verifica que la API esté activa.')
      setStatus('idle')
    }
  }

  const guardar = async () => {
    if (!form.nombre || !form.apellido || !form.dni || !form.edad) {
      setError('Completa todos los campos obligatorios.'); return
    }
    setStatus('saving'); setError('')
    try {
      let imagen_url = null

      if (file) {
        const ext  = file.name.split('.').pop()
        const path = `${session.user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('mri-images').upload(path, file)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('mri-images').getPublicUrl(path)
          imagen_url = urlData.publicUrl
        }
      }

      const { error: dbError } = await supabase.from('pacientes').insert({
        ...form,
        edad: parseInt(form.edad),
        imagen_url,
        diagnostico:    resultado?.class        || null,
        confianza:      resultado?.confidence   || null,
        probabilidades: resultado?.probabilities || null,
        medico_id:      session.user.id,
        medico_nombre:  perfil?.nombre || session.user.email,
      })

      if (dbError) throw dbError
      setSuccess(true)
      setForm({ nombre:'', apellido:'', dni:'', edad:'', sexo:'Masculino', fecha_consulta: hoy, notas:'' })
      setFile(null); setResultado(null)
    } catch (e) {
      setError(e.message || 'Error al guardar.')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Header perfil={perfil} visitante={false} onLogout={onLogout} />
      <main style={{ flex:1, maxWidth:'900px', width:'100%', margin:'0 auto', padding:'2.5rem 1.5rem' }}>
        <div style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontSize:'24px', fontWeight:400, letterSpacing:'-0.03em', marginBottom:'6px' }}>Registrar paciente</h1>
          <p style={{ fontSize:'14px', color:'var(--muted)' }}>Completa los datos, adjunta la imagen MRI y guarda el registro.</p>
        </div>

        {success && (
          <div style={{ padding:'12px 16px', background:'var(--success-lt)', border:'1px solid #bbf7d0', borderRadius:'10px', fontSize:'13px', color:'var(--success)', marginBottom:'1.5rem' }}>
            Paciente registrado correctamente.
          </div>
        )}
        {error && (
          <div style={{ padding:'12px 16px', background:'var(--danger-lt)', border:'1px solid #fecaca', borderRadius:'10px', fontSize:'13px', color:'var(--danger)', marginBottom:'1.5rem' }}>
            {error}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', alignItems:'start' }}>
          {/* Datos del paciente */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', padding:'1.5rem', boxShadow:'var(--shadow)' }}>
            <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'1.25rem' }}>Datos del paciente</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                {field('Nombre *', input({ value:form.nombre, onChange:e=>set('nombre',e.target.value), placeholder:'Juan' }))}
                {field('Apellido *', input({ value:form.apellido, onChange:e=>set('apellido',e.target.value), placeholder:'Pérez' }))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                {field('DNI / Historia clínica *', input({ value:form.dni, onChange:e=>set('dni',e.target.value), placeholder:'12345678' }))}
                {field('Edad *', input({ type:'number', value:form.edad, onChange:e=>set('edad',e.target.value), placeholder:'65', min:0, max:120 }))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                {field('Sexo', <select value={form.sexo} onChange={e=>set('sexo',e.target.value)} style={{ padding:'9px 12px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'14px', fontFamily:'DM Sans, sans-serif', background:'var(--bg)', color:'var(--text)', outline:'none', width:'100%' }}>
                  <option>Masculino</option><option>Femenino</option><option>Otro</option>
                </select>)}
                {field('Fecha de consulta', input({ type:'date', value:form.fecha_consulta, onChange:e=>set('fecha_consulta',e.target.value) }))}
              </div>
              {field('Notas del médico',
                <textarea value={form.notas} onChange={e=>set('notas',e.target.value)} rows={3} placeholder="Observaciones clínicas..."
                  style={{ padding:'9px 12px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'14px', fontFamily:'DM Sans, sans-serif', background:'var(--bg)', color:'var(--text)', outline:'none', resize:'vertical', width:'100%', boxSizing:'border-box' }}
                />
              )}
            </div>
          </div>

          {/* Imagen y predicción */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', padding:'1.5rem', boxShadow:'var(--shadow)' }}>
              <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'1rem' }}>Imagen MRI</p>
              <Dropzone onFile={handleFile} />
              {file && !resultado && (
                <button onClick={predecir} disabled={status==='predicting'} style={{
                  marginTop:'1rem', width:'100%', padding:'9px',
                  background: status==='predicting' ? 'var(--border)' : 'var(--accent)',
                  color: status==='predicting' ? 'var(--muted)' : '#fff',
                  border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:500,
                  fontFamily:'DM Sans, sans-serif', cursor:'pointer',
                }}>
                  {status==='predicting' ? 'Analizando...' : 'Obtener predicción'}
                </button>
              )}
            </div>

            {resultado && (
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', padding:'1.25rem', boxShadow:'var(--shadow)' }}>
                <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'10px' }}>Resultado de IA</p>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                  <span style={{ fontSize:'16px', fontWeight:500 }}>{resultado.class}</span>
                  <span style={{ fontSize:'20px', fontWeight:300, fontFamily:'DM Mono, monospace', color:'var(--accent)' }}>{resultado.confidence.toFixed(1)}%</span>
                </div>
                {Object.entries(resultado.probabilities).map(([cls, prob]) => (
                  <div key={cls} style={{ marginBottom:'8px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'3px' }}>
                      <span style={{ color:'var(--text)' }}>{cls}</span>
                      <span style={{ color:'var(--muted)', fontFamily:'DM Mono, monospace' }}>{prob.toFixed(1)}%</span>
                    </div>
                    <div style={{ height:'3px', background:'var(--border)', borderRadius:'99px' }}>
                      <div style={{ height:'100%', width:`${prob}%`, background:'var(--accent)', borderRadius:'99px' }}/>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={guardar} disabled={status==='saving'} style={{
              width:'100%', padding:'11px',
              background: status==='saving' ? 'var(--border)' : '#059669',
              color: status==='saving' ? 'var(--muted)' : '#fff',
              border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:500,
              fontFamily:'DM Sans, sans-serif', cursor: status==='saving' ? 'not-allowed' : 'pointer',
            }}>
              {status==='saving' ? 'Guardando...' : 'Guardar registro'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
