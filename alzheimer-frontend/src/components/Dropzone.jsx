import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

export default function Dropzone({ onFile }) {
  const [preview, setPreview] = useState(null)

  const onDrop = useCallback((accepted) => {
    const file = accepted[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onFile(file)
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        {...getRootProps()}
        style={{
          border: `1.5px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          background: isDragActive ? 'var(--accent-lt)' : 'var(--surface)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <input {...getInputProps()} />
        <div style={{
          width: '44px', height: '44px',
          borderRadius: '50%',
          background: 'var(--accent-lt)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div>
          <p style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text)' }}>
            {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra tu imagen MRI'}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
            o haz clic para seleccionar · JPG, PNG
          </p>
        </div>
      </div>

      {preview && (
        <div style={{
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          background: '#000',
          maxHeight: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={preview}
            alt="MRI preview"
            style={{ width: '100%', maxHeight: '280px', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  )
}
