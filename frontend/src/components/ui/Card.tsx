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
  const baseClasses = 'relative rounded-2xl border transition-all duration-300'
  
  const variantClasses = {
    default: 'bg-[#121215] border-zinc-800/80 text-zinc-100 shadow-sm',
    glass: 'bg-zinc-900/60 backdrop-blur-xl border-zinc-800/80 text-zinc-100 shadow-lg shadow-black/20',
    bento: 'bg-[#121215]/90 backdrop-blur-md border-zinc-800/80 text-zinc-100 glow-border',
    subtle: 'bg-zinc-900/40 border-zinc-800/40 text-zinc-100',
  }

  const hoverClasses = hover ? 'bento-card-hover hover:border-zinc-700 hover:bg-[#15151a]' : ''

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
    <h3 className={`text-base font-semibold tracking-tight text-white ${className}`} {...props}>
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
    <p className={`text-xs text-zinc-400 mt-0.5 ${className}`} {...props}>
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
    <div className={`flex items-center p-5 pt-3 border-t border-zinc-800/60 ${className}`} {...props}>
      {children}
    </div>
  )
}
