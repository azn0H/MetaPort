import { useState, useEffect } from 'react'
import { FileText, Book, Code, Terminal, ChevronLeft, Layers, ArrowRight } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ProjectCardSkeleton } from '../../components/ui/Skeleton'
import { API_BASE } from '../../config/api'

interface DocSummary {
  id: string
  name: string
  description: string
  tech_stack: string[]
}

interface DocDetail extends DocSummary {
  content: string
}

const API_URL = `${API_BASE}/api/v1/docs`

const getProjectIcon = (id: string) => {
  switch (id) {
    case 'metaport':
      return Terminal
    case 'qrco':
      return Code
    case 'bookiva':
      return Book
    default:
      return FileText
  }
}

export default function DocsPage() {
  usePageTitle('Dokumentace')

  const [projects, setProjects] = useState<DocSummary[]>([])
  const [activeDoc, setActiveDoc] = useState<DocDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Nepodařilo se načíst dokumentace')
      const data = await response.json()
      setProjects(data)
    } catch (err) {
      setError('Nelze se spojit s API.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDoc = async (id: string) => {
    setIsDetailLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Nepodařilo se načíst detail dokumentace')
      const data = await response.json()
      setActiveDoc(data)
    } catch (err) {
      setError('Nepodařilo se načíst obsah dokumentace.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  if (activeDoc) {
    const IconComponent = getProjectIcon(activeDoc.id)
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          onClick={() => setActiveDoc(null)}
        >
          Zpět na přehled dokumentací
        </Button>

        <Card variant="bento" className="p-6 md:p-8">
          <div className="flex items-start gap-5 mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800/80">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <IconComponent className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                {activeDoc.name}
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{activeDoc.description}</p>

              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-zinc-500 flex items-center gap-1 mr-1">
                  <Layers className="w-3.5 h-3.5" /> Stack:
                </span>
                {activeDoc.tech_stack.map((tech) => (
                  <Badge key={tech} variant="cyan" size="sm">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <pre className="whitespace-pre-wrap font-mono text-xs md:text-sm text-zinc-800 dark:text-zinc-300 bg-zinc-50 dark:bg-[#09090b] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 leading-relaxed overflow-x-auto selection:bg-cyan-500/30">
              {activeDoc.content}
            </pre>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Dokumentace</h1>
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
          {[1, 2].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((doc) => {
            const IconComponent = getProjectIcon(doc.id)
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => handleOpenDoc(doc.id)}
                disabled={isDetailLoading}
                className="text-left w-full rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/80 p-6 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-[#16161c] transition-all duration-200 group cursor-pointer flex flex-col justify-between shadow-xs dark:shadow-sm"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md text-white shrink-0 group-hover:scale-105 transition-transform">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                        {doc.name}
                      </h3>
                      <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {doc.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-zinc-200 dark:border-zinc-800/60">
                  {doc.tech_stack.slice(0, 4).map((tech) => (
                    <Badge key={tech} variant="zinc" size="sm">
                      {tech}
                    </Badge>
                  ))}
                  {doc.tech_stack.length > 4 && (
                    <Badge variant="zinc" size="sm">
                      +{doc.tech_stack.length - 4}
                    </Badge>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}