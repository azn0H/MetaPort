import { useState, type FormEvent } from 'react'
import { UserPlus, Shield, Mail, User as UserIcon, Type, Loader2, ChevronDown, Check } from 'lucide-react'
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
        className="flex items-center justify-between w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-slate-600 transition-all"
      >
        <span>{roleMap[value] || value}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1">
            {Object.entries(roleMap).map(([key, label]) => {
              const isSelected = value === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(key)}
                  className={`w-full px-3 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'text-sky-400 bg-slate-700/50'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>{label}</span>
                  {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                </button>
              )
            })}
          </div>
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
      
      {/* Side Info */}
      <div className="lg:w-1/3 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-6">
          <UserPlus className="w-6 h-6 text-sky-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-3">Nová pozvánka</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Odešlete uživateli e-mail s unikátním ověřovacím odkazem. Přes něj si bezpečně nastaví vlastní přístupové heslo a získá přístup do administrace.
        </p>
      </div>

      {/* Main Form */}
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
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-slate-600 transition-all"
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
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-slate-600 transition-all"
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
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-slate-600 transition-all"
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
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-slate-600 transition-all"
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
              className="bg-sky-600 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-sky-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>Odeslat pozvánku</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}
