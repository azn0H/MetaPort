import { useState, useEffect } from 'react'
import { Box, Play, Square, RefreshCw, Layers, FileText } from 'lucide-react'
import { FilterSelect } from '../../components/FilterSelect'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Modal } from '../../components/Modal'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge, Badge } from '../../components/ui/Badge'
import { SearchInput } from '../../components/ui/Input'
import { ContainerCardSkeleton } from '../../components/ui/Skeleton'
import { API_BASE } from '../../config/api'

interface Container {
  id: string
  name: string
  image: string
  status: string
  ports: string
  created: string
  stack: string
}

const API_URL = `${API_BASE}/api/v1/containers`

export default function ContainersPage() {
  usePageTitle('Kontejnery')

  const [containers, setContainers] = useState<Container[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all')
  const [stackFilter, setStackFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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
    setLogsContainer(container)
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

  const uniqueStacks = Array.from(new Set(containers.map((c) => c.stack))).sort()

  const filteredContainers = containers.filter((c) => {
    const passStatus =
      statusFilter === 'all' ||
      (statusFilter === 'running'
        ? c.status.toLowerCase() === 'running'
        : ['stopped', 'exited'].includes(c.status.toLowerCase()))

    const passStack = stackFilter === 'all' || c.stack === stackFilter
    const passSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.image.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.stack.toLowerCase().includes(searchQuery.toLowerCase())

    return passStatus && passStack && passSearch
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Kontejnery</h1>
          <Badge variant="zinc">{containers.length}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="dark"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={fetchContainers}
          >
            Obnovit
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-rose-600 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4">
          {error}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="inline-flex p-1 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
            {(['all', 'running', 'stopped'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === f
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs border border-zinc-300/80 dark:border-zinc-700/60'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {f === 'all' ? 'Všechny' : f === 'running' ? 'Běžící' : 'Zastavené'}
              </button>
            ))}
          </div>

          <FilterSelect
            value={stackFilter}
            onChange={setStackFilter}
            options={uniqueStacks}
            defaultLabel="Všechny Stacks"
            icon={Layers}
          />
        </div>

        <SearchInput
          placeholder="Hledat kontejner nebo image..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Container Cards Bento Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ContainerCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredContainers.length === 0 ? (
        <Card variant="bento" className="p-12 text-center">
          <Box className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">Nebyly nalezeny žádné kontejnery</h3>
          <p className="text-xs text-zinc-500 mt-1">Zkuste upravit filtry nebo hledaný výraz.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContainers.map((container) => {
            const isRunning = container.status.toLowerCase() === 'running'

            return (
              <Card
                key={container.id}
                variant="bento"
                hover
                className="p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl ${
                          isRunning
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-400'
                        } flex items-center justify-center shrink-0 shadow-sm`}
                      >
                        <Box className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate" title={container.name}>
                          {container.name}
                        </h3>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Layers className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                          {container.stack || 'standalone'}
                        </span>
                      </div>
                    </div>

                    <StatusBadge status={container.status} />
                  </div>

                  {/* Metadata Specs */}
                  <div className="space-y-2 py-2 border-t border-b border-zinc-200 dark:border-zinc-800/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Image</span>
                      <span
                        className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px] truncate max-w-[170px]"
                        title={container.image}
                      >
                        {container.image}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Porty</span>
                      <span
                        className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px] truncate max-w-[170px]"
                        title={container.ports}
                      >
                        {container.ports || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Vytvořeno</span>
                      <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">{container.created}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-between pt-4 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<FileText className="w-3.5 h-3.5 text-cyan-400" />}
                    onClick={() => fetchLogs(container)}
                  >
                    Logy
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant={isRunning ? 'danger' : 'dark'}
                      size="sm"
                      onClick={() =>
                        handleAction(container.id, isRunning ? 'stop' : 'start')
                      }
                      title={isRunning ? 'Zastavit' : 'Spustit'}
                    >
                      {isRunning ? (
                        <Square className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </Button>
                    <Button
                      variant="dark"
                      size="sm"
                      onClick={() => handleAction(container.id, 'restart')}
                      title="Restartovat kontejner"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Logs Modal */}
      <Modal
        isOpen={!!logsContainer}
        onClose={() => setLogsContainer(null)}
        maxWidth="max-w-4xl"
        title={
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Kontejnerové logy: {logsContainer?.name}</span>
          </div>
        }
      >
        <div className="p-4 bg-[#09090b] font-mono text-xs text-zinc-300 whitespace-pre-wrap max-h-[60vh] overflow-y-auto leading-relaxed border-t border-zinc-800/80 selection:bg-cyan-500/30">
          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan-400" /> Načítání logů...
            </div>
          ) : (
            logsText
          )}
        </div>
      </Modal>
    </div>
  )
}