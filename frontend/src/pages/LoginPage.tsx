import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, User, ArrowRight, ArrowLeft } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const API_URL = 'https://api-metaport.aznoh.cz'

function LoginPage() {
  usePageTitle('Přihlášení')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

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
      const response = await fetch(`${API_URL}/api/v1/auth/token`, {
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
      navigate('/admin')
    } catch (err) {
      setError('Přihlášení se nezdařilo. Zkontrolujte jméno a heslo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between p-6 selection:bg-cyan-500/20 selection:text-cyan-300">
      <header className="max-w-md w-full mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Zpět na rozcestník</span>
        </Link>
      </header>

      <div className="w-full max-w-md mx-auto my-auto py-6">
        <Card variant="bento" className="p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/80">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-200">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Přihlášení</h1>
              <p className="text-xs text-zinc-400">MetaPort Administrace</p>
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
              <div className="text-rose-400 text-xs text-center bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
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
          </form>
        </Card>
      </div>

      <footer className="text-center text-xs text-zinc-600">
        MetaPort • aznoH.cz
      </footer>
    </div>
  )
}

export default LoginPage