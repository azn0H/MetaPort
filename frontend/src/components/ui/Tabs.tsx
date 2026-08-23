import React from 'react'

export interface TabItem<T extends string = string> {
  id: T
  label: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[]
  activeTab: T
  onChange: (tabId: T) => void
  className?: string
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
}: TabsProps<T>) {
  return (
    <div
      className={`inline-flex items-center p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-xl gap-1 backdrop-blur-md ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'bg-zinc-800/80 text-zinc-400'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
