import { Book, Globe, Layers, PenTool } from 'lucide-react'

const apps = [
  {
    id: 1,
    title: 'Bookiva',
    description: 'Digital library and book management platform',
    icon: Book,
    url: 'https://bookiva.example.com',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 2,
    title: 'Aznoh Blog',
    description: 'Personal blog and article publishing',
    icon: PenTool,
    url: 'https://blog.aznoh.com',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 3,
    title: 'Portfolio',
    description: 'Showcase of projects and achievements',
    icon: Layers,
    url: 'https://portfolio.aznoh.com',
    gradient: 'from-orange-500 to-rose-600',
  },
  {
    id: 4,
    title: 'DevHub',
    description: 'Developer tools and resources',
    icon: Globe,
    url: 'https://devhub.aznoh.com',
    gradient: 'from-indigo-500 to-purple-600',
  },
]

function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            MetaPort
          </h1>
          <p className="text-slate-400 text-lg">
            Your gateway to all applications
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {apps.map((app) => {
            const IconComponent = app.icon
            return (
              <a
                key={app.id}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/80 hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-900/50"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                  <div className={`w-full h-full bg-gradient-to-br ${app.gradient}`} />
                </div>

                <div className="relative flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300">
                      {app.title}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {app.description}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg
                    className="w-5 h-5 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </div>
              </a>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-600 text-sm">
            MetaPort v1.0
          </p>
        </div>
      </div>
    </div>
  )
}

export default HomePage
