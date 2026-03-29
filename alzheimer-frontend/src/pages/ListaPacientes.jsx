import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Header from '../components/Header'

const BADGE = {
  'No Demencia':       { bg:'var(--success-lt)', color:'var(--success)' },
  'Demencia Muy Leve': { bg:'#fffbeb',           color:'#92400e' },
  'Demencia Leve':     { bg:'var(--warn-lt)',     color:'var(--warn)' },
  'Demencia Moderada': { bg:'var(--danger-lt)',   color:'var(--danger)' },
}

export default function ListaPacientes({ session, perfil, onLogout }) {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading]     = useState(true)
  const [busqueda, setBusqueda]   = useState('')
  const [detalle, setDetalle]     = useState(null)

  useEffect(() => {
    fetchPacientes()
  }, [])

  async function fetchPacientes() {
    setLoading(true)
    const { data } = await supabase
      .from('pacientes')
      .select('*')
      .order('created_at', { ascending: false })
    setPacientes(data || [])
    setLoading(false)
  }

  const filtrados = pacientes.filter(p =>
    `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Header perfil={perfil} visitante={false} onLogout={onLogout} />
      <main style={{ flex:1, maxWidth:'1100px', width:'100%', margin:'0 auto', padding:'2.5rem 1.5rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.5rem' }}>
          <div>
            <h1 style={{ fontSize:'24px', fontWeight:400, letterSpacing:'-0.03em', marginBottom:'4px' }}>Pacientes</h1>
            <p style={{ fontSize:'14px', color:'var(--muted)' }}>{pacientes.length} registros en total</p>
          </div>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o DNI..."
            style={{ padding:'9px 14px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'13px', fontFamily:'DM Sans, sans-serif', background:'var(--surface)', color:'var(--text)', outline:'none', width:'260px' }}
          />
        </div>

        {loading ? (
          <p style={{ color:'var(--muted)', fontSize:'14px' }}>Cargando...</p>
        ) : (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr style={{ background:'var(--bg)' }}>
                  {['Paciente','DNI','Edad','Sexo','Diagnóstico','Confianza','Fecha','Médico'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:500, color:'var(--muted)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding:'2rem', textAlign:'center', color:'var(--muted)' }}>No se encontraron pacientes.</td></tr>
                ) : filtrados.map(p => {
                  const badge = BADGE[p.diagnostico] || { bg:'var(--bg)', color:'var(--muted)' }
                  return (
                    <tr key={p.id} onClick={() => setDetalle(p)} style={{ borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      <td style={{ padding:'12px 14px', fontWeight:500 }}>{p.nombre} {p.apellido}</td>
                      <td style={{ padding:'12px 14px', color:'var(--muted)', fontFamily:'DM Mono, monospace' }}>{p.dni}</td>
                      <td style={{ padding:'12px 14px' }}>{p.edad}</td>
                      <td style={{ padding:'12px 14px', color:'var(--muted)' }}>{p.sexo}</td>
                      <td style={{ padding:'12px 14px' }}>
                        {p.diagnostico ? (
                          <span style={{ padding:'3px 8px', borderRadius:'6px', fontSize:'12px', background:badge.bg, color:badge.color, fontWeight:500 }}>
                            {p.diagnostico}
                          </span>
                        ) : <span style={{ color:'var(--muted)' }}>—</span>}
                      </td>
                      <td style={{ padding:'12px 14px', fontFamily:'DM Mono, monospace' }}>
                        {p.confianza ? `${p.confianza.toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ padding:'12px 14px', color:'var(--muted)' }}>{p.fecha_consulta}</td>
                      <td style={{ padding:'12px 14px', color:'var(--muted)' }}>{p.medico_nombre || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal detalle */}
        {detalle && (
          <div onClick={() => setDetalle(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'var(--surface)', borderRadius:'12px', padding:'2rem', maxWidth:'500px', width:'100%', border:'1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontSize:'18px', fontWeight:500, margin:0 }}>{detalle.nombre} {detalle.apellido}</h2>
                <button onClick={() => setDetalle(null)} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'var(--muted)' }}>×</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', fontSize:'13px', marginBottom:'1rem' }}>
                {[['DNI',detalle.dni],['Edad',detalle.edad],['Sexo',detalle.sexo],['Fecha',detalle.fecha_consulta],['Médico',detalle.medico_nombre],['Diagnóstico',detalle.diagnostico]].map(([k,v]) => (
                  <div key={k}>
                    <p style={{ color:'var(--muted)', margin:'0 0 2px' }}>{k}</p>
                    <p style={{ fontWeight:500, margin:0 }}>{v || '—'}</p>
                  </div>
                ))}
              </div>
              {detalle.notas && (
                <div style={{ padding:'10px 12px', background:'var(--bg)', borderRadius:'8px', fontSize:'13px', marginBottom:'1rem' }}>
                  <p style={{ color:'var(--muted)', margin:'0 0 4px', fontSize:'12px' }}>Notas</p>
                  <p style={{ margin:0 }}>{detalle.notas}</p>
                </div>
              )}
              {detalle.imagen_url && (
                <img src={detalle.imagen_url} alt="MRI" style={{ width:'100%', borderRadius:'8px', maxHeight:'200px', objectFit:'contain', background:'#000' }} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
