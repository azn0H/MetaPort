import { useState, useEffect } from 'react'
import { FolderGit2, GitBranch, Clock, Globe, Server, BookOpen } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ProjectCardSkeleton } from '../../components/ui/Skeleton'
import { API_BASE } from '../../config/api'

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

const languageColors: Record<string, { dot: string; text: string }> = {
  TypeScript: { dot: 'bg-blue-400', text: 'text-blue-400' },
  Python: { dot: 'bg-emerald-400', text: 'text-emerald-400' },
  JavaScript: { dot: 'bg-amber-400', text: 'text-amber-400' },
  HTML: { dot: 'bg-orange-400', text: 'text-orange-400' },
  CSS: { dot: 'bg-indigo-400', text: 'text-indigo-400' },
}

const API_URL = `${API_BASE}/api/v1/projects`

export default function ProjectsPage() {
  usePageTitle('Projekty')

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Projekty</h1>
            <Badge variant="zinc">{projects.length}</Badge>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-rose-600 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card variant="bento" className="p-12 text-center">
          <FolderGit2 className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">Žádné projekty</h3>
          <p className="text-xs text-zinc-500 mt-1">Nebyly nalezeny žádné nakonfigurované projekty.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => {
            const lang = languageColors[project.language] || {
              dot: 'bg-zinc-400',
              text: 'text-zinc-400',
            }

            return (
              <Card
                key={project.id}
                variant="bento"
                hover
                className="p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Top */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md text-white shrink-0">
                        <FolderGit2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${lang.dot}`} />
                          <span className={`text-xs font-semibold ${lang.text}`}>
                            {project.language}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={project.git_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                      title="Otevřít GitHub repozitář"
                    >
                      <GitBranch className="w-4 h-4" />
                    </a>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                    {project.description}
                  </p>

                  {/* Endpoints Links */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.frontend_url && (
                      <a
                        href={project.frontend_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-[#18181b] hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-cyan-600 dark:hover:text-cyan-400 border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/30 rounded-xl text-xs font-medium transition-all"
                      >
                        <Globe className="w-3.5 h-3.5 text-cyan-400" /> Web
                      </a>
                    )}
                    {project.api_url && (
                      <a
                        href={project.api_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-emerald-400 border border-zinc-800 hover:border-emerald-500/30 rounded-xl text-xs font-medium transition-all"
                      >
                        <Server className="w-3.5 h-3.5 text-emerald-400" /> API
                      </a>
                    )}
                    {project.docs_url && (
                      <a
                        href={project.docs_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-purple-400 border border-zinc-800 hover:border-purple-500/30 rounded-xl text-xs font-medium transition-all"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Docs
                      </a>
                    )}
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-xs pt-4 border-t border-zinc-800/80 text-zinc-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-zinc-600" />
                    <span>{project.branch}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-600" />
                    <span>{project.lastUpdate}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}