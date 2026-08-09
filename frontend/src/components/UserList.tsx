import { useState } from 'react'
import { 
  Trash2, 
  Search, 
  AlertCircle, 
  Filter, 
  LayoutGrid, 
  List, 
  Crown, 
  Shield, 
  Zap, 
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

const roleMap: Record<string, { label: string; icon: any; colorClass: string; bgBadgeClass: string }> = {
  'superadmin': {
    label: 'Super Admin',
    icon: Crown,
    colorClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:border-amber-500/50',
    bgBadgeClass: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300'
  },
  'betteradmin': {
    label: 'Better Admin',
    icon: Zap,
    colorClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/50',
    bgBadgeClass: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300'
  },
  'admin': {
    label: 'Admin',
    icon: Shield,
    colorClass: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:border-cyan-500/50',
    bgBadgeClass: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300'
  }
}

const avatarGradients = [
  'from-cyan-500 to-blue-600',
  'from-purple-500 to-indigo-600',
  'from-amber-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-pink-500 to-rose-600'
]

function getAvatarGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % avatarGradients.length
  return avatarGradients[index]
}

function RoleDropdown({ value, onChange, disabled }: { value: string, onChange: (v: string) => void, disabled: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const currentRole = roleMap[value] || { label: value, icon: Shield, colorClass: 'text-slate-300 border-slate-800 bg-slate-900', bgBadgeClass: '' }
  const RoleIcon = currentRole.icon

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
        className={`flex items-center justify-between w-full border rounded-xl py-2 px-3 text-xs font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
          disabled 
            ? 'opacity-60 cursor-not-allowed border-slate-800 bg-slate-950/40 text-slate-500' 
            : `cursor-pointer ${currentRole.colorClass}`
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <RoleIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{currentRole.label}</span>
          {disabled && <span className="text-[10px] text-slate-500 ml-1 font-normal">(Vy)</span>}
        </div>
        {!disabled && (
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 z-30 mt-1 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
            {Object.entries(roleMap).map(([key, config]) => {
              const Icon = config.icon
              const isSelected = value === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(key)}
                  className={`w-full px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'text-cyan-400 bg-cyan-500/10'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{config.label}</span>
                  </div>
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
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3.5 text-rose-400 backdrop-blur-md">
        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Control Filter Bar */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3 md:p-4 backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl shadow-black/20">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Hledat uživatele, e-mail nebo jméno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl py-2 pl-10 pr-9 text-slate-200 text-xs md:text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
          
          <FilterSelect 
            value={filterRole}
            onChange={setFilterRole}
            options={roleOptions}
            defaultLabel="Všechny role"
            icon={Filter}
          />

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center p-1 bg-slate-950/60 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'grid'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Zobrazit mřížku"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'table'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Zobrazit tabulku"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-950/40 border border-slate-800/60 rounded-lg">
            Nalezeno: <span className="text-cyan-400 font-bold">{filteredUsers.length}</span>
          </div>

        </div>
      </div>
      
      {/* Content View Modes */}
      {isLoading ? (
        <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Načítání uživatelů...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-12 md:p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500 shadow-inner">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-200 mb-1">Žádní uživatelé nenalezeni</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Zkus změnit vyhledávací dotaz nebo vyresetovat filtr rolí.
            </p>
          </div>
          {(searchTerm || filterRole !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setFilterRole('all'); }}
              className="mt-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
            >
              Vymazat filtry
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((user) => {
            const avatarGrad = getAvatarGradient(user.username)
            const isSelf = user.username === currentUsername

            return (
              <div 
                key={user.id} 
                className="rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:shadow-xl hover:shadow-cyan-500/5 backdrop-blur-xl p-5 flex flex-col justify-between transition-all duration-300 group relative overflow-hidden"
              >
                {/* Glowing top line indicator on hover */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="space-y-4">
                  
                  {/* Card Header: Avatar & Username */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGrad} p-0.5 shadow-md flex items-center justify-center`}>
                          <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center text-xs font-bold text-white tracking-wider">
                            {getInitials(user.first_name, user.last_name, user.username)}
                          </div>
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm" title="Aktivní účet" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-base text-white truncate group-hover:text-cyan-400 transition-colors" title={user.username}>
                            {user.username}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 truncate mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                          <button
                            onClick={() => handleCopyEmail(user.email, user.id)}
                            className="p-1 text-slate-500 hover:text-cyan-400 transition-colors ml-0.5"
                            title="Zkopírovat e-mail"
                          >
                            {copiedId === user.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Details Section */}
                  <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block uppercase tracking-wider">Jméno</span>
                      <span className="text-slate-300 font-medium truncate block mt-0.5">
                        {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block uppercase tracking-wider">ID Účtu</span>
                      <span className="text-slate-400 font-mono text-[11px] block mt-0.5">#{user.id}</span>
                    </div>
                  </div>

                  {/* Role Dropdown */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block uppercase tracking-wider mb-1.5">Přístupová role</span>
                    <RoleDropdown 
                      value={user.role} 
                      onChange={(newRole) => onRoleChange(user.id, newRole)} 
                      disabled={isSelf} 
                    />
                  </div>

                </div>

                {/* Footer Action Bar */}
                <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    {isSelf ? <span className="text-cyan-400 font-medium">Váš účet</span> : 'Uživatel systému'}
                  </span>

                  {!isSelf && (
                    <button
                      onClick={() => onDelete(user.id, user.username)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20 font-medium text-xs"
                      title="Smazat uživatele"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Odstranit</span>
                    </button>
                  )}
                </div>

              </div>
            )
          })}
        </div>

      ) : (

        /* Table View */
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden backdrop-blur-xl shadow-xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Uživatel</th>
                  <th className="py-3.5 px-4">Jméno a příjmení</th>
                  <th className="py-3.5 px-4">Kontakt</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Role</th>
                  <th className="py-3.5 px-4 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((user) => {
                  const avatarGrad = getAvatarGradient(user.username)
                  const isSelf = user.username === currentUsername

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarGrad} p-0.5 shadow-sm flex items-center justify-center flex-shrink-0`}>
                            <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center text-[10px] font-bold text-white">
                              {getInitials(user.first_name, user.last_name, user.username)}
                            </div>
                          </div>
                          <div>
                            <span className="font-semibold text-white group-hover:text-cyan-400 transition-colors block">
                              {user.username}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">#{user.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : '—'}
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span>{user.email}</span>
                          <button
                            onClick={() => handleCopyEmail(user.email, user.id)}
                            className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                            title="Zkopírovat e-mail"
                          >
                            {copiedId === user.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="max-w-[170px]">
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
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
                            title="Smazat uživatele"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-cyan-400 px-2 py-1 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                            Váš účet
                          </span>
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