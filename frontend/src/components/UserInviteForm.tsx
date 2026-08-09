import { useState, type FormEvent } from 'react'
import { UserPlus, Shield, Mail, User as UserIcon, Type, Loader2, Crown, Zap, CheckCircle2, ChevronDown, Check } from 'lucide-react'
import { useToast } from './ToastProvider'

interface UserInviteFormProps {
  onSuccess: () => void
}

const roleMap: Record<string, { label: string; icon: any; colorClass: string }> = {
  'admin': { label: 'Admin', icon: Shield, colorClass: 'text-cyan-400' },
  'betteradmin': { label: 'Better Admin', icon: Zap, colorClass: 'text-emerald-400' },
  'superadmin': { label: 'Super Admin', icon: Crown, colorClass: 'text-amber-400' }
}

function FormRoleDropdown({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const currentRole = roleMap[value] || { label: value, icon: Shield, colorClass: 'text-slate-300' }
  const RoleIcon = currentRole.icon

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-sm"
      >
        <div className="flex items-center gap-2">
          <RoleIcon className={`w-4 h-4 ${currentRole.colorClass}`} />
          <span className={currentRole.colorClass}>{currentRole.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute z-30 w-full mt-1 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
            {Object.entries(roleMap).map(([key, config]) => {
              const Icon = config.icon
              const isSelected = value === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(key)}
                  className={`w-full px-3.5 py-2.5 text-xs font-medium flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'text-cyan-400 bg-cyan-500/10'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${config.colorClass}`} />
                    <span>{config.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
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
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/20 flex flex-col lg:flex-row">
      
      {/* Side Info Panel */}
      <div className="lg:w-1/3 p-6 md:p-8 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-cyan-950/20 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 mb-6 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/60 rounded-[14px] flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Pozvat uživatele</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Odešlete uživateli e-mail s unikátním ověřovacím odkazem. Přes něj si bezpečně nastaví vlastní přístupové heslo a získá přístup do administrace.
          </p>

          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>Automatické odeslání ověřovacího odkaz na zadaný e-mail</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>Možnost okamžitého přiřazení požadované role</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-800/60 text-[11px] text-slate-500">
          Bezpečnostní odkaz vyprší po 24 hodinách.
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="lg:w-2/3 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Uživatelské jméno
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="např. jan.novak"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-xs md:text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                E-mailová adresa
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="jan.novak@firma.cz"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-xs md:text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Jméno
              </label>
              <div className="relative">
                <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Jan"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-xs md:text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Příjmení
              </label>
              <div className="relative">
                <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Novák"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-xs md:text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Přístupová role
            </label>
            <div className="relative">
              <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <FormRoleDropdown 
                value={formData.role} 
                onChange={(val) => setFormData({...formData, role: val})} 
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-800/80">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
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