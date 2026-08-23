import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
        isDark
          ? 'bg-zinc-900/90 border-zinc-800 text-amber-400 hover:text-amber-300 hover:bg-zinc-800'
          : 'bg-white border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 shadow-sm'
      } ${className}`}
      title={isDark ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
      aria-label="Přepnout motiv"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
