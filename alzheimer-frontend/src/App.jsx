import { useState, useCallback } from 'react'
import axios from 'axios'
import Header from './components/Header'
import Dropzone from './components/Dropzone'
import ResultCard from './components/ResultCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const STATUS = {
  IDLE:     'idle',
  LOADING:  'loading',
  SUCCESS:  'success',
  ERROR:    'error',
  OFFLINE:  'offline',
}

export default function App() {
  const [file, setFile]     = useState(null)
  const [status, setStatus] = useState(STATUS.IDLE)
  const [result, setResult] = useState(null)
  const [error, setError]   = useState('')

  const handleFile = useCallback((f) => {
    setFile(f)
    setStatus(STATUS.IDLE)
    setResult(null)
    setError('')
  }, [])

  const handleAnalyze = async () => {
    if (!file) return
    setStatus(STATUS.LOADING)
    setResult(null)
    setError('')

    try {
      const form = new FormData()
      form.append('file', file)

      const { data } = await axios.post(`${API_URL}/predict`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      })

      setResult(data)
      setStatus(STATUS.SUCCESS)
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        setStatus(STATUS.OFFLINE)
        setError('El servicio de análisis no está disponible en este momento. Por favor intente más tarde.')
      } else {
        setStatus(STATUS.ERROR)
        setError(err.response?.data?.detail || 'Error al procesar la imagen.')
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{
        flex: 1,
        maxWidth: '960px',
        width: '100%',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
      }}>

        {/* Hero */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 400,
            letterSpacing: '-0.03em',
            color: 'var(--text)',
            marginBottom: '8px',
          }}>
            Análisis de imagen MRI
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', maxWidth: '480px' }}>
            Sube una imagen de resonancia magnética de cerebro para detectar y clasificar el estadio del Alzheimer mediante inteligencia artificial.
          </p>
        </div>

        {/* Layout principal */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: result ? '1fr 1fr' : '1fr',
          gap: '1.5rem',
          alignItems: 'start',
          transition: 'all 0.3s ease',
        }}>

          {/* Panel izquierdo — upload */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow)',
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '1rem',
            }}>
              Imagen de entrada
            </p>

            <Dropzone onFile={handleFile} />

            {/* Botón analizar */}
            {file && (
              <button
                onClick={handleAnalyze}
                disabled={status === STATUS.LOADING}
                style={{
                  marginTop: '1rem',
                  width: '100%',
                  padding: '10px',
                  background: status === STATUS.LOADING ? 'var(--border)' : 'var(--accent)',
                  color: status === STATUS.LOADING ? 'var(--muted)' : '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: status === STATUS.LOADING ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {status === STATUS.LOADING ? (
                  <>
                    <Spinner />
                    Analizando...
                  </>
                ) : 'Analizar imagen'}
              </button>
            )}

            {/* Error / Offline */}
            {(status === STATUS.ERROR || status === STATUS.OFFLINE) && (
              <div style={{
                marginTop: '1rem',
                padding: '12px 14px',
                background: status === STATUS.OFFLINE ? 'var(--warn-lt)' : 'var(--danger-lt)',
                border: `1px solid ${status === STATUS.OFFLINE ? '#fde68a' : '#fecaca'}`,
                borderRadius: 'var(--radius)',
                fontSize: '13px',
                color: status === STATUS.OFFLINE ? 'var(--warn)' : 'var(--danger)',
                lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Panel derecho — resultado */}
          {result && <ResultCard result={result} />}
        </div>

        {/* Info cards */}
        {!result && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginTop: '2rem',
          }}>
            {[
              { label: 'No Demencia',        color: 'var(--success)', dot: '#059669' },
              { label: 'Alzheimer Leve',      color: 'var(--warn)',    dot: '#d97706' },
              { label: 'Alzheimer Moderado',  color: '#b45309',        dot: '#ea580c' },
              { label: 'Alzheimer Avanzado',  color: 'var(--danger)',  dot: '#dc2626' },
            ].map(({ label, color, dot }) => (
              <div key={label} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <div style={{
                  width: '8px', height: '8px',
                  borderRadius: '50%',
                  background: dot,
                  flexShrink: 0,
                }}/>
                <span style={{ fontSize: '13px', color: 'var(--text)' }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
          NeuroScan AI · Solo uso clínico orientativo · No reemplaza diagnóstico médico
        </p>
      </footer>
    </div>
  )
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
      <path d="M21 12a9 9 0 00-9-9"/>
    </svg>
  )
}
