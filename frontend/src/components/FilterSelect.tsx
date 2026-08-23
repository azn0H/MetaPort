import { useState } from 'react'
import type { ElementType } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface OptionItem {
  value: string
  label: string
}

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: (string | OptionItem)[]
  defaultLabel?: string
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
  defaultLabel = 'Vše',
  icon: Icon,
}: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const normalizedOptions: OptionItem[] = options.map((opt) =>
    typeof opt === 'string'
      ? { value: opt, label: opt === 'all' ? defaultLabel : labelMap[opt] || opt }
      : opt
  )

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  const currentOption = normalizedOptions.find((o) => o.value === value)
  const currentLabel = currentOption ? currentOption.label : defaultLabel

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold rounded-xl py-2 px-3.5 transition-all cursor-pointer shadow-xs"
      >
        <Icon className="w-3.5 h-3.5 text-zinc-400" />
        <span>{currentLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-1.5 w-48 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden py-1 backdrop-blur-xl">
            {normalizedOptions.map((opt) => {
              const isSelected = value === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 font-semibold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
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