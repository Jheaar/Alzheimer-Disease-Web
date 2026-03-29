import { useState, useCallback } from 'react'
import axios from 'axios'
import Header from '../components/Header'
import Dropzone from '../components/Dropzone'
import ResultCard from '../components/ResultCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function ConsultaRapida({ session, perfil, visitante, onLogout }) {
  const [file, setFile]     = useState(null)
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError]   = useState('')

  const handleFile = useCallback((f) => {
    setFile(f); setStatus('idle'); setResult(null); setError('')
  }, [])

  const handleAnalyze = async () => {
    if (!file) return
    setStatus('loading'); setResult(null); setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await axios.post(`${API_URL}/predict`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      })
      setResult(data); setStatus('success')
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setStatus('offline')
        setError('El servicio de análisis no está disponible en este momento.')
      } else {
        setStatus('error')
        setError(err.response?.data?.detail || 'Error al procesar la imagen.')
      }
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Header perfil={perfil} visitante={visitante} onLogout={onLogout} />
      <main style={{ flex:1, maxWidth:'960px', width:'100%', margin:'0 auto', padding:'2.5rem 1.5rem' }}>
        <div style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontSize:'24px', fontWeight:400, letterSpacing:'-0.03em', marginBottom:'6px' }}>Consulta rápida</h1>
          <p style={{ fontSize:'14px', color:'var(--muted)' }}>
            Sube una imagen MRI para obtener una predicción inmediata.
            {visitante && ' · Modo visitante — los resultados no se guardan.'}
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap:'1.5rem', alignItems:'start' }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', padding:'1.5rem', boxShadow:'var(--shadow)' }}>
            <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'1rem' }}>Imagen de entrada</p>
            <Dropzone onFile={handleFile} />
            {file && (
              <button onClick={handleAnalyze} disabled={status === 'loading'} style={{
                marginTop:'1rem', width:'100%', padding:'10px',
                background: status === 'loading' ? 'var(--border)' : 'var(--accent)',
                color: status === 'loading' ? 'var(--muted)' : '#fff',
                border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:500,
                fontFamily:'DM Sans, sans-serif', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              }}>
                {status === 'loading' ? 'Analizando...' : 'Analizar imagen'}
              </button>
            )}
            {(status === 'error' || status === 'offline') && (
              <div style={{ marginTop:'1rem', padding:'12px', background: status === 'offline' ? 'var(--warn-lt)' : 'var(--danger-lt)', borderRadius:'10px', fontSize:'13px', color: status === 'offline' ? 'var(--warn)' : 'var(--danger)' }}>
                {error}
              </div>
            )}
          </div>
          {result && <ResultCard result={result} />}
        </div>
      </main>
    </div>
  )
}
