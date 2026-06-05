import { FolderGit2, GitBranch, Clock, ExternalLink } from 'lucide-react'

const projects = [
  { id: 1, name: 'MetaPort', description: 'Application portal and management system', language: 'TypeScript', branch: 'main', lastUpdate: '2 hours ago', url: '#' },
  { id: 2, name: 'Bookiva API', description: 'Backend services for Bookiva platform', language: 'Python', branch: 'develop', lastUpdate: '1 day ago', url: '#' },
  { id: 3, name: 'Blog Frontend', description: 'Next.js blog application', language: 'TypeScript', branch: 'main', lastUpdate: '3 days ago', url: '#' },
  { id: 4, name: 'Auth Service', description: 'Authentication microservice', language: 'Go', branch: 'main', lastUpdate: '1 week ago', url: '#' },
]

const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  Python: 'bg-yellow-500',
  Go: 'bg-cyan-500',
  JavaScript: 'bg-amber-500',
}

function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Projects</h1>
        <p className="text-slate-400">View and manage your Git repositories</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm hover:border-slate-700 transition-all group"
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
                href={project.url}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{project.description}</p>

            <div className="flex items-center justify-between text-sm">
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

export default ProjectsPage
