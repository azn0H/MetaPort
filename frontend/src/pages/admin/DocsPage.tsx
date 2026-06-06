import { useState, useEffect } from 'react'
import { FileText, Book, Code, Terminal, ChevronLeft, Layers } from 'lucide-react'

interface DocSummary {
  id: string
  name: string
  description: string
  tech_stack: string[]
}

interface DocDetail extends DocSummary {
  content: string
}

const API_URL = 'https://api-metaport.aznoh.cz/api/v1/docs'

const getProjectIcon = (id: string) => {
  switch (id) {
    case 'metaport': return Terminal
    case 'qrco': return Code
    case 'bookiva': return Book
    default: return FileText
  }
}

export default function DocsPage() {
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
        headers: { Authorization: `Bearer ${token}` }
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
        headers: { Authorization: `Bearer ${token}` }
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
        <button 
          onClick={() => setActiveDoc(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Zpět na přehled
        </button>

        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-8 backdrop-blur-sm">
          <div className="flex items-start gap-5 mb-8 pb-8 border-b border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <IconComponent className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{activeDoc.name}</h1>
              <p className="text-slate-400 text-lg mb-4">{activeDoc.description}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 text-slate-300 rounded-lg text-sm mr-2">
                  <Layers className="w-4 h-4" /> Stack:
                </div>
                {activeDoc.tech_stack.map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-sm font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="prose prose-invert prose-cyan max-w-none">
            <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 bg-slate-950 p-6 rounded-xl border border-slate-800">
              {activeDoc.content}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Dokumentace</h1>
        <p className="text-slate-400">Přehled architektury a konfigurace projektů</p>
      </div>

      {error && (
        <div className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900/50 border border-slate-800 p-6 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((doc) => {
            const IconComponent = getProjectIcon(doc.id)
            return (
              <button
                key={doc.id}
                onClick={() => handleOpenDoc(doc.id)}
                disabled={isDetailLoading}
                className="text-left w-full rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-1">{doc.name}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2">{doc.description}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {doc.tech_stack.slice(0, 3).map((tech) => (
                        <span key={tech} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs">
                          {tech}
                        </span>
                      ))}
                      {doc.tech_stack.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-500 text-xs">
                          +{doc.tech_stack.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}