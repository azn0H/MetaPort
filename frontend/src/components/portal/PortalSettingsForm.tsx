import { useState } from 'react'
import { Sparkles, Save, Loader2 } from 'lucide-react'
import type { PortalSettings } from './portalTypes'
import { useToast } from '../ToastProvider'

interface PortalSettingsFormProps {
  initialSettings: PortalSettings
  apiBase: string
}

export function PortalSettingsForm({ initialSettings, apiBase }: PortalSettingsFormProps) {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<PortalSettings>(initialSettings)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const token = localStorage.getItem('jwt_token')
      const res = await fetch(`${apiBase}/api/v1/portal/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })
      if (!res.ok) throw new Error('Nepodařilo se uložit nastavení')
      showToast('Nastavení rozcestníku a verze bylo úspěšně uloženo', 'success')
    } catch (err: any) {
      showToast(err.message || 'Chyba při ukládání nastavení', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 backdrop-blur-sm shadow-xl">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-400" />
        Hlavní texty a verze systému
      </h2>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Hlavní nadpis</label>
            <input
              type="text"
              required
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="např. METAFRA"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Verze systému <span className="text-cyan-400 font-mono">(např. v1.0, v2.1)</span>
            </label>
            <input
              type="text"
              required
              value={settings.version}
              onChange={(e) => setSettings({ ...settings, version: e.target.value })}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3.5 text-cyan-300 font-mono text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="v1.0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Podtitulek / Popis</label>
            <input
              type="text"
              required
              value={settings.subtitle}
              onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Popis zobrazovaný pod logem..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Text v patičce</label>
            <input
              type="text"
              required
              value={settings.footer_text}
              onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="MetaPort {version} © {year} aznoH.cz"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-5 py-2 rounded-xl transition-all text-sm border border-slate-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-cyan-400" />}
            Uložit nastavení a verzi
          </button>
        </div>
      </form>
    </div>
  )
}
