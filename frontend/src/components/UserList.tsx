import { useState } from 'react'
import { 
  Trash2, 
  Search, 
  AlertCircle, 
  Filter, 
  LayoutGrid, 
  List, 
  Check, 
  ChevronDown, 
  X,
  Mail,
  Copy
} from 'lucide-react'
import { FilterSelect } from './FilterSelect'

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

const roleMap: Record<string, { label: string; badgeStyle: string }> = {
  'superadmin': {
    label: 'Super Admin',
    badgeStyle: 'text-amber-400 border-amber-500/20 bg-amber-500/10'
  },
  'betteradmin': {
    label: 'Better Admin',
    badgeStyle: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
  },
  'admin': {
    label: 'Admin',
    badgeStyle: 'text-sky-400 border-sky-500/20 bg-sky-500/10'
  }
}

function RoleDropdown({ value, onChange, disabled }: { value: string, onChange: (v: string) => void, disabled: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const currentRole = roleMap[value] || { label: value, badgeStyle: 'text-slate-300 border-slate-800 bg-slate-900' }

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
        className={`flex items-center justify-between w-full border rounded-lg py-2 px-3 text-xs font-medium transition-all ${
          disabled 
            ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-950/50 text-slate-500' 
            : `cursor-pointer ${currentRole.badgeStyle} hover:border-slate-600`
        }`}
      >
        <span className="truncate">{currentRole.label}</span>
        {!disabled && (
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 z-50 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1">
            {Object.entries(roleMap).map(([key, config]) => {
              const isSelected = value === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(key)}
                  className={`w-full px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'text-sky-400 bg-slate-700/50'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>{config.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default function UserList({ users, isLoading, error, currentUsername, onRoleChange, onDelete }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = user.username.toLowerCase().includes(search) ||
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
      <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400">
        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Toolbar */}
      <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Hledat uživatele, e-mail nebo jméno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-9 text-slate-200 text-sm focus:outline-none focus:border-slate-600 transition-all placeholder:text-slate-600"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-3">
          <FilterSelect 
            value={filterRole}
            onChange={setFilterRole}
            options={roleOptions}
            defaultLabel="Všechny role"
            icon={Filter}
          />

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-950/50 border border-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Zobrazit mřížku"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Zobrazit tabulku"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            Celkem: {filteredUsers.length}
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="text-center text-slate-500 py-12">Načítání uživatelů...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center text-slate-500 py-16 bg-slate-900/30 border border-slate-800 rounded-xl">
          <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Nebyly nalezeny žádné výsledky.</p>
        </div>
      ) : viewMode === 'grid' ? (

        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const isSelf = user.username === currentUsername

            return (
              <div 
                key={user.id} 
                className="rounded-xl bg-slate-900/50 border border-slate-800 p-6 flex flex-col gap-5 transition-colors hover:bg-slate-800/40 relative"
              >
                
                {/* Header: Avatar & Username */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 flex-shrink-0">
                    {getInitials(user.first_name, user.last_name, user.username)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base text-white truncate" title={user.username}>
                      {user.username}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0 text-slate-600" />
                      <span className="truncate" title={user.email}>{user.email}</span>
                      <button
                        onClick={() => handleCopyEmail(user.email, user.id)}
                        className="p-1 text-slate-500 hover:text-slate-300"
                        title="Zkopírovat e-mail"
                      >
                        {copiedId === user.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info Details */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
                  <div className="text-slate-500">Jméno</div>
                  <div className="text-slate-500">Kontakt</div>
                  <div className="text-slate-300 truncate" title={`${user.first_name} ${user.last_name}`}>
                    {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : '—'}
                  </div>
                  <div className="text-slate-300 truncate" title={user.email}>
                    {user.email}
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                  <RoleDropdown 
                    value={user.role} 
                    onChange={(newRole) => onRoleChange(user.id, newRole)} 
                    disabled={isSelf} 
                  />
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                  {!isSelf ? (
                    <button
                      onClick={() => onDelete(user.id, user.username)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Smazat uživatele"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Váš účet</span>
                  )}
                </div>

              </div>
            )
          })}
        </div>

      ) : (

        /* Table View */
        <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">Uživatel</th>
                  <th className="py-3 px-4">Jméno</th>
                  <th className="py-3 px-4">Kontakt</th>
                  <th className="py-3 px-4 min-w-[170px]">Role</th>
                  <th className="py-3 px-4 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((user) => {
                  const isSelf = user.username === currentUsername

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 flex-shrink-0">
                            {getInitials(user.first_name, user.last_name, user.username)}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">
                              {user.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : '—'}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{user.email}</span>
                          <button
                            onClick={() => handleCopyEmail(user.email, user.id)}
                            className="p-1 text-slate-500 hover:text-slate-300"
                            title="Zkopírovat e-mail"
                          >
                            {copiedId === user.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="max-w-[180px]">
                          <RoleDropdown 
                            value={user.role} 
                            onChange={(newRole) => onRoleChange(user.id, newRole)} 
                            disabled={isSelf} 
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!isSelf ? (
                          <button
                            onClick={() => onDelete(user.id, user.username)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Smazat uživatele"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Váš účet</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
