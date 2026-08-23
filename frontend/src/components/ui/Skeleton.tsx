import React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800/60 ${className}`}
      {...props}
    />
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/80 p-5 space-y-4 shadow-xs dark:shadow-none">
      <div className="flex justify-between items-center">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <div className="space-y-2 pt-1">
        <Skeleton className="w-20 h-3.5 rounded" />
        <Skeleton className="w-32 h-7 rounded-lg" />
      </div>
      <Skeleton className="w-full h-2 rounded-full" />
    </div>
  )
}

export function ContainerCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/80 p-5 space-y-4 shadow-xs dark:shadow-none">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="w-28 h-4 rounded" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
        </div>
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/60">
        <Skeleton className="w-full h-3 rounded" />
        <Skeleton className="w-3/4 h-3 rounded" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="w-8 h-8 rounded-xl" />
        <Skeleton className="w-8 h-8 rounded-xl" />
        <Skeleton className="w-8 h-8 rounded-xl" />
      </div>
    </div>
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/80 p-6 space-y-4 shadow-xs dark:shadow-none">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="w-36 h-4.5 rounded" />
            <Skeleton className="w-24 h-3 rounded" />
          </div>
        </div>
        <Skeleton className="w-20 h-5 rounded-full" />
      </div>
      <div className="space-y-2 py-2">
        <Skeleton className="w-full h-3.5 rounded" />
        <Skeleton className="w-4/5 h-3.5 rounded" />
      </div>
      <div className="flex gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/60">
        <Skeleton className="w-16 h-6 rounded-lg" />
        <Skeleton className="w-16 h-6 rounded-lg" />
      </div>
    </div>
  )
}

export function PortalLinkSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/80 p-5 space-y-3 shadow-xs dark:shadow-none">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="w-32 h-4.5 rounded" />
          <Skeleton className="w-48 h-3.5 rounded" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-zinc-200 dark:border-zinc-800/50">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="px-6 py-4">
          <Skeleton className="w-full h-4 rounded" />
        </td>
      ))}
    </tr>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top Header Skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="w-36 h-8 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="w-24 h-8 rounded-xl" />
          <Skeleton className="w-24 h-8 rounded-xl" />
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* 2 Middle Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/80 p-6 space-y-6 shadow-xs dark:shadow-none">
          <Skeleton className="w-40 h-6 rounded-lg" />
          <div className="flex justify-around py-4">
            <Skeleton className="w-28 h-28 rounded-full" />
            <Skeleton className="w-28 h-28 rounded-full" />
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/80 p-6 space-y-4 shadow-xs dark:shadow-none">
          <Skeleton className="w-44 h-6 rounded-lg" />
          <div className="space-y-3 pt-2">
            <Skeleton className="w-full h-10 rounded-xl" />
            <Skeleton className="w-full h-10 rounded-xl" />
            <Skeleton className="w-full h-10 rounded-xl" />
            <Skeleton className="w-full h-10 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Bottom Storage Card */}
      <div className="rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/80 p-6 space-y-4 shadow-xs dark:shadow-none">
        <div className="flex justify-between">
          <Skeleton className="w-36 h-6 rounded-lg" />
          <Skeleton className="w-20 h-5 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <Skeleton className="w-full h-28 rounded-xl" />
          <Skeleton className="w-full h-28 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
