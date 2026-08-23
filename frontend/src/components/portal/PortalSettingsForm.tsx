import { useState } from 'react'
import { Save } from 'lucide-react'
import type { PortalSettings } from './portalTypes'
import { useToast } from '../ToastProvider'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
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
    <Card variant="bento" className="p-6 max-w-2xl shadow-xl">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Hlavní nadpis"
            required
            value={settings.title}
            onChange={(e) => setSettings({ ...settings, title: e.target.value })}
            placeholder="METAFRA"
          />
          <Input
            label="Verze systému"
            required
            value={settings.version}
            onChange={(e) => setSettings({ ...settings, version: e.target.value })}
            placeholder="v1.0"
          />
        </div>

        <Input
          label="Podtitulek"
          required
          value={settings.subtitle}
          onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
          placeholder="MetaPort - Rozcestník"
        />

        <Input
          label="Text patičky"
          required
          value={settings.footer_text}
          onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
          placeholder="MetaPort {version} © {year} aznoH.cz"
        />

        <div className="flex justify-end pt-3 border-t border-zinc-800">
          <Button
            type="submit"
            variant="magic"
            size="sm"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Uložit změny
          </Button>
        </div>
      </form>
    </Card>
  )
}
