interface CircularGaugeProps {
  value: number // 0 to 100
  label: string
  sublabel?: string
  size?: number
  strokeWidth?: number
  variant?: 'auto' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple'
}

function getColorHex(variant: string, percentage: number): { stroke: string; textClass: string } {
  if (variant === 'auto') {
    if (percentage >= 90) return { stroke: '#f43f5e', textClass: 'text-rose-500' }
    if (percentage >= 75) return { stroke: '#f59e0b', textClass: 'text-amber-400' }
    return { stroke: '#06b6d4', textClass: 'text-cyan-400' }
  }

  switch (variant) {
    case 'cyan':
      return { stroke: '#06b6d4', textClass: 'text-cyan-400' }
    case 'emerald':
      return { stroke: '#10b981', textClass: 'text-emerald-400' }
    case 'amber':
      return { stroke: '#f59e0b', textClass: 'text-amber-400' }
    case 'rose':
      return { stroke: '#f43f5e', textClass: 'text-rose-500' }
    case 'purple':
      return { stroke: '#a855f7', textClass: 'text-purple-400' }
    default:
      return { stroke: '#06b6d4', textClass: 'text-cyan-400' }
  }
}

export function CircularGauge({
  value,
  label,
  sublabel,
  size = 120,
  strokeWidth = 9,
  variant = 'auto',
}: CircularGaugeProps) {
  const percentage = Math.min(Math.max(0, value), 100)
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  const colorInfo = getColorHex(variant, percentage)

  return (
    <div className="flex flex-col items-center group">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorInfo.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${colorInfo.stroke}66)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-bold tracking-tight ${colorInfo.textClass}`}>
            {Math.round(percentage)}%
          </span>
          {sublabel && (
            <span className="text-[10px] font-medium text-zinc-400 mt-0.5 max-w-[80px] text-center truncate">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      <span className="text-zinc-200 text-xs font-semibold mt-3 text-center tracking-tight">
        {label}
      </span>
    </div>
  )
}
