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
  admin: 'Admin',
  betteradmin: 'Better Admin',
  superadmin: 'Super Admin',
}

export function FilterSelect({
  value,
  onChange,
  options,
  defaultLabel,
  icon: Icon,
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
        className="flex items-center gap-2 bg-[#121215] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl py-2 px-3.5 transition-all cursor-pointer shadow-sm"
      >
        <Icon className="w-3.5 h-3.5 text-zinc-400" />
        <span>{getLabel(value)}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-1.5 w-48 bg-[#121215] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden py-1 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => handleSelect('all')}
              className={`w-full px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                value === 'all'
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span>{defaultLabel}</span>
              {value === 'all' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
            <div className="h-px bg-zinc-800/80 my-1" />
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  value === option
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <span>{labelMap[option] || option}</span>
                {value === option && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}