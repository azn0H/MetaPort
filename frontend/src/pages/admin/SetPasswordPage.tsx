import { useState, useEffect, type FormEvent } from 'react'
import { KeyRound, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function SetPasswordPage() {
  usePageTitle('Nastavení hesla')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenParam = urlParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setError('Chybí ověřovací token pozvánky.')
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků.')
      return
    }

    if (password !== confirmPassword) {
      setError('Hesla se neshodují.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('https://api-metaport.aznoh.cz/api/v1/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Nepodařilo se nastavit heslo.')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card variant="bento" className="p-8 text-center shadow-xl">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Heslo nastaveno</h1>
            <p className="text-zinc-400 text-xs mb-6">
              Nyní se můžete přihlásit do svého účtu.
            </p>
            <Link to="/login" className="block w-full">
              <Button variant="magic" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Přejít na přihlášení
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card variant="bento" className="p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/80">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Nastavení hesla</h1>
              <p className="text-zinc-400 text-xs">Aktivace nového účtu</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nové heslo"
              type="password"
              required
              disabled={!!error && !token}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimálně 8 znaků"
            />

            <Input
              label="Potvrzení hesla"
              type="password"
              required
              disabled={!!error && !token}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Zopakujte heslo"
            />

            <Button
              type="submit"
              variant="magic"
              size="lg"
              className="w-full mt-2"
              disabled={isLoading || (!!error && !token)}
              isLoading={isLoading}
            >
              Aktivovat účet
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}