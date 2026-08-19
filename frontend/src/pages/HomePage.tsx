import { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'
import MetafraLogo from '@/icons/Metafra_bez_text.svg'
import { usePageTitle } from '../hooks/usePageTitle'
import { ICON_MAP } from '../components/portal/portalTypes'

const API_BASE = 'https://api-metaport.aznoh.cz'

const defaultSettings = {
  title: 'METAFRA',
  subtitle: 'MetaPort - Rozcestník a Raspberry Pi management dashboard',
  version: 'v1.0',
  footer_text: 'MetaPort {version} © {year} aznoH.cz'
}

function getInitialSettings() {
  try {
    const cached = localStorage.getItem('metaport_portal_settings')
    if (cached) return JSON.parse(cached)
  } catch (e) {}
  return defaultSettings
}

function getInitialApps() {
  try {
    const cached = localStorage.getItem('metaport_portal_links')
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {}
  return null
}

function HomePage() {
  usePageTitle('Domů')

  const [settings, setSettings] = useState(getInitialSettings)
  const [apps, setApps] = useState<any[]>(() => getInitialApps() || [])
  const [isLoading, setIsLoading] = useState<boolean>(() => getInitialApps() === null)

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/portal`)
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error('Chyba při načítání portal dat')
      })
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings)
          try {
            localStorage.setItem('metaport_portal_settings', JSON.stringify(data.settings))
          } catch (e) {}
        }
        if (data.links && data.links.length > 0) {
          setApps(data.links)
          try {
            localStorage.setItem('metaport_portal_links', JSON.stringify(data.links))
          } catch (e) {}
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const currentYear = new Date().getFullYear().toString()
  const renderedFooter = settings.footer_text
    ? settings.footer_text
        .replace('{version}', settings.version || 'v1.0')
        .replace('{year}', currentYear)
    : `MetaPort ${settings.version || 'v1.0'} © ${currentYear} aznoH.cz`

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <img 
            src={MetafraLogo} 
            alt={settings.title || 'MetaPort'} 
            className="h-16 md:h-30 w-auto mx-auto mb-4" 
          />
          <p className="text-slate-400 text-lg">
            {settings.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm animate-pulse flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-800" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-5 bg-slate-800 rounded w-1/3" />
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                </div>
              </div>
            ))
          ) : (
            apps.map((app) => {
            const IconComponent = ICON_MAP[app.icon] || Globe
            return (
              <a
                key={app.id}
                href={app.url}
                target={app.is_external !== false ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/80 hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-900/50"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                  <div className={`w-full h-full bg-gradient-to-br ${app.gradient || 'from-cyan-500 to-blue-600'}`} />
                </div>

                <div className="relative flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${app.gradient || 'from-cyan-500 to-blue-600'} flex items-center justify-center shadow-lg`}>
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
          }))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-600 text-sm">
            {renderedFooter}
          </p>
        </div>
      </div>
    </div>
  )
}

export default HomePage
