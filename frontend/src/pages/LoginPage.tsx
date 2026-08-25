import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, User, ArrowRight, ArrowLeft } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { API_BASE } from '../config/api'

function LoginPage() {
  usePageTitle('Přihlášení')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash
    const search = window.location.search
    if (!hash && !search) return

    const params = new URLSearchParams(hash ? hash.substring(1) : search)

    const errorParam = params.get('error') || params.get('error_description')
    if (errorParam) {
      setError(decodeURIComponent(params.get('error_description') || errorParam))
      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }

    const rawToken = params.get('id_token') || params.get('access_token') || params.get('code')

    if (rawToken) {
      window.history.replaceState({}, document.title, window.location.pathname)
      setIsLoading(true)

      fetch(`${API_BASE}/api/v1/auth/sso`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: rawToken }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}))
            throw new Error(errData.detail || 'Přihlášení přes Vortex SSO se nezdařilo')
          }
          return res.json()
        })
        .then((data) => {
          localStorage.setItem('jwt_token', data.access_token)
          localStorage.setItem('user_role', data.role)
          navigate('/admin/dashboard', { replace: true })
        })
        .catch((err) => {
          setError(err.message || 'Chyba při ověřování SSO přihlášení')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email || !password) {
      setError('Zadejte prosím e-mail i heslo')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Neplatné přihlašovací údaje')
      }

      const data = await response.json()
      localStorage.setItem('jwt_token', data.access_token)
      localStorage.setItem('user_role', data.role)
      navigate('/admin/dashboard')
    } catch (err) {
      setError('Přihlášení se nezdařilo. Zkontrolujte jméno a heslo.')
    } finally {
      setIsLoading(false)
    }
  }

  const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36)
  const ssoUrl = `https://auth.aznoh.cz/application/o/authorize/?client_id=kcTkisBmdXcInUHLF3nYFfjyn9o5frSt4tJRMnsW&response_type=id_token%20token&scope=openid%20profile%20email%20roles&redirect_uri=https%3A%2F%2Fmetaport.aznoh.cz%2Flogin&nonce=${nonce}`

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-6 selection:bg-cyan-500/20 selection:text-cyan-600 dark:selection:text-cyan-300">
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Zpět na rozcestník</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="w-full max-w-md mx-auto my-auto py-6">
        <Card variant="bento" className="p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Přihlášení</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">MetaPort Administrace</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail nebo uživatel"
              type="text"
              required
              leftIcon={<User className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aznoh.cz"
            />

            <Input
              label="Heslo"
              type="password"
              required
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {error && (
              <div className="text-rose-600 dark:text-rose-400 text-xs text-center bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="magic"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Přihlásit se
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500 font-medium">nebo</span>
              </div>
            </div>

            <a
              href={ssoUrl}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 transition-colors text-sm shadow-md text-center"
            >
              Přihlásit se přes Vortex SSO
            </a>
          </form>
        </Card>
      </div>

      <footer className="text-center text-xs text-zinc-500 dark:text-zinc-600">
        MetaPort • aznoH.cz
      </footer>
    </div>
  )
}

export default LoginPage
