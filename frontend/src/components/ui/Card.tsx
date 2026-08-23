import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'bento' | 'subtle'
  hover?: boolean
}

export function Card({
  children,
  className = '',
  variant = 'default',
  hover = false,
  ...props
}: CardProps) {
  const baseClasses = 'relative rounded-2xl border'
  
  const variantClasses = {
    default: 'bg-white dark:bg-[#121215] border-zinc-200 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-100 shadow-sm dark:shadow-none',
    glass: 'bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border-zinc-200 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-100 shadow-md dark:shadow-lg dark:shadow-black/20',
    bento: 'bg-white dark:bg-[#121215]/90 backdrop-blur-md border-zinc-200/90 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-100 shadow-sm dark:shadow-2xl glow-border',
    subtle: 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/40 text-zinc-900 dark:text-zinc-100',
  }

  const hoverClasses = hover
    ? 'bento-card-hover hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-[#15151a]'
    : ''

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-between p-5 pb-3 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-base font-semibold tracking-tight text-zinc-900 dark:text-white ${className}`} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 ${className}`} {...props}>
      {children}
    </p>
  )
}

export function CardContent({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 pt-0 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center p-5 pt-3 border-t border-zinc-200 dark:border-zinc-800/60 ${className}`} {...props}>
      {children}
    </div>
  )
}
