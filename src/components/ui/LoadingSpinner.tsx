'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  glow?: boolean
}

export function LoadingSpinner({ size = 'md', className, glow = false }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }
  
  return (
    <Loader2 
      className={cn(
        'animate-spin text-accent-blue transition-all duration-300',
        glow && 'drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]',
        sizes[size], 
        className
      )} 
    />
  )
}

interface FullPageLoadingProps {
  message?: string
}

export function FullPageLoading({ message = 'Cargando...' }: FullPageLoadingProps) {
  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center">
      <div className="text-center glass-card p-8 animate-fade-in-up">
        <LoadingSpinner size="lg" glow />
        <p className="mt-4 text-text-secondary">{message}</p>
      </div>
    </div>
  )
}

interface CardSkeletonProps {
  lines?: number
  className?: string
}

export function CardSkeleton({ lines = 3, className }: CardSkeletonProps) {
  return (
    <div className={cn('glass-card p-6 animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className={cn(
            'bg-glass-secondary backdrop-blur-glass rounded-lg h-4 mb-3 border border-glass-border shimmer-animation',
            i === lines - 1 && 'mb-0',
            i === 0 && 'w-3/4',
            i === 1 && 'w-1/2', 
            i === 2 && 'w-5/6'
          )}
        />
      ))}
    </div>
  )
}

// Stats Card Skeleton - for dashboard and other pages
interface StatsCardSkeletonProps {
  className?: string
}

export function StatsCardSkeleton({ className }: StatsCardSkeletonProps) {
  return (
    <div className={cn('glass-card p-4 md:p-6 animate-pulse', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          {/* Title skeleton */}
          <div className="bg-glass-secondary backdrop-blur-glass rounded h-4 w-32 mb-2 shimmer-animation" />
          {/* Value skeleton */}
          <div className="bg-glass-secondary backdrop-blur-glass rounded h-8 w-40 shimmer-animation" />
        </div>
        {/* Icon skeleton */}
        <div className="bg-glass-secondary backdrop-blur-glass rounded-full h-12 w-12 shimmer-animation" />
      </div>
      {/* Footer info skeleton */}
      <div className="bg-glass-secondary backdrop-blur-glass rounded h-4 w-28 shimmer-animation" />
    </div>
  )
}

// Table Row Skeleton - configurable for different table structures
interface TableRowSkeletonProps {
  columns: number
  className?: string
}

export function TableRowSkeleton({ columns, className }: TableRowSkeletonProps) {
  return (
    <tr className={cn('border-b border-glass-border animate-pulse', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4 md:px-6">
          <div className="space-y-2">
            <div className="bg-glass-secondary backdrop-blur-glass rounded h-4 w-full shimmer-animation" />
            {/* Some cells might have secondary info */}
            {i < 2 && (
              <div className="bg-glass-secondary backdrop-blur-glass rounded h-3 w-3/4 shimmer-animation" />
            )}
          </div>
        </td>
      ))}
    </tr>
  )
}

// Chart Placeholder - for charts and graphs
interface ChartPlaceholderProps {
  height?: string
  className?: string
  title?: string
}

export function ChartPlaceholder({ height = 'h-80', className, title }: ChartPlaceholderProps) {
  return (
    <div className={cn('glass-card p-4 md:p-6', className)}>
      {title && (
        <div className="mb-4">
          <div className="bg-glass-secondary backdrop-blur-glass rounded h-6 w-48 shimmer-animation" />
        </div>
      )}
      <div className={cn('bg-glass-secondary backdrop-blur-glass rounded-lg shimmer-animation', height)} />
    </div>
  )
}

// Quick Action Skeleton - for action buttons/links
interface QuickActionSkeletonProps {
  count?: number
  className?: string
}

export function QuickActionSkeleton({ count = 4, className }: QuickActionSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center p-3 glass-button rounded-xl animate-pulse">
          {/* Icon skeleton */}
          <div className="bg-glass-secondary backdrop-blur-glass rounded-lg h-10 w-10 mr-3 shimmer-animation" />
          <div className="min-h-[44px] flex flex-col justify-center flex-1">
            {/* Title skeleton */}
            <div className="bg-glass-secondary backdrop-blur-glass rounded h-4 w-32 mb-1 shimmer-animation" />
            {/* Subtitle skeleton */}
            <div className="bg-glass-secondary backdrop-blur-glass rounded h-3 w-24 shimmer-animation" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Modal Content Skeleton - for loading modal content
interface ModalContentSkeletonProps {
  sections?: number
  className?: string
}

export function ModalContentSkeleton({ sections = 3, className }: ModalContentSkeletonProps) {
  return (
    <div className={cn('space-y-6 animate-pulse', className)}>
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="bg-glass-primary/30 backdrop-blur-glass border border-glass-border rounded-lg p-4">
          {/* Section title */}
          <div className="bg-glass-secondary backdrop-blur-glass rounded h-5 w-40 mb-3 shimmer-animation" />
          
          {/* Grid of content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j}>
                <div className="bg-glass-secondary backdrop-blur-glass rounded h-3 w-20 mb-1 shimmer-animation" />
                <div className="bg-glass-secondary backdrop-blur-glass rounded h-4 w-full shimmer-animation" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}