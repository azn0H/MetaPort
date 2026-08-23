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

export interface UserData {
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
            ? 'opacity-50 cursor-not-allowed border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-500'
            : `cursor-pointer bg-white dark:bg-[#18181b] border-zinc-300 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-800 dark:text-zinc-200 shadow-xs`
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
          <div className="absolute left-0 right-0 z-50 mt-1 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden py-1 backdrop-blur-xl">
            {Object.entries(roleMap).map(([key, config]) => {
              const isSelected = value === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(key)}
                  className={`w-full px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <span>{config.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
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
      user.first_name.toLowerCase().includes(search) ||
      user.last_name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)

    const matchesRole = filterRole === 'all' || user.role === filterRole

    return matchesSearch && matchesRole
  })

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <SearchInput
          placeholder="Hledat uživatele podle jména, e-mailu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex items-center gap-2.5">
          <FilterSelect
            value={filterRole}
            onChange={setFilterRole}
            options={[
              { value: 'all', label: 'Všechny role' },
              { value: 'superadmin', label: 'Super Admin' },
              { value: 'betteradmin', label: 'Better Admin' },
              { value: 'admin', label: 'Admin' },
            ]}
            icon={Filter}
          />

          <div className="flex items-center p-1 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Zobrazit mřížku"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
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
          <Users className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">Nenalezeni žádní uživatelé</h3>
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
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
                        {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                            {user.first_name || user.last_name
                              ? `${user.first_name} ${user.last_name}`.trim()
                              : user.username}
                          </h3>
                          {isSelf && (
                            <Badge variant="cyan" size="sm">
                              Ty
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">@{user.username}</span>
                      </div>
                    </div>

                    {!isSelf && (
                      <button
                        onClick={() => onDelete(user.id, user.username)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Smazat uživatele"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 py-3 border-t border-zinc-200 dark:border-zinc-800/80">
                    <button
                      onClick={() => copyToClipboard(user.email, user.id)}
                      className="w-full flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 group cursor-pointer"
                    >
                      <span className="truncate">{user.email}</span>
                      {copiedId === user.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/80">
                  <RoleDropdown
                    value={user.role}
                    onChange={(newRole) => onRoleChange(user.id, newRole)}
                    disabled={isSelf}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card variant="bento" className="overflow-hidden !p-0 shadow-sm dark:shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
              <thead className="bg-zinc-50 dark:bg-[#121215] text-zinc-500 text-[11px] uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800/80">
                <tr>
                  <th className="px-6 py-3.5">Uživatel</th>
                  <th className="px-6 py-3.5">E-mail</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 bg-white dark:bg-[#0d0d10]">
                {filteredUsers.map((user) => {
                  const isSelf = user.username === currentUsername

                  return (
                    <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-zinc-900 dark:text-white">
                                {user.first_name || user.last_name
                                  ? `${user.first_name} ${user.last_name}`.trim()
                                  : user.username}
                              </span>
                              {isSelf && (
                                <Badge variant="cyan" size="sm">
                                  Ty
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-500 font-mono">@{user.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-zinc-600 dark:text-zinc-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-3.5 w-44">
                        <RoleDropdown
                          value={user.role}
                          onChange={(newRole) => onRoleChange(user.id, newRole)}
                          disabled={isSelf}
                        />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {!isSelf ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            onClick={() => onDelete(user.id, user.username)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">Váš účet</span>
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