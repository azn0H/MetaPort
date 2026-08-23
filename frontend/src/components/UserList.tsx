import { useState } from 'react'
import {
  Trash2,
  AlertCircle,
  Filter,
  LayoutGrid,
  List,
  Check,
  ChevronDown,
  Copy,
  Users,
} from 'lucide-react'
import { FilterSelect } from './FilterSelect'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { SearchInput } from './ui/Input'
import { ContainerCardSkeleton } from './ui/Skeleton'

interface UserData {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  role: string
}

interface UserListProps {
  users: UserData[]
  isLoading: boolean
  error: string
  currentUsername: string
  onRoleChange: (id: number, role: string) => void
  onDelete: (id: number, username: string) => void
}

const roleMap: Record<string, { label: string; variant: 'amber' | 'emerald' | 'cyan' }> = {
  superadmin: {
    label: 'Super Admin',
    variant: 'amber',
  },
  betteradmin: {
    label: 'Better Admin',
    variant: 'emerald',
  },
  admin: {
    label: 'Admin',
    variant: 'cyan',
  },
}

function RoleDropdown({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const currentRole = roleMap[value] || { label: value, variant: 'cyan' as const }

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between w-full border rounded-xl py-1.5 px-3 text-xs font-semibold transition-all ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-900/50 text-zinc-500'
            : `cursor-pointer bg-[#18181b] border-zinc-700/80 hover:border-zinc-500 text-zinc-200 shadow-sm`
        }`}
      >
        <span className="truncate flex items-center gap-1.5">
          <Badge variant={currentRole.variant} size="sm">
            {currentRole.label}
          </Badge>
        </span>
        {!disabled && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 z-50 mt-1 bg-[#121215] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden py-1 backdrop-blur-xl">
            {Object.entries(roleMap).map(([key, config]) => {
              const isSelected = value === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(key)}
                  className={`w-full px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-cyan-400 bg-cyan-500/10'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <span>{config.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default function UserList({
  users,
  isLoading,
  error,
  currentUsername,
  onRoleChange,
  onDelete,
}: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      user.username.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.first_name.toLowerCase().includes(search) ||
      user.last_name.toLowerCase().includes(search)

    const matchesRole = filterRole === 'all' || user.role === filterRole

    return matchesSearch && matchesRole
  })

  const getInitials = (firstName: string, lastName: string, username: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    return username.substring(0, 2).toUpperCase()
  }

  const handleCopyEmail = (email: string, id: number) => {
    navigator.clipboard.writeText(email)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const roleOptions = ['admin', 'betteradmin', 'superadmin']

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="font-medium">{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <SearchInput
          placeholder="Hledat uživatele, e-mail nebo jméno..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <FilterSelect
            value={filterRole}
            onChange={setFilterRole}
            options={roleOptions}
            defaultLabel="Všechny role"
            icon={Filter}
          />

          <div className="flex items-center p-1 bg-[#121215] border border-zinc-800 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Zobrazit mřížku"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Zobrazit tabulku"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <ContainerCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card variant="bento" className="p-12 text-center">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">Nenalezeni žádní uživatelé</h3>
          <p className="text-xs text-zinc-500 mt-1">Zkuste změnit vyhledávací kritéria.</p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const isSelf = user.username === currentUsername

            return (
              <Card
                key={user.id}
                variant="bento"
                hover
                className="p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                        {getInitials(user.first_name, user.last_name, user.username)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-white truncate" title={user.username}>
                          {user.username}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate mt-0.5">
                          <span className="truncate" title={user.email}>
                            {user.email}
                          </span>
                          <button
                            onClick={() => handleCopyEmail(user.email, user.id)}
                            className="p-0.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                            title="Zkopírovat e-mail"
                          >
                            {copiedId === user.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isSelf && (
                      <Badge variant="cyan" size="sm">
                        Vy
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-zinc-800/60 mb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                        Jméno
                      </span>
                      <span
                        className="text-zinc-300 font-medium truncate block"
                        title={`${user.first_name} ${user.last_name}`}
                      >
                        {user.first_name || user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                        Role
                      </span>
                      <RoleDropdown
                        value={user.role}
                        onChange={(newRole) => onRoleChange(user.id, newRole)}
                        disabled={isSelf}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  {!isSelf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(user.id, user.username)}
                      title="Smazat uživatele"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-xs text-rose-400 ml-1">Smazat</span>
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card variant="bento" className="overflow-hidden !p-0 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#121215] border-b border-zinc-800/80 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Uživatel</th>
                  <th className="py-3 px-4">Celé Jméno</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4 min-w-[170px]">Role</th>
                  <th className="py-3 px-4 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-[#0d0d10]">
                {filteredUsers.map((user) => {
                  const isSelf = user.username === currentUsername

                  return (
                    <tr key={user.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {getInitials(user.first_name, user.last_name, user.username)}
                          </div>
                          <span className="font-bold text-white">{user.username}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-zinc-300">
                        {user.first_name || user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : '—'}
                      </td>

                      <td className="py-3 px-4 text-zinc-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{user.email}</span>
                          <button
                            onClick={() => handleCopyEmail(user.email, user.id)}
                            className="p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                            title="Zkopírovat e-mail"
                          >
                            {copiedId === user.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="max-w-[160px]">
                          <RoleDropdown
                            value={user.role}
                            onChange={(newRole) => onRoleChange(user.id, newRole)}
                            disabled={isSelf}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!isSelf ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(user.id, user.username)}
                            title="Smazat uživatele"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </Button>
                        ) : (
                          <span className="text-[11px] text-zinc-500 italic">Váš účet</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}