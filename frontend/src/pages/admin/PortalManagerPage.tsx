import { useState, useEffect } from 'react'
import { LayoutGrid, Settings, Plus, Boxes, Loader2 } from 'lucide-react'
import { useToast } from '../../components/ToastProvider'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { PortalSettings, PortalLink } from '../../components/portal/portalTypes'
import { PortalSettingsForm } from '../../components/portal/PortalSettingsForm'
import { PortalLinkCard } from '../../components/portal/PortalLinkCard'
import { PortalLinkModal } from '../../components/portal/PortalLinkModal'

const API_BASE = 'https://api-metaport.aznoh.cz'

type TabType = 'links' | 'settings'

export default function PortalManagerPage() {
  usePageTitle('Rozcestník')
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<TabType>('links')
  const [settings, setSettings] = useState<PortalSettings | null>(null)
  const [links, setLinks] = useState<PortalLink[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<PortalLink | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('jwt_token')
      const res = await fetch(`${API_BASE}/api/v1/portal/admin`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Nepodařilo se načíst data')
      const data = await res.json()
      setSettings(data.settings)
      setLinks(data.links)
      try {
        localStorage.setItem('metaport_portal_settings', JSON.stringify(data.settings))
        localStorage.setItem('metaport_portal_links', JSON.stringify(data.links.filter((l: PortalLink) => l.is_active)))
      } catch (e) {}
    } catch (err: any) {
      showToast(err.message || 'Chyba při načítání dat', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenAdd = () => {
    setEditingLink(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (link: PortalLink) => {
    setEditingLink(link)
    setIsModalOpen(true)
  }

  const handleSaveLink = async (formData: {
    title: string
    description: string
    url: string
    icon: string
    gradient: string
    is_active: boolean
    is_external: boolean
  }) => {
    try {
      const token = localStorage.getItem('jwt_token')
      if (editingLink) {
        const res = await fetch(`${API_BASE}/api/v1/portal/links/${editingLink.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Nepodařilo se upravit box')
        showToast('Box byl úspěšně upraven', 'success')
      } else {
        const res = await fetch(`${API_BASE}/api/v1/portal/links`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ ...formData, order: links.length + 1 })
        })
        if (!res.ok) throw new Error('Nepodařilo se vytvořit box')
        showToast('Nový box byl úspěšně přidán', 'success')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) {
      showToast(err.message || 'Chyba při ukládání boxu', 'error')
      throw err
    }
  }

  const handleDeleteLink = async (id: number, title: string) => {
    if (!confirm(`Opravdu chcete smazat box "${title}"?`)) return
    try {
      const token = localStorage.getItem('jwt_token')
      const res = await fetch(`${API_BASE}/api/v1/portal/links/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Nepodařilo se smazat box')
      showToast('Box byl smazán', 'success')
      setLinks(links.filter((l) => l.id !== id))
    } catch (err: any) {
      showToast(err.message || 'Chyba při mazání boxu', 'error')
    }
  }

  const handleToggleActive = async (link: PortalLink) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const updatedActive = !link.is_active
      const res = await fetch(`${API_BASE}/api/v1/portal/links/${link.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: updatedActive })
      })
      if (!res.ok) throw new Error('Nepodařilo se změnit stav')
      setLinks(links.map((l) => (l.id === link.id ? { ...l, is_active: updatedActive } : l)))
      showToast(updatedActive ? 'Box je aktivní' : 'Box byl skryt', 'success')
    } catch (err: any) {
      showToast(err.message || 'Chyba při změně stavu', 'error')
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= links.length) return

    const newLinks = [...links]
    const temp = newLinks[index]
    newLinks[index] = newLinks[targetIndex]
    newLinks[targetIndex] = temp

    const updatedWithOrder = newLinks.map((item, idx) => ({ ...item, order: idx + 1 }))
    setLinks(updatedWithOrder)
    try {
      localStorage.setItem('metaport_portal_links', JSON.stringify(updatedWithOrder.filter((l) => l.is_active)))
    } catch (e) {}

    try {
      const token = localStorage.getItem('jwt_token')
      await fetch(`${API_BASE}/api/v1/portal/links/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedWithOrder.map((l) => ({ id: l.id, order: l.order })))
      })
    } catch (e) {}
  }

  if (isLoading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm">Načítání rozcestníku...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Rozcestník</h1>
          <p className="text-slate-400 text-sm">
            Správa odkazů a globálního nastavení úvodní stránky
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('links')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'links'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Odkazy ({links.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Nastavení & verze</span>
            </button>
          </div>

          {activeTab === 'links' && (
            <button
              onClick={handleOpenAdd}
              className="bg-sky-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-sky-500 transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Přidat box</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'links' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.map((link, index) => (
              <PortalLinkCard
                key={link.id}
                link={link}
                index={index}
                totalCount={links.length}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteLink}
                onToggleActive={handleToggleActive}
                onMove={handleMove}
              />
            ))}
          </div>

          {links.length === 0 && (
            <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-slate-800">
              <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Zatím zde nejsou žádné odkazy</p>
              <p className="text-slate-500 text-xs mt-1">Klikněte na "Přidat box" pro vytvoření nového odkazu.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <PortalSettingsForm
          initialSettings={settings}
          apiBase={API_BASE}
        />
      )}

      <PortalLinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingLink={editingLink}
        onSave={handleSaveLink}
      />
    </div>
  )
}
