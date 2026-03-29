import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ConsultaRapida from './pages/ConsultaRapida'
import RegistrarPaciente from './pages/RegistrarPaciente'
import ListaPacientes from './pages/ListaPacientes'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [session, setSession]     = useState(null)
  const [perfil, setPerfil]       = useState(null)
  const [visitante, setVisitante] = useState(false)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) fetchPerfil(data.session.user.id)
      else setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) fetchPerfil(session.user.id)
      else { setPerfil(null); setLoading(false) }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchPerfil(userId) {
    const { data } = await supabase.from('perfiles').select('*').eq('id', userId).single()
    setPerfil(data)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setVisitante(false)
    window.location.href = '/login'
  }

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'var(--muted)', fontSize:'14px' }}>Cargando...</p>
    </div>
  )

  const esMedico    = !!session && !visitante
  const esVisitante = visitante || !session

  return (
    <BrowserRouter>
      <Routes>
        {/* Página principal: landing */}
        <Route path="/" element={<Landing />} />

        {/* Login */}
        <Route path="/login" element={
          (session || visitante)
            ? <Navigate to="/consulta" replace />
            : <Login onVisitante={() => setVisitante(true)} />
        }/>

        {/* Consulta rápida — accesible para todos */}
        <Route path="/consulta" element={
          <ConsultaRapida session={session} perfil={perfil} visitante={esVisitante} onLogout={handleLogout} />
        }/>

        {/* Solo médicos */}
        <Route path="/registrar" element={
          esMedico ? <RegistrarPaciente session={session} perfil={perfil} onLogout={handleLogout} /> : <Navigate to="/login" replace />
        }/>
        <Route path="/pacientes" element={
          esMedico ? <ListaPacientes session={session} perfil={perfil} onLogout={handleLogout} /> : <Navigate to="/login" replace />
        }/>
        <Route path="/dashboard" element={
          esMedico ? <Dashboard session={session} perfil={perfil} onLogout={handleLogout} /> : <Navigate to="/login" replace />
        }/>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
