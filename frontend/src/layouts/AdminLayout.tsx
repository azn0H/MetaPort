import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Box, FolderGit2, FileText, LogOut, Activity } from 'lucide-react'

const navItems = [
  { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/containers', label: 'Containers', icon: Box },
  { path: '/admin/projects', label: 'Projects', icon: FolderGit2 },
  { path: '/admin/docs', label: 'Documentation', icon: FileText },
]

function AdminLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('jwt_token')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white">MetaPort</h1>
          <p className="text-slate-500 text-sm mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const IconComponent = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
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
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-slate-900/30 border-b border-slate-800 flex items-center justify-between px-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Activity className="w-4 h-4" />
            <span>System Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-emerald-400">All systems operational</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
