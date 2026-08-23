import { useState, useMemo } from 'react'
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Box,
  FolderGit2,
  FileText,
  LogOut,
  Menu,
  X,
  Settings,
  Compass,
  Terminal,
  FolderTree,
  ExternalLink,
} from 'lucide-react'
import MetafraLogo from '@/icons/Metafra_bez_text.svg'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'

interface NavSection {
  title: string
  items: {
    path: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    allowedRoles: string[]
  }[]
}

const navSections: NavSection[] = [
  {
    title: 'PŘEHLED',
    items: [
      {
        path: '/admin/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        allowedRoles: ['admin', 'betteradmin', 'superadmin'],
      },
    ],
  },
  {
    title: 'SPRÁVA',
    items: [
      {
        path: '/admin/containers',
        label: 'Kontejnery',
        icon: Box,
        allowedRoles: ['admin', 'betteradmin', 'superadmin'],
      },
      {
        path: '/admin/projects',
        label: 'Projekty',
        icon: FolderGit2,
        allowedRoles: ['admin', 'betteradmin', 'superadmin'],
      },
      {
        path: '/admin/portal',
        label: 'Rozcestník',
        icon: Compass,
        allowedRoles: ['admin', 'betteradmin', 'superadmin'],
      },
      {
        path: '/admin/files',
        label: 'Správce souborů',
        icon: FolderTree,
        allowedRoles: ['betteradmin', 'superadmin'],
      },
      {
        path: '/admin/docs',
        label: 'Dokumentace',
        icon: FileText,
        allowedRoles: ['admin', 'betteradmin', 'superadmin'],
      },
    ],
  },
  {
    title: 'SYSTÉM & ADMIN',
    items: [
      {
        path: '/admin/console',
        label: 'Konzole',
        icon: Terminal,
        allowedRoles: ['betteradmin', 'superadmin'],
      },
      {
        path: '/admin/users',
        label: 'Admin Panel',
        icon: Settings,
        allowedRoles: ['superadmin'],
      },
    ],
  },
]

const pathToTitle: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/dashboard': 'Dashboard',
  '/admin/containers': 'Kontejnery',
  '/admin/projects': 'Projekty',
  '/admin/portal': 'Rozcestník',
  '/admin/files': 'Správce souborů',
  '/admin/docs': 'Dokumentace',
  '/admin/console': 'Konzole',
  '/admin/users': 'Admin Panel',
}

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { userRole, username } = useMemo(() => {
    try {
      const token = localStorage.getItem('jwt_token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return {
          userRole: payload.role || localStorage.getItem('user_role') || 'admin',
          username: payload.sub || 'Admin',
        }
      }
    } catch (e) {}
    return {
      userRole: localStorage.getItem('user_role') || 'admin',
      username: 'Admin',
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user_role')
    navigate('/')
  }

  const closeSidebar = () => setIsSidebarOpen(false)

  const currentLabel = pathToTitle[location.pathname] || 'Dashboard'

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* KokonutUI Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0c0d12]/95 border-r border-zinc-800/80 flex flex-col backdrop-blur-xl transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header: Logo Only */}
        <div className="h-16 px-5 border-b border-zinc-800/80 flex items-center justify-between">
          <Link
            to="/admin"
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <img
              src={MetafraLogo}
              alt="METAFRA Logo"
              className="h-8 w-auto object-contain brightness-110"
            />
          </Link>

          <button
            onClick={closeSidebar}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) =>
              item.allowedRoles.includes(userRole)
            )
            if (visibleItems.length === 0) return null

            return (
              <div key={section.title} className="space-y-1">
                <span className="px-3 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                  {section.title}
                </span>
                <ul className="space-y-0.5 mt-1">
                  {visibleItems.map((item) => {
                    const IconComponent = item.icon
                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={closeSidebar}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                              isActive
                                ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                            }`
                          }
                        >
                          <IconComponent className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/30 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-200 truncate">
                {username}
              </span>
              <span className="text-[10px] text-zinc-400 capitalize truncate">
                {userRole}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all w-full border border-transparent hover:border-rose-500/20 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Odhlásit se</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#09090b]/80 border-b border-zinc-800/80 flex items-center justify-between px-4 lg:px-8 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/60 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Breadcrumbs
              items={[
                { label: 'metaport', href: '/admin/dashboard' },
                { label: currentLabel },
              ]}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Public Portal Link */}
            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold transition-colors"
              title="Otevřít veřejný rozcestník"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline">Veřejný portál</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout