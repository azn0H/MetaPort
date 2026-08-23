import { useState, useEffect } from 'react'
import { Boxes, Globe } from 'lucide-react'
import { Modal } from '../Modal'
import { ICON_MAP, GRADIENT_OPTIONS, type PortalLink } from './portalTypes'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface PortalLinkModalProps {
  isOpen: boolean
  onClose: () => void
  editingLink: PortalLink | null
  onSave: (data: {
    title: string
    description: string
    url: string
    icon: string
    gradient: string
    is_active: boolean
    is_external: boolean
  }) => Promise<void>
}

export function PortalLinkModal({
  isOpen,
  onClose,
  editingLink,
  onSave,
}: PortalLinkModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    icon: 'Globe',
    gradient: 'from-cyan-500 to-blue-600',
    is_active: true,
    is_external: true,
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (editingLink) {
      setFormData({
        title: editingLink.title,
        description: editingLink.description,
        url: editingLink.url,
        icon: editingLink.icon,
        gradient: editingLink.gradient,
        is_active: editingLink.is_active,
        is_external: editingLink.is_external,
      })
    } else {
      setFormData({
        title: '',
        description: '',
        url: '',
        icon: 'Globe',
        gradient: 'from-cyan-500 to-blue-600',
        is_active: true,
        is_external: true,
      })
    }
  }, [editingLink, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(formData)
    } finally {
      setIsSaving(false)
    }
  }

  const PreviewIcon = ICON_MAP[formData.icon] || Globe

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      title={
        <div className="flex items-center gap-2 text-white font-semibold text-base">
          <Boxes className="w-5 h-5 text-cyan-400" />
          <span>{editingLink ? 'Upravit box rozcestníku' : 'Přidat nový box'}</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-[#0d0d10]">
        {/* Live Preview Tile */}
        <div className="rounded-2xl bg-[#121215] border border-zinc-800/80 p-4 flex items-start gap-3.5 shadow-sm">
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${formData.gradient} flex items-center justify-center shadow-md shrink-0`}
          >
            <PreviewIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold text-sm">
              {formData.title || 'Název aplikace'}
            </h4>
            <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed truncate">
              {formData.description || 'Popisek aplikace zobrazený na kartě'}
            </p>
            <span className="text-[11px] text-cyan-400 block mt-1 font-mono truncate">
              {formData.url || 'https://example.com'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Název"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Nextcloud Hub"
          />
          <Input
            label="URL adresa"
            type="url"
            required
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300">Popis</label>
          <textarea
            rows={2}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-[#121215] border border-zinc-800/80 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 resize-none transition-all"
            placeholder="Krátký popis odkazu..."
          />
        </div>

        {/* Icon Selector */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-2">Ikona</label>
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-[#121215] rounded-xl border border-zinc-800">
            {Object.entries(ICON_MAP).map(([iconName, IconComp]) => {
              const isSelected = formData.icon === iconName
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: iconName })}
                  className={`p-2.5 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-sm'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={iconName}
                >
                  <IconComp className="w-4 h-4" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Gradient Theme Selector */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-2">
            Barevný přechod
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-32 overflow-y-auto p-1.5 bg-[#121215] rounded-xl border border-zinc-800">
            {GRADIENT_OPTIONS.map((grad) => {
              const isSelected = formData.gradient === grad.value
              return (
                <button
                  key={grad.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, gradient: grad.value })}
                  className={`p-2 rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500 bg-zinc-800 text-white font-semibold'
                      : 'border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${grad.class} shrink-0`} />
                  <span className="text-[11px] truncate">{grad.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Switches */}
        <div className="flex items-center gap-6 pt-1 text-xs text-zinc-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded bg-[#121215] border-zinc-800 text-cyan-500 focus:ring-0"
            />
            <span>Zobrazit na rozcestníku</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_external}
              onChange={(e) => setFormData({ ...formData, is_external: e.target.checked })}
              className="w-4 h-4 rounded bg-[#121215] border-zinc-800 text-cyan-500 focus:ring-0"
            />
            <span>Otevírat v novém okně</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/80">
          <Button variant="outline" size="md" type="button" onClick={onClose}>
            Zrušit
          </Button>
          <Button variant="magic" size="md" type="submit" isLoading={isSaving}>
            {editingLink ? 'Uložit změny' : 'Vytvořit box'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
