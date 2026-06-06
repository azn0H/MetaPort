import { useState } from 'react'
import type { ElementType } from 'react'

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  defaultLabel: string;
  icon: ElementType;
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

  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-500" />
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-40 bg-slate-900/50 border border-slate-700 text-slate-300 text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        >
          <span className="truncate">{value === 'all' ? defaultLabel : value}</span>
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
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)} 
            />
            <ul className="absolute z-20 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
              <li
                onClick={() => handleSelect('all')}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  value === 'all' 
                    ? 'text-cyan-400 bg-slate-700/50' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {defaultLabel}
              </li>
              {options.map((option) => (
                <li
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                    value === option 
                      ? 'text-cyan-400 bg-slate-700/50' 
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {option}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}