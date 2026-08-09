import { useState, useEffect } from 'react'
import { Users, LayoutGrid, UserPlus, AlertTriangle, Shield, Crown, Zap } from 'lucide-react'
import UserList from '../../components/UserList'
import UserInviteForm from '../../components/UserInviteForm'
import { useToast } from '../../components/ToastProvider'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Modal } from '../../components/Modal'

interface UserData {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  role: string
}

type TabType = 'list' | 'invite'

export default function UsersPage() {
  usePageTitle('Uživatelé')
  const [activeTab, setActiveTab] = useState<TabType>('list')
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{id: number, username: string} | null>(null)
  
  const { showToast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem('jwt_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUsername(payload.sub)
      } catch (e) {}
    }
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('https://api-metaport.aznoh.cz/api/v1/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Nelze načíst uživatele')
      
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError('Chyba při načítání uživatelů')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`https://api-metaport.aznoh.cz/api/v1/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Nepodařilo se změnit roli')
      
      showToast('Role byla úspěšně změněna.', 'success')
      fetchUsers()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleDeleteClick = (userId: number, username: string) => {
    setUserToDelete({ id: userId, username })
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`https://api-metaport.aznoh.cz/api/v1/auth/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Nepodařilo se smazat uživatele')
      
      showToast(`Uživatel ${userToDelete.username} byl trvale smazán.`, 'success')
      fetchUsers()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsDeleteModalOpen(false)
      setUserToDelete(null)
    }
  }

  // Calculate quick metric stats
  const totalUsers = users.length
  const superAdminCount = users.filter(u => u.role === 'superadmin').length
  const betterAdminCount = users.filter(u => u.role === 'betteradmin').length
  const adminCount = users.filter(u => u.role === 'admin').length

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Správa uživatelů
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Admin Panel
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Přehled účtů, přístupových rolí a správa systémových uživatelů v prostředí MetaPort.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="inline-flex p-1 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-lg">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'list' 
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Seznam uživatelů</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300">
              {totalUsers}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'invite' 
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Pozvat uživatele</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 backdrop-blur-xl flex items-center justify-between shadow-lg shadow-black/10 hover:border-slate-700 transition-colors">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Celkem uživatelů</span>
            <span className="text-2xl font-bold text-white mt-1 block">{isLoading ? '—' : totalUsers}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 backdrop-blur-xl flex items-center justify-between shadow-lg shadow-black/10 hover:border-slate-700 transition-colors">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Super Admini</span>
            <span className="text-2xl font-bold text-amber-400 mt-1 block">{isLoading ? '—' : superAdminCount}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 backdrop-blur-xl flex items-center justify-between shadow-lg shadow-black/10 hover:border-slate-700 transition-colors">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Better Admini</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">{isLoading ? '—' : betterAdminCount}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 backdrop-blur-xl flex items-center justify-between shadow-lg shadow-black/10 hover:border-slate-700 transition-colors">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Standard Admini</span>
            <span className="text-2xl font-bold text-cyan-400 mt-1 block">{isLoading ? '—' : adminCount}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Shield className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Tab Content Area */}
      <div>
        {activeTab === 'list' ? (
          <UserList 
            users={users} 
            isLoading={isLoading} 
            error={error} 
            currentUsername={currentUsername}
            onRoleChange={handleRoleChange}
            onDelete={handleDeleteClick}
          />
        ) : (
          <UserInviteForm 
            onSuccess={() => {
              fetchUsers()
              setActiveTab('list')
            }} 
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        maxWidth="max-w-md"
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-white font-bold text-base">Smazat uživatele</span>
          </div>
        }
      >
        <div className="p-6 space-y-6">
          <p className="text-slate-300 text-sm leading-relaxed">
            Opravdu si přeješ trvale odstranit uživatele <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md">{userToDelete?.username}</span>? Tato akce je nevratná a uživatel ztratí přístup k administraci.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Zrušit
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-all shadow-lg shadow-rose-500/25 flex items-center gap-2"
            >
              Potvrdit smazání
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}