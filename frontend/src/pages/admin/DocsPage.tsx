import { FileText, Book, Code, Terminal } from 'lucide-react'

const docs = [
  { id: 1, title: 'Getting Started', description: 'Learn how to set up and configure MetaPort', icon: Book, category: 'Guide' },
  { id: 2, title: 'API Reference', description: 'Complete API documentation and endpoints', icon: Code, category: 'Reference' },
  { id: 3, title: 'Docker Setup', description: 'Configure Docker containers and compose files', icon: Terminal, category: 'Guide' },
  { id: 4, title: 'Authentication', description: 'Implement secure authentication flows', icon: FileText, category: 'Security' },
]

function DocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Documentation</h1>
        <p className="text-slate-400">Guides and references for MetaPort</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc) => {
          const IconComponent = doc.icon
          return (
            <a
              key={doc.id}
              href="#"
              className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{doc.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs">
                      {doc.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{doc.description}</p>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

export default DocsPage
