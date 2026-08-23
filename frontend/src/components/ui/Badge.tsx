import React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'zinc' | 'cyan' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'indigo'
  size?: 'sm' | 'md'
  dot?: boolean
  pulse?: boolean
  children: React.ReactNode
}

export function Badge({
  children,
  className = '',
  variant = 'zinc',
  size = 'sm',
  dot = false,
  pulse = false,
  ...props
}: BadgeProps) {
  const variantStyles = {
    zinc: 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-300/80 dark:border-zinc-700/60',
    cyan: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
  }

  const dotColors = {
    zinc: 'bg-zinc-500 dark:bg-zinc-400',
    cyan: 'bg-cyan-600 dark:bg-cyan-400',
    blue: 'bg-blue-600 dark:bg-blue-400',
    emerald: 'bg-emerald-600 dark:bg-emerald-400',
    amber: 'bg-amber-600 dark:bg-amber-400',
    rose: 'bg-rose-600 dark:bg-rose-400',
    purple: 'bg-purple-600 dark:bg-purple-400',
    indigo: 'bg-indigo-600 dark:bg-indigo-400',
  }

  const sizeStyles = {
    sm: 'text-[11px] font-medium px-2 py-0.5 rounded-full gap-1.5',
    md: 'text-xs font-medium px-2.5 py-1 rounded-full gap-2',
  }

  return (
    <span
      className={`inline-flex items-center border tracking-tight ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${
            pulse ? 'animate-ping opacity-75' : ''
          }`}
        />
      )}
      {children}
    </span>
  )
}

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const norm = (status || '').toLowerCase().trim()

  if (norm === 'running' || norm === 'online' || norm === 'active' || norm === 'healthy') {
    return (
      <Badge variant="emerald" dot pulse className={className}>
        {status}
      </Badge>
    )
  }

  if (norm === 'stopped' || norm === 'exited' || norm === 'offline' || norm === 'inactive' || norm === 'dead') {
    return (
      <Badge variant="rose" dot className={className}>
        {status}
      </Badge>
    )
  }

  if (norm === 'restarting' || norm === 'paused' || norm === 'warning' || norm === 'pending') {
    return (
      <Badge variant="amber" dot pulse className={className}>
        {status}
      </Badge>
    )
  }

  return (
    <Badge variant="zinc" className={className}>
      {status}
    </Badge>
  )
}
