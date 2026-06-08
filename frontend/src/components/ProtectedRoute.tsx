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
      const payload = JSON.parse(atob(token.split('.')[1]))
      
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('user_role')
        
        showToast('Platnost přihlášení vypršela. Přihlaste se prosím znovu.', 'error')
        navigate('/login', { replace: true })
      }
    } catch (e) {
      localStorage.removeItem('jwt_token')
      navigate('/login', { replace: true })
    }
  }, [token, navigate, showToast])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute