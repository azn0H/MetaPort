import { useState, useEffect } from 'react'
import { LayoutGrid, Plus } from 'lucide-react'
import UserList from '../../components/UserList'
import UserInviteForm from '../../components/UserInviteForm'
import { useToast } from '../../components/ToastProvider'
import { usePageTitle } from '../../hooks/usePageTitle'

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

  const handleDelete = async (userId: number, username: string) => {
    if (!window.confirm(`Opravdu chceš smazat uživatele ${username}?`)) return

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`https://api-metaport.aznoh.cz/api/v1/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Nepodařilo se smazat uživatele')
      
      showToast(`Uživatel ${username} byl trvale smazán.`, 'success')
      fetchUsers()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Admin panel</h1>
      </div>

      <div className="inline-flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'list' 
              ? 'bg-slate-800 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Seznam všech uživatelů
        </button>
        <button
          onClick={() => setActiveTab('invite')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'invite' 
              ? 'bg-slate-800 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Plus className="w-4 h-4" />
          Pozvat nového uživatele
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'list' ? (
          <UserList 
            users={users} 
            isLoading={isLoading} 
            error={error} 
            currentUsername={currentUsername}
            onRoleChange={handleRoleChange}
            onDelete={handleDelete}
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
    </div>
  )
}