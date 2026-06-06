import { useState, useEffect } from 'react'
import { FolderGit2, GitBranch, Clock,  Globe, Server, BookOpen } from 'lucide-react'

interface Project {
  id: number
  name: string
  description: string
  language: string
  branch: string
  lastUpdate: string
  git_url: string
  frontend_url?: string
  api_url?: string
  docs_url?: string
}

const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  Python: 'bg-yellow-500',
  Go: 'bg-cyan-500',
  JavaScript: 'bg-amber-500',
  HTML: 'bg-orange-500',
  CSS: 'bg-indigo-500',
}

const API_URL = 'https://api-metaport.aznoh.cz/api/v1/projects'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('jwt_token')
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error('Nepodařilo se načíst projekty')

        const data = await response.json()
        setProjects(data)
      } catch (err) {
        setError('Nelze se spojit s API pro načtení projektů.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="w-32 h-8 bg-slate-800/50 rounded-lg animate-pulse mb-2" />
          <div className="w-64 h-5 bg-slate-800/50 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-slate-900/50 border border-slate-800 p-6 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Projects</h1>
        <p className="text-slate-400">View and manage your Git repositories</p>
      </div>

      {error && (
        <div className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm hover:border-slate-700 transition-all group flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <FolderGit2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{project.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${languageColors[project.language] || 'bg-slate-500'}`} />
                    <span className="text-slate-500 text-sm">{project.language}</span>
                  </div>
                </div>
              </div>
              <a
                href={project.git_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                title="Open in GitHub"
              >
                <GitBranch className="w-5 h-5" />
              </a>
            </div>

            <p className="text-slate-400 text-sm mb-6 flex-grow">{project.description}</p>

            {/* Odkazy na specifické části projektu (vykreslí se, jen když data existují) */}
            <div className="flex flex-wrap gap-2 mb-6">
              {project.frontend_url && (
                <a href={project.frontend_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/50 rounded-lg text-xs font-medium transition-all">
                  <Globe className="w-3.5 h-3.5" /> Web
                </a>
              )}
              {project.api_url && (
                <a href={project.api_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-xs font-medium transition-all">
                  <Server className="w-3.5 h-3.5" /> API
                </a>
              )}
              {project.docs_url && (
                <a href={project.docs_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 hover:bg-purple-500/20 text-slate-300 hover:text-purple-400 border border-slate-700 hover:border-purple-500/50 rounded-lg text-xs font-medium transition-all">
                  <BookOpen className="w-3.5 h-3.5" /> Docs
                </a>
              )}
            </div>

            <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-800/50">
              <div className="flex items-center gap-1.5 text-slate-500">
                <GitBranch className="w-4 h-4" />
                <span>{project.branch}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-4 h-4" />
                <span>{project.lastUpdate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}