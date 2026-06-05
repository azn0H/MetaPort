import { useState } from 'react'
import { Box, Play, Square, RefreshCw, MoreVertical } from 'lucide-react'

interface Container {
  id: string
  name: string
  image: string
  status: 'running' | 'stopped' | 'restarting'
  ports: string
  created: string
}

const initialContainers: Container[] = [
  { id: 'c1a2b3', name: 'nginx-proxy', image: 'nginx:latest', status: 'running', ports: '80:80, 443:443', created: '2 days ago' },
  { id: 'd4e5f6', name: 'postgres-db', image: 'postgres:15', status: 'running', ports: '5432:5432', created: '5 days ago' },
  { id: 'g7h8i9', name: 'redis-cache', image: 'redis:alpine', status: 'running', ports: '6379:6379', created: '1 week ago' },
  { id: 'j1k2l3', name: 'api-server', image: 'node:18-alpine', status: 'stopped', ports: '3000:3000', created: '3 days ago' },
  { id: 'm4n5o6', name: 'monitoring', image: 'grafana/grafana', status: 'running', ports: '3001:3000', created: '1 day ago' },
  { id: 'p7q8r9', name: 'backup-service', image: 'restic/restic', status: 'stopped', ports: '-', created: '2 weeks ago' },
]

function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>(initialContainers)
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-emerald-500'
      case 'stopped':
        return 'bg-rose-500'
      case 'restarting':
        return 'bg-amber-500'
      default:
        return 'bg-slate-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      case 'stopped':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30'
      case 'restarting':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    }
  }

  const toggleContainer = (id: string) => {
    setContainers((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'running' ? 'stopped' : 'running' }
          : c
      )
    )
  }

  const filteredContainers = containers.filter((c) => {
    if (filter === 'all') return true
    return c.status === filter
  })

  const runningCount = containers.filter((c) => c.status === 'running').length
  const stoppedCount = containers.filter((c) => c.status === 'stopped').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Containers</h1>
          <p className="text-slate-400">Manage your Docker containers</p>
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

      <div className="flex gap-2">
        {(['all', 'running', 'stopped'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
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
                  <p className="text-slate-500 text-xs">{container.id}</p>
                </div>
              </div>
              <button className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Image</span>
                <span className="text-slate-300 font-mono text-xs">{container.image}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Ports</span>
                <span className="text-slate-300 font-mono text-xs">{container.ports}</span>
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
                  onClick={() => toggleContainer(container.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    container.status === 'running'
                      ? 'text-rose-400 hover:bg-rose-500/10'
                      : 'text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                  title={container.status === 'running' ? 'Stop' : 'Start'}
                >
                  {container.status === 'running' ? (
                    <Square className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <button
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
