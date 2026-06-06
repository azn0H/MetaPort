import { useState, useEffect } from 'react'
import { Box, Play, Square, RefreshCw, MoreVertical, Layers, FileText, X } from 'lucide-react'
import { FilterSelect } from '../../components/FilterSelect'

interface Container {
  id: string
  name: string
  image: string
  status: string
  ports: string
  created: string
  stack: string
}

const API_URL = 'https://api-metaport.aznoh.cz/api/v1/containers'

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all')
  const [stackFilter, setStackFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Stavy pro logy a menu
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [logsContainer, setLogsContainer] = useState<Container | null>(null)
  const [logsText, setLogsText] = useState<string>('')
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  useEffect(() => {
    fetchContainers()
  }, [])

  const fetchContainers = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Nepodařilo se načíst kontejnery')

      const data = await response.json()
      setContainers(data)
    } catch (err) {
      setError('Nelze se spojit s API pro načtení kontejnerů.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`${API_URL}/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        await fetchContainers()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchLogs = async (container: Container) => {
    setActiveMenu(null) // Zavře dropdown
    setLogsContainer(container) // Otevře modal
    setIsLoadingLogs(true)
    setLogsText('')

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`${API_URL}/${container.id}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setLogsText(data.logs || 'Žádné logy k zobrazení.')
      } else {
        setLogsText('Chyba při načítání logů.')
      }
    } catch (err) {
      setLogsText('Nepodařilo se spojit s API pro načtení logů.')
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return 'bg-emerald-500'
      case 'stopped':
      case 'exited': return 'bg-rose-500'
      case 'restarting': return 'bg-amber-500'
      default: return 'bg-slate-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      case 'stopped':
      case 'exited': return 'bg-rose-500/10 text-rose-400 border-rose-500/30'
      case 'restarting': return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    }
  }

  const uniqueStacks = Array.from(new Set(containers.map((c) => c.stack))).sort()

  const filteredContainers = containers.filter((c) => {
    const passStatus = statusFilter === 'all' || 
      (statusFilter === 'running' ? c.status.toLowerCase() === 'running' : ['stopped', 'exited'].includes(c.status.toLowerCase()))
    
    const passStack = stackFilter === 'all' || c.stack === stackFilter

    return passStatus && passStack
  })

  const runningCount = containers.filter((c) => c.status.toLowerCase() === 'running').length
  const stoppedCount = containers.filter((c) => ['stopped', 'exited'].includes(c.status.toLowerCase())).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-48 h-8 bg-slate-800/50 rounded-lg animate-pulse" />
          <div className="w-40 h-5 bg-slate-800/50 rounded-lg animate-pulse" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-64 h-10 bg-slate-800/50 rounded-lg animate-pulse" />
          <div className="w-40 h-10 bg-slate-800/50 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800 p-5 backdrop-blur-sm">
              <div className="animate-pulse flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-slate-800 rounded" />
                    <div className="h-3 w-16 bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="w-6 h-6 bg-slate-800 rounded-md" />
              </div>
              <div className="space-y-3 mb-4 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-3 w-12 bg-slate-800 rounded" />
                  <div className="h-3 w-32 bg-slate-800 rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 w-12 bg-slate-800 rounded" />
                  <div className="h-3 w-24 bg-slate-800 rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-slate-800 rounded" />
                  <div className="h-3 w-20 bg-slate-800 rounded" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-6 animate-pulse">
                <div className="h-6 w-16 bg-slate-800 rounded-lg" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-slate-800 rounded-lg" />
                  <div className="h-8 w-8 bg-slate-800 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Kontejnery</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {runningCount} Běží
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {stoppedCount} Zastaveno
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {(['all', 'running', 'stopped'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === f
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <FilterSelect 
            value={stackFilter}
            onChange={setStackFilter}
            options={uniqueStacks}
            defaultLabel="All Stacks"
            icon={Layers}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredContainers.map((container) => (
          <div
            key={container.id}
            className="relative overflow-visible rounded-2xl bg-slate-900/50 border border-slate-800 p-5 backdrop-blur-sm hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                    <Box className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${getStatusColor(container.status)} border-2 border-slate-900`} />
                </div>
                <div>
                  <h3 className="text-white font-medium">{container.name}</h3>
                  <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                    <Layers className="w-3 h-3" />
                    {container.stack}
                  </p>
                </div>
              </div>
              
              {/* Zprovozněné 3 tečky s dropdownem pro Logy */}
              <div className="relative">
                <button 
                  onClick={() => setActiveMenu(activeMenu === container.id ? null : container.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {activeMenu === container.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1">
                      <button 
                        onClick={() => fetchLogs(container)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-cyan-400" />
                        Zobrazit Logy
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Image</span>
                <span className="text-slate-300 font-mono text-xs truncate max-w-[150px]" title={container.image}>{container.image}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Ports</span>
                <span className="text-slate-300 font-mono text-xs truncate max-w-[150px]" title={container.ports}>{container.ports || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-300 text-xs">{container.created}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(container.status)}`}>
                {container.status}
              </span>

              {/* Tvoje původní tlačítka na spodní liště */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAction(container.id, container.status.toLowerCase() === 'running' ? 'stop' : 'start')}
                  className={`p-2 rounded-lg transition-colors ${
                    container.status.toLowerCase() === 'running'
                      ? 'text-rose-400 hover:bg-rose-500/10'
                      : 'text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                  title={container.status.toLowerCase() === 'running' ? 'Stop' : 'Start'}
                >
                  {container.status.toLowerCase() === 'running' ? (
                    <Square className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleAction(container.id, 'restart')}
                  className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                  title="Restart"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL PRO LOGY */}
      {logsContainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">Logy: {logsContainer.name}</h2>
              </div>
              <button 
                onClick={() => setLogsContainer(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-sm text-slate-300 whitespace-pre-wrap">
              {isLoadingLogs ? (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Načítání logů...
                </div>
              ) : (
                logsText
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}