import { useState, useEffect } from 'react'
import { UserPlus, AlertTriangle } from 'lucide-react'
import UserList from '../../components/UserList'
import UserInviteForm from '../../components/UserInviteForm'
import { useToast } from '../../components/ToastProvider'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Modal } from '../../components/Modal'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

interface UserData {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  role: string
}

export default function UsersPage() {
  usePageTitle('Uživatelé')
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{ id: number; username: string } | null>(null)

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
          Authorization: `Bearer ${token}`,
        },
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
      const response = await fetch(
        `https://api-metaport.aznoh.cz/api/v1/auth/users/${userId}/role`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      )

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
      const response = await fetch(
        `https://api-metaport.aznoh.cz/api/v1/auth/users/${userToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

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
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Uživatelé</h1>
          <Badge variant="zinc">{users.length}</Badge>
        </div>

        <Button
          variant="magic"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsInviteModalOpen(true)}
        >
          Pozvat uživatele
        </Button>
      </div>

      {/* Main User List */}
      <UserList
        users={users}
        isLoading={isLoading}
        error={error}
        currentUsername={currentUsername}
        onRoleChange={handleRoleChange}
        onDelete={handleDeleteClick}
      />

      {/* Invite User Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        maxWidth="max-w-lg"
        title={
          <div className="flex items-center gap-2 text-white">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            <span>Pozvat nového uživatele</span>
          </div>
        }
      >
        <UserInviteForm
          onSuccess={() => {
            fetchUsers()
            setIsInviteModalOpen(false)
          }}
          onCancel={() => setIsInviteModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        maxWidth="max-w-md"
        title={
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <span>Smazat uživatele</span>
          </div>
        }
      >
        <div className="p-6 space-y-5 bg-[#0d0d10]">
          <p className="text-zinc-300 text-xs leading-relaxed">
            Opravdu si přeješ trvale odstranit uživatele{' '}
            <span className="font-bold text-white bg-zinc-800 px-2 py-0.5 rounded-md">
              {userToDelete?.username}
            </span>
            ? Tato akce je nevratná a odebere veškerá přístupová práva.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Zrušit
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>
              Smazat uživatele
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}