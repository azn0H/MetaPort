export const API_BASE =
  import.meta.env.VITE_API_URL || 'https://api-metaport.aznoh.cz'

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('jwt_token')
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`

  const headers = new Headers(options.headers || {})
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401 && !url.includes('/api/v1/auth/token')) {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user_role')
    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = '/login'
    }
  }

  return response
}
