import { useState, useEffect, type FormEvent } from 'react'
import { KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SetPasswordPage() {
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Heslo bylo nastaveno!</h1>
          <p className="text-slate-400 text-sm mb-6">Nyní se můžete přihlásit do svého účtu.</p>
          <a
            href="/login"
            className="block w-full text-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all text-sm"
          >
            Přejít na přihlášení
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Aktivace účtu</h1>
            <p className="text-slate-400 text-xs">Nastavte si přístupové heslo</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nové heslo</label>
            <input
              type="password"
              required
              disabled={!!error && !token}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2 px-4 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Potvrzení hesla</label>
            <input
              type="password"
              required
              disabled={!!error && !token}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2 px-4 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || (!!error && !token)}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Aktivovat účet
          </button>
        </form>
      </div>
    </div>
  )
}