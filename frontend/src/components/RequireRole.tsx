import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

interface RequireRoleProps {
  children: ReactNode
  allowedRoles: string[]
}

export default function RequireRole({ children, allowedRoles }: RequireRoleProps) {
  let userRole = 'admin'

  try {
    const token = localStorage.getItem('jwt_token')
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userRole = payload.role || localStorage.getItem('user_role') || 'admin'
    }
  } catch (e) {
    console.error('Chyba při čtení role', e)
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}