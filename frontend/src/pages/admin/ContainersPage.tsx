import { useState, useEffect } from 'react'
import { Box, Play, Square, RefreshCw, MoreVertical, Layers } from 'lucide-react'

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

function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all')
  const [stackFilter, setStackFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchContainers()
  }, [])

  const fetchContainers = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await fetchContainers()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-emerald-500'
      case 'stopped':
      case 'exited':
        return 'bg-rose-500'
      case 'restarting':
        return 'bg-amber-500'
      default:
        return 'bg-slate-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      case 'stopped':
      case 'exited':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30'
      case 'restarting':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
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
    return <div className="text-slate-400">Načítání kontejnerů z Raspberry Pi...</div>
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
              {runningCount} running
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {stoppedCount} stopped
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
          <Layers className="w-4 h-4 text-slate-500" />
          <select
            value={stackFilter}
            onChange={(e) => setStackFilter(e.target.value)}
            className="bg-slate-900/50 border border-slate-700 text-slate-300 text-sm rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 appearance-none"
          >
            <option value="all">All Stacks</option>
            {uniqueStacks.map((stack) => (
              <option key={stack} value={stack}>
                {stack}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredContainers.map((container) => (
          <div
            key={container.id}
            className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800 p-5 backdrop-blur-sm hover:border-slate-700 transition-all"
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
              <button className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
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
    </div>
  )
}

export default ContainersPage