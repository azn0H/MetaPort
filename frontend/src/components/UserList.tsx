import { useState } from 'react'
import { Trash2, Search, AlertCircle, MoreHorizontal, Filter } from 'lucide-react'
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

const roleMap: Record<string, string> = {
  'admin': 'Admin',
  'betteradmin': 'Better Admin',
  'superadmin': 'Super Admin'
}

function RoleDropdown({ value, onChange, disabled }: { value: string, onChange: (v: string) => void, disabled: boolean }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between w-full bg-slate-950/50 border rounded-lg py-2 px-3 text-xs font-medium transition-all focus:outline-none focus:ring-1 focus:ring-[#0ea5e9] focus:border-[#0ea5e9]
          ${disabled ? 'opacity-50 cursor-not-allowed border-slate-800 text-slate-500' : 'cursor-pointer border-slate-800 text-slate-300 hover:border-slate-600'}
          ${value === 'superadmin' && !disabled ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' : ''}
          ${value === 'betteradmin' && !disabled ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : ''}
        `}
      >
        <span>{roleMap[value] || value}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <ul className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
            {Object.entries(roleMap).map(([key, label]) => (
              <li
                key={key}
                onClick={() => handleSelect(key)}
                className={`px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                  value === key
                    ? 'text-[#0ea5e9] bg-slate-700/50'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {label}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default function UserList({ users, isLoading, error, currentUsername, onRoleChange, onDelete }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = user.username.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.first_name.toLowerCase().includes(search) ||
      user.last_name.toLowerCase().includes(search)
      
    const matchesRole = filterRole === 'all' || user.role === filterRole

    return matchesSearch && matchesRole
  })

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const roleOptions = ['admin', 'betteradmin', 'superadmin']

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-rose-500" />
        <span className="text-rose-400">{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Hledat uživatele, e-mail nebo jméno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <FilterSelect 
              value={filterRole}
              onChange={setFilterRole}
              options={roleOptions}
              defaultLabel="Všechny role"
              icon={Filter}
            />
          </div>
          <div className="text-sm text-slate-400 hidden sm:block">
            Celkem: {filteredUsers.length}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center text-slate-500 py-12">Načítání uživatelů...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full text-center text-slate-500 py-16">
            <div className="flex flex-col items-center justify-center">
              <Search className="w-8 h-8 text-slate-600 mb-3" />
              <p className="text-slate-400">Nebyly nalezeny žádné výsledky.</p>
            </div>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="rounded-xl bg-slate-900/50 border border-slate-800 p-6 flex flex-col gap-6 relative group transition-colors hover:bg-slate-800/40">
              
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
                  {getInitials(user.first_name, user.last_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg text-white truncate" title={user.username}>{user.username}</h3>
                  <span className="text-xs text-slate-500 block truncate" title={user.email}>{user.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-400">
                <div className="font-normal text-slate-500 text-xs">Jméno</div>
                <div className="font-normal text-slate-500 text-xs">Kontakt</div>
                <div className="font-normal text-slate-300 col-span-1 truncate" title={`${user.first_name} ${user.last_name}`}>{user.first_name} {user.last_name}</div>
                <div className="font-normal text-slate-300 col-span-1 truncate" title={user.email}>{user.email}</div>
              </div>

              <div>
                <RoleDropdown 
                  value={user.role} 
                  onChange={(newRole) => onRoleChange(user.id, newRole)} 
                  disabled={user.username === currentUsername} 
                />
              </div>

              <div className="flex items-center justify-end gap-2 text-right">
                {user.username !== currentUsername && (
                  <button
                    onClick={() => onDelete(user.id, user.username)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                    title="Smazat uživatele"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button className="p-2 text-slate-500 hover:text-slate-300 rounded-lg transition-all">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  )
}