import { useState, useEffect } from 'react'
import { LayoutGrid, UserPlus, AlertTriangle } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Admin panel</h1>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'list' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Seznam všech uživatelů</span>
          </button>
          
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'invite' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Pozvat nového uživatele</span>
          </button>
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
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-white font-semibold text-base">Smazat uživatele</span>
          </div>
        }
      >
        <div className="p-6 space-y-6">
          <p className="text-slate-300 text-sm leading-relaxed">
            Opravdu si přeješ trvale odstranit uživatele <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">{userToDelete?.username}</span>? Tato akce je nevratná.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Zrušit
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors shadow-sm"
            >
              Smazat
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
