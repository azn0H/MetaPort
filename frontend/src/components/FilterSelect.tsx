import { useState } from 'react'
import type { ElementType } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  defaultLabel: string
  icon: ElementType
}

const labelMap: Record<string, string> = {
  'admin': 'Admin',
  'betteradmin': 'Better Admin',
  'superadmin': 'Super Admin'
}

export function FilterSelect({ 
  value, 
  onChange, 
  options, 
  defaultLabel, 
  icon: Icon 
}: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  const getLabel = (val: string) => {
    if (val === 'all') return defaultLabel
    return labelMap[val] || val
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl py-2 px-3.5 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-700"
      >
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span>{getLabel(value)}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 z-50 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1">
            <button
              type="button"
              onClick={() => handleSelect('all')}
              className={`w-full px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors ${
                value === 'all' 
                  ? 'text-sky-400 bg-sky-500/10' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{defaultLabel}</span>
              {value === 'all' && <Check className="w-3.5 h-3.5 text-sky-400" />}
            </button>
            <div className="h-px bg-slate-800 my-1" />
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors ${
                  value === option 
                    ? 'text-sky-400 bg-sky-500/10' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{labelMap[option] || option}</span>
                {value === option && <Check className="w-3.5 h-3.5 text-sky-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
