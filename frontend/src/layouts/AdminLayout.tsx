import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Box, FolderGit2, FileText, LogOut, Activity, Menu, X, Settings } from 'lucide-react'
import MetafraLogo from '@/icons/Metafra_bez_text.svg'
import { Link } from 'react-router-dom'

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/containers', label: 'Kontejnery', icon: Box },
  { path: '/admin/projects', label: 'Projekty', icon: FolderGit2 },
  { path: '/admin/docs', label: 'Dokumentace', icon: FileText },
  { path: '/admin/console', label: 'Konzole', icon: Activity },
  { path: '/admin/users', label: 'Správa uživatelů', icon: Settings },
  { path: '/admin/files', label: 'Správa souborů', icon: FileText }
]

function AdminLayout() {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('jwt_token')
    navigate('/')
  }

  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={closeSidebar}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col backdrop-blur-md transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className=" border-b border-slate-800 flex items-center justify-between h-20">
          <Link to="/admin" className="flex items-center h-full px-2 hover:opacity-80 transition-opacity">
            <img 
              src={MetafraLogo} 
              alt="Metafra Logo" 
              className="w-50 h-auto object-contain ml-2" 
            />
          </Link>
          
          <button 
            onClick={closeSidebar} 
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const IconComponent = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <IconComponent className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            Odhlásit se
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-900/30 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">System Status</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout