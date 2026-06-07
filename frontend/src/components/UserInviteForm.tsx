import { useState, type FormEvent } from 'react'
import { UserPlus, Shield, Mail, User as UserIcon, Type, Loader2 } from 'lucide-react'
import { useToast } from './ToastProvider'

interface UserInviteFormProps {
  onSuccess: () => void
}

const roleMap: Record<string, string> = {
  'admin': 'Admin',
  'betteradmin': 'Better Admin',
  'superadmin': 'Super Admin'
}

function FormRoleDropdown({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all"
      >
        <span>{roleMap[value] || value}</span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <ul className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
            {Object.entries(roleMap).map(([key, label]) => (
              <li
                key={key}
                onClick={() => handleSelect(key)}
                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
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

export default function UserInviteForm({ onSuccess }: UserInviteFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'admin'
  })
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('https://api-metaport.aznoh.cz/api/v1/auth/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.detail || 'Nepodařilo se pozvat uživatele')

      showToast(`Pozvánka pro ${formData.username} byla odeslána na ${formData.email}.`, 'success')
      setFormData({ username: '', first_name: '', last_name: '', email: '', role: 'admin' })
      onSuccess()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden flex flex-col lg:flex-row">
      
      <div className="lg:w-1/3 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="w-12 h-12 rounded-xl bg-[#0ea5e9] flex items-center justify-center mb-6">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-3">Nová pozvánka</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Odešlete uživateli e-mail s unikátním ověřovacím odkazem. Přes něj si bezpečně nastaví vlastní přístupové heslo a získá přístup do administrace.
        </p>
      </div>

      <div className="lg:w-2/3 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Uživatelské jméno</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Jméno</label>
              <div className="relative">
                <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Příjmení</label>
              <div className="relative">
                <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Přístupová role</label>
            <div className="relative">
              <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none z-10" />
              <FormRoleDropdown 
                value={formData.role} 
                onChange={(val) => setFormData({...formData, role: val})} 
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#0ea5e9] text-white font-medium py-2.5 px-6 rounded-lg hover:bg-[#0284c7] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              Odeslat pozvánku
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}