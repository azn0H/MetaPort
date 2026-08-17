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
      showToast('Nastavení bylo úspěšně uloženo', 'success')
    } catch (err: any) {
      showToast(err.message || 'Chyba při ukládání nastavení', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden flex flex-col lg:flex-row">
      <div className="lg:w-1/3 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-6">
          <Sparkles className="w-6 h-6 text-sky-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-3">Nastavení rozcestníku</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Zde můžete změnit texty zobrazené na úvodní stránce rozcestníku, verzi aplikace a text v zápatí.
        </p>
      </div>

      <div className="lg:w-2/3 p-6 md:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Hlavní nadpis</label>
              <input
                type="text"
                required
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 text-sm focus:outline-none focus:border-slate-600 transition-all"
                placeholder="METAFRA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Verze systému</label>
              <input
                type="text"
                required
                value={settings.version}
                onChange={(e) => setSettings({ ...settings, version: e.target.value })}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 px-4 text-sky-400 font-mono text-sm focus:outline-none focus:border-slate-600 transition-all"
                placeholder="v1.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Podtitulek</label>
            <input
              type="text"
              required
              value={settings.subtitle}
              onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 text-sm focus:outline-none focus:border-slate-600 transition-all"
              placeholder="MetaPort - Rozcestník a Raspberry Pi management dashboard"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Patička</label>
            <input
              type="text"
              required
              value={settings.footer_text}
              onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 text-sm focus:outline-none focus:border-slate-600 transition-all"
              placeholder="MetaPort {version} © {year} aznoH.cz"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-sky-600 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-sky-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Uložit změny</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
