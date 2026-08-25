import { type ReactNode, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useToast } from './ToastProvider'

interface ProtectedRouteProps {
  children: ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('jwt_token')
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    if (!token) return

    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('jwt_token')
          localStorage.removeItem('user_role')
          showToast('Platnost přihlášení vypršela. Přihlaste se prosím znovu.', 'error')
          navigate('/login', { replace: true })
        }
      }
    } catch (e) {
      // Keep token if parse error occurs
    }
  }, [token, navigate, showToast])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
