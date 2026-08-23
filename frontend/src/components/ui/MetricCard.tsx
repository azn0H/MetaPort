import React from 'react'
import { Card } from './Card'
import { ProgressBar } from './ProgressBar'
import { Badge } from './Badge'

export interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  icon: React.ComponentType<{ className?: string }>
  gradient?: string
  percent?: number
  badge?: string
  badgeVariant?: 'zinc' | 'cyan' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple'
  subtext?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  unit = '',
  icon: Icon,
  gradient = 'from-cyan-500 to-blue-600',
  percent,
  badge,
  badgeVariant = 'cyan',
  subtext,
  className = '',
}: MetricCardProps) {
  return (
    <Card variant="bento" hover className={`p-5 flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shadow-black/30 shrink-0`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          {badge && (
            <Badge variant={badgeVariant} size="sm">
              {badge}
            </Badge>
          )}
        </div>

        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1">
          {title}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
          {unit && <span className="text-sm font-semibold text-zinc-400">{unit}</span>}
        </div>
      </div>

      <div className="mt-4 pt-2">
        {typeof percent === 'number' && (
          <ProgressBar value={percent} size="sm" variant="auto" />
        )}
        {subtext && <p className="text-xs text-zinc-500 mt-1">{subtext}</p>}
      </div>
    </Card>
  )
}
