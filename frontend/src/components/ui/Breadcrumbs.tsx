import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav className={`flex items-center space-x-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium ${className}`} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 shrink-0" />
            )}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors capitalize"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-zinc-900 dark:text-zinc-200 font-semibold capitalize' : 'capitalize'}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
