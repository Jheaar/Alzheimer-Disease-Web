import { useNavigate, useLocation } from 'react-router-dom'

export default function Header({ perfil, visitante, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { path:'/consulta',  label:'Consulta rápida',    publico:true },
    { path:'/registrar', label:'Registrar paciente',  publico:false },
    { path:'/pacientes', label:'Pacientes',           publico:false },
    { path:'/dashboard', label:'Dashboard',           publico:false },
  ]

  const visibles = visitante ? navItems.filter(n => n.publico) : navItems

  return (
    <header style={{
      background:'var(--surface)', borderBottom:'1px solid var(--border)',
      padding:'0 2rem', height:'60px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      position:'sticky', top:0, zIndex:100,
    }}>
      {/* Logo — clic va al landing (fix 3) */}
      <div
        onClick={() => navigate('/')}
        style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }}
      >
        <div style={{ width:'28px', height:'28px', background:'var(--accent)', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"/>
          </svg>
        </div>
        <span style={{ fontWeight:500, letterSpacing:'-0.01em' }}>NeuroScan AI</span>
      </div>

      {/* Nav */}
      <nav style={{ display:'flex', alignItems:'center', gap:'4px' }}>
        {visibles.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)} style={{
            padding:'6px 12px', borderRadius:'6px', border:'none',
            background: location.pathname === item.path ? 'var(--accent-lt)' : 'transparent',
            color: location.pathname === item.path ? 'var(--accent)' : 'var(--muted)',
            fontSize:'13px', fontFamily:'DM Sans, sans-serif', cursor:'pointer',
            fontWeight: location.pathname === item.path ? 500 : 400,
            transition:'all 0.15s ease',
          }}>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Derecha */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        {visitante ? (
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'12px', color:'var(--muted)' }}>Modo visitante</span>
            {/* Fix 4: botón iniciar sesión va al login */}
            <button onClick={() => navigate('/login')} style={{
              padding:'6px 12px', borderRadius:'6px',
              border:'1px solid var(--border)', background:'transparent',
              color:'var(--accent)', fontSize:'12px',
              fontFamily:'DM Sans, sans-serif', cursor:'pointer',
            }}>
              Iniciar sesión
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'12px', color:'var(--muted)' }}>{perfil?.nombre || 'Médico'}</span>
            <button onClick={onLogout} style={{
              padding:'6px 12px', borderRadius:'6px',
              border:'1px solid var(--border)', background:'transparent',
              color:'var(--muted)', fontSize:'12px',
              fontFamily:'DM Sans, sans-serif', cursor:'pointer',
            }}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
