const CLASS_CONFIG = {
  'No Demencia':          { color: 'var(--success)',  bg: 'var(--success-lt)', bar: '#059669' },
  'Alzheimer Leve':       { color: 'var(--warn)',     bg: 'var(--warn-lt)',    bar: '#d97706' },
  'Alzheimer Moderada':   { color: '#b45309',         bg: '#fff7ed',          bar: '#ea580c' },
  'Alzheimer Muy Leve':   { color: 'var(--danger)',   bg: 'var(--danger-lt)', bar: '#dc2626' },
}

function ProbBar({ label, value, barColor }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text)' }}>{label}</span>
        <span style={{
          fontSize: '12px',
          fontFamily: 'DM Mono, monospace',
          color: 'var(--muted)',
        }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{
        height: '4px',
        background: 'var(--border)',
        borderRadius: '99px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          background: barColor,
          borderRadius: '99px',
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }}/>
      </div>
    </div>
  )
}

export default function ResultCard({ result }) {
  const config = CLASS_CONFIG[result.class] || CLASS_CONFIG['No Demencia']

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow)',
    }}>
      {/* Resultado principal */}
      <div style={{
        background: config.bg,
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <div>
          <p style={{ fontSize: '11px', color: config.color, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Diagnóstico detectado
          </p>
          <p style={{ fontSize: '20px', fontWeight: 500, color: config.color, letterSpacing: '-0.02em' }}>
            {result.class}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', color: config.color, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Confianza
          </p>
          <p style={{ fontSize: '28px', fontWeight: 300, color: config.color, fontFamily: 'DM Mono, monospace' }}>
            {result.confidence.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Descripción */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
          {result.description}
        </p>
      </div>

      {/* Barras de probabilidad */}
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <p style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px' }}>
          Distribución de probabilidades
        </p>
        {Object.entries(result.probabilities).map(([label, value]) => (
          <ProbBar
            key={label}
            label={label}
            value={value}
            barColor={CLASS_CONFIG[label]?.bar || '#2563eb'}
          />
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{
        padding: '0.75rem 1.5rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
      }}>
        <p style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5 }}>
          Este resultado es orientativo y no reemplaza el diagnóstico de un profesional médico calificado.
        </p>
      </div>
    </div>
  )
}
