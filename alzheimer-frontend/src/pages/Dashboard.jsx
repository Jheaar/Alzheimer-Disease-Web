import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Header from '../components/Header'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = { 'No Demencia':'#059669', 'Demencia Muy Leve':'#d97706', 'Demencia Leve':'#ea580c', 'Demencia Moderada':'#dc2626' }

export default function Dashboard({ session, perfil, onLogout }) {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    supabase.from('pacientes').select('*').then(({ data }) => {
      setPacientes(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Header perfil={perfil} visitante={false} onLogout={onLogout} />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ color:'var(--muted)', fontSize:'14px' }}>Cargando estadísticas...</p>
      </div>
    </div>
  )

  // Conteo por diagnóstico
  const conteo = pacientes.reduce((acc, p) => {
    if (p.diagnostico) acc[p.diagnostico] = (acc[p.diagnostico] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(conteo).map(([name, value]) => ({ name, value }))

  // Promedio de edad por diagnóstico
  const edadProm = Object.entries(
    pacientes.reduce((acc, p) => {
      if (p.diagnostico && p.edad) {
        if (!acc[p.diagnostico]) acc[p.diagnostico] = { sum:0, count:0 }
        acc[p.diagnostico].sum   += p.edad
        acc[p.diagnostico].count += 1
      }
      return acc
    }, {})
  ).map(([name, { sum, count }]) => ({ name, promedio: Math.round(sum / count) }))

  // Consultas por mes
  const porMes = pacientes.reduce((acc, p) => {
    const mes = p.fecha_consulta?.slice(0, 7)
    if (mes) acc[mes] = (acc[mes] || 0) + 1
    return acc
  }, {})
  const barData = Object.entries(porMes).sort().map(([mes, total]) => ({ mes, total }))

  const metric = (label, value, color) => (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', padding:'1.25rem', boxShadow:'var(--shadow)' }}>
      <p style={{ fontSize:'12px', color:'var(--muted)', margin:'0 0 6px' }}>{label}</p>
      <p style={{ fontSize:'28px', fontWeight:400, margin:0, color: color || 'var(--text)', letterSpacing:'-0.02em' }}>{value}</p>
    </div>
  )

  const conDiag = pacientes.filter(p => p.diagnostico).length
  const promConf = conDiag > 0
    ? (pacientes.filter(p => p.confianza).reduce((s, p) => s + p.confianza, 0) / conDiag).toFixed(1)
    : '—'

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Header perfil={perfil} visitante={false} onLogout={onLogout} />
      <main style={{ flex:1, maxWidth:'1100px', width:'100%', margin:'0 auto', padding:'2.5rem 1.5rem' }}>
        <div style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontSize:'24px', fontWeight:400, letterSpacing:'-0.03em', marginBottom:'4px' }}>Dashboard</h1>
          <p style={{ fontSize:'14px', color:'var(--muted)' }}>Resumen estadístico de todos los pacientes registrados.</p>
        </div>

        {/* Métricas */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1rem', marginBottom:'2rem' }}>
          {metric('Total pacientes', pacientes.length)}
          {metric('Con diagnóstico IA', conDiag, 'var(--accent)')}
          {metric('Confianza promedio', promConf !== '—' ? `${promConf}%` : '—', '#059669')}
          {metric('Diagnóstico más frecuente', pieData.sort((a,b)=>b.value-a.value)[0]?.name || '—')}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
          {/* Distribución de diagnósticos */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', padding:'1.5rem', boxShadow:'var(--shadow)' }}>
            <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'1rem' }}>Distribución por diagnóstico</p>
            {pieData.length === 0 ? (
              <p style={{ color:'var(--muted)', fontSize:'13px', textAlign:'center', padding:'2rem' }}>Sin datos aún</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={COLORS[entry.name] || '#888'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} pacientes`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', justifyContent:'center', marginTop:'8px' }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'var(--muted)' }}>
                      <div style={{ width:'10px', height:'10px', borderRadius:'2px', background:COLORS[d.name] || '#888' }}/>
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Edad promedio por diagnóstico */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', padding:'1.5rem', boxShadow:'var(--shadow)' }}>
            <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'1rem' }}>Edad promedio por diagnóstico</p>
            {edadProm.length === 0 ? (
              <p style={{ color:'var(--muted)', fontSize:'13px', textAlign:'center', padding:'2rem' }}>Sin datos aún</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={edadProm} margin={{ left:-10 }}>
                  <XAxis dataKey="name" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} />
                  <Tooltip formatter={v => [`${v} años`, 'Edad promedio']} />
                  <Bar dataKey="promedio" fill="#2563eb" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Consultas por mes */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', padding:'1.5rem', boxShadow:'var(--shadow)' }}>
          <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'1rem' }}>Consultas por mes</p>
          {barData.length === 0 ? (
            <p style={{ color:'var(--muted)', fontSize:'13px', textAlign:'center', padding:'2rem' }}>Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ left:-10 }}>
                <XAxis dataKey="mes" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} allowDecimals={false} />
                <Tooltip formatter={v => [`${v} consultas`, 'Total']} />
                <Bar dataKey="total" fill="#2563eb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </main>
    </div>
  )
}
