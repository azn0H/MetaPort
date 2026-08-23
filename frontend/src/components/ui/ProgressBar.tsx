interface ProgressBarProps {
  value: number
  max?: number
  variant?: 'auto' | 'cyan' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

function getGradientStyle(variant: string, percentage: number): { background: string; boxShadow: string } {
  if (variant === 'auto') {
    if (percentage >= 90) {
      return {
        background: 'linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)',
        boxShadow: '0 0 10px rgba(244, 63, 94, 0.4)',
      }
    }
    if (percentage >= 75) {
      return {
        background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
        boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
      }
    }
    return {
      background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)',
      boxShadow: '0 0 10px rgba(6, 182, 212, 0.4)',
    }
  }

  switch (variant) {
    case 'cyan':
      return {
        background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)',
        boxShadow: '0 0 10px rgba(6, 182, 212, 0.4)',
      }
    case 'blue':
      return {
        background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
      }
    case 'emerald':
      return {
        background: 'linear-gradient(90deg, #10b981 0%, #14b8a6 100%)',
        boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
      }
    case 'amber':
      return {
        background: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)',
        boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
      }
    case 'rose':
      return {
        background: 'linear-gradient(90deg, #f43f5e 0%, #e11d48 100%)',
        boxShadow: '0 0 10px rgba(244, 63, 94, 0.4)',
      }
    case 'purple':
      return {
        background: 'linear-gradient(90deg, #a855f7 0%, #8b5cf6 100%)',
        boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
      }
    default:
      return {
        background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)',
        boxShadow: '0 0 10px rgba(6, 182, 212, 0.4)',
      }
  }
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'auto',
  size = 'md',
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100)
  const style = getGradientStyle(variant, percentage)

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-zinc-600 dark:text-zinc-400">
          <span>Progres</span>
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-200">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={`w-full ${sizeClasses[size]} bg-zinc-200 dark:bg-zinc-800/90 rounded-full overflow-hidden border border-zinc-300/80 dark:border-zinc-700/40`}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: style.background,
            boxShadow: percentage > 0 ? style.boxShadow : 'none',
          }}
        />
      </div>
    </div>
  )
}
