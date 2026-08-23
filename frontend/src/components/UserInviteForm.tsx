import { useState, type FormEvent } from 'react'
import { Mail, User as UserIcon, Type } from 'lucide-react'
import { useToast } from './ToastProvider'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Badge } from './ui/Badge'
import { API_BASE } from '../config/api'

interface UserInviteFormProps {
  onSuccess: () => void
  onCancel?: () => void
}

const roleOptions: { key: string; label: string; variant: 'cyan' | 'emerald' | 'amber' }[] = [
  { key: 'admin', label: 'Admin', variant: 'cyan' },
  { key: 'betteradmin', label: 'Better Admin', variant: 'emerald' },
  { key: 'superadmin', label: 'Super Admin', variant: 'amber' },
]

function RoleSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Role</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {roleOptions.map((role) => {
          const isSelected = value === role.key
          return (
            <button
              key={role.key}
              type="button"
              onClick={() => onChange(role.key)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-zinc-100 dark:bg-zinc-800 border-cyan-500/50 text-zinc-900 dark:text-white shadow-xs ring-1 ring-cyan-500/30'
                  : 'bg-white dark:bg-[#121215] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Badge variant={role.variant} size="sm">
                {role.label}
              </Badge>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function UserInviteForm({ onSuccess, onCancel }: UserInviteFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'admin',
  })
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`${API_BASE}/api/v1/auth/users/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.detail || 'Nepodařilo se pozvat uživatele')

      showToast(
        `Pozvánka pro ${formData.username} byla odeslána na ${formData.email}.`,
        'success'
      )
      setFormData({ username: '', first_name: '', last_name: '', email: '', role: 'admin' })
      onSuccess()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white dark:bg-[#0d0d10]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Uživatelské jméno"
          required
          leftIcon={<UserIcon className="w-4 h-4" />}
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="jan.novak"
        />

        <Input
          label="E-mail"
          type="email"
          required
          leftIcon={<Mail className="w-4 h-4" />}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="jan@aznoh.cz"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Jméno"
          leftIcon={<Type className="w-4 h-4" />}
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          placeholder="Jan"
        />

        <Input
          label="Příjmení"
          leftIcon={<Type className="w-4 h-4" />}
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          placeholder="Novák"
        />
      </div>

      <RoleSelector
        value={formData.role}
        onChange={(val) => setFormData({ ...formData, role: val })}
      />

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Zrušit
          </Button>
        )}
        <Button
          type="submit"
          variant="magic"
          size="sm"
          isLoading={isLoading}
          leftIcon={<Mail className="w-4 h-4" />}
        >
          Odeslat pozvánku
        </Button>
      </div>
    </form>
  )
}