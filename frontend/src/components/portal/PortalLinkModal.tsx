import { useState, useEffect } from 'react'
import { Boxes, Globe, Loader2 } from 'lucide-react'
import { Modal } from '../Modal'
import { ICON_MAP, GRADIENT_OPTIONS, type PortalLink } from './portalTypes'

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
  onSave
}: PortalLinkModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    icon: 'Globe',
    gradient: 'from-cyan-500 to-blue-600',
    is_active: true,
    is_external: true
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
        is_external: editingLink.is_external
      })
    } else {
      setFormData({
        title: '',
        description: '',
        url: '',
        icon: 'Globe',
        gradient: 'from-cyan-500 to-blue-600',
        is_active: true,
        is_external: true
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
      <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-slate-900">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Živý náhled boxu</label>
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${formData.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
              <PreviewIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm">
                {formData.title || 'Název aplikace / odkazu'}
              </h4>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                {formData.description || 'Popisek aplikace zobrazený pod názvem'}
              </p>
              <span className="text-[11px] text-cyan-400/80 block mt-1">
                {formData.url || 'https://example.com'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Název boxu</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="např. TaskApp"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Cílová URL adresa</label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Popis</label>
          <textarea
            rows={2}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            placeholder="Krátký popis odkazu / nástroje..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Výběr ikony</label>
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-950/30 rounded-xl border border-slate-800/50">
            {Object.entries(ICON_MAP).map(([iconName, IconComp]) => {
              const isSelected = formData.icon === iconName
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: iconName })}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20 scale-105'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title={iconName}
                >
                  <IconComp className="w-5 h-5" />
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Barevný přechod</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-32 overflow-y-auto p-1 bg-slate-950/30 rounded-xl border border-slate-800/50">
            {GRADIENT_OPTIONS.map((grad) => {
              const isSelected = formData.gradient === grad.value
              return (
                <button
                  key={grad.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, gradient: grad.value })}
                  className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'border-white bg-slate-800 text-white font-medium'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${grad.class} flex-shrink-0 shadow`} />
                  <span className="text-[11px] truncate">{grad.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500/30"
            />
            <span>Zobrazit na rozcestníku</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={formData.is_external}
              onChange={(e) => setFormData({ ...formData, is_external: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500/30"
            />
            <span>Otevírat v novém okně (_blank)</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors"
          >
            Zrušit
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium px-5 py-2 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{editingLink ? 'Uložit změny' : 'Vytvořit box'}</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
