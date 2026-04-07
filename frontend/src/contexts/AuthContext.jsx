import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        localStorage.removeItem('token')
      }
    } catch (error) {
      console.error('Error verificando auth:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      console.log('🔐 Intentando login...', { username, passwordLength: password?.length })
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      console.log('📡 Respuesta recibida:', response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error de conexión' }))
        throw new Error(error.error || 'Error al iniciar sesión')
      }

      const data = await response.json()
      console.log('✅ Login exitoso')
      localStorage.setItem('token', data.token)
      setUser(data.user)
      navigate('/')
    } catch (error) {
      console.error('❌ Error completo en login:', error)
      // Crear mensaje de error más detallado
      const errorMsg = error.message || 'Error desconocido'
      const errorType = error.name || 'Error'
      const fullError = `${errorType}: ${errorMsg}`
      
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error(`Error de red: No se puede conectar al servidor. Verifica que el backend esté ejecutándose y accesible. Detalles: ${error.message}`)
      }
      
      throw new Error(fullError)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  const changePassword = async (oldPassword, newPassword) => {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ oldPassword, newPassword })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al cambiar contraseña')
    }

    return response.json()
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
