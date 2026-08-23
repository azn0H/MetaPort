import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Globe, ArrowUpRight, ShieldCheck } from 'lucide-react'
import MetafraLogo from '@/icons/Metafra_bez_text.svg'
import { usePageTitle } from '../hooks/usePageTitle'
import { ICON_MAP } from '../components/portal/portalTypes'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { API_BASE } from '../config/api'

const defaultSettings = {
  title: 'METAFRA',
  subtitle: 'MetaPort - Rozcestník',
  version: 'v1.0',
  footer_text: 'MetaPort {version} © {year} aznoH.cz',
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-6 sm:p-10 selection:bg-cyan-500/20 selection:text-cyan-600 dark:selection:text-cyan-300">
      {/* Top Navbar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between z-10 mb-8">
        <div className="flex items-center gap-3">
          <img
            src={MetafraLogo}
            alt={settings.title || 'MetaPort'}
            className="h-8 w-auto object-contain brightness-110"
          />
          <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white hidden sm:inline">
            MetaPort
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link
            to="/admin"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <span>Administrace</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl w-full mx-auto z-10 my-auto py-8">
        <div className="text-center mb-12 space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {settings.title || 'METAFRA HUB'}
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            {settings.subtitle}
          </p>
        </div>

        {/* Bento Apps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {isLoading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/80 p-5 space-y-4 animate-pulse shadow-sm dark:shadow-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              ))
            : apps.map((app) => {
                const IconComponent = ICON_MAP[app.icon] || Globe
                return (
                  <a
                    key={app.id}
                    href={app.url}
                    target={app.is_external !== false ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/80 p-5 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/80 dark:hover:bg-[#16161d] hover:scale-[1.02] flex flex-col justify-between shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${
                          app.gradient || 'from-cyan-500 to-blue-600'
                        } flex items-center justify-center shadow-md text-white group-hover:scale-105 transition-transform duration-300`}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h2 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors truncate">
                            {app.title}
                          </h2>
                          <ArrowUpRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {app.description}
                        </p>
                      </div>
                    </div>
                  </a>
                )
              })}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center py-6 border-t border-zinc-200 dark:border-zinc-800/60 z-10 mt-8">
        <p className="text-xs text-zinc-500 font-medium">{renderedFooter}</p>
      </footer>
    </div>
  )
}

export default HomePage
