'use client'

import { HTMLAttributes } from 'react'
import { cn, getProgressColor } from '@/lib/utils'

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  showLabel?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  glow?: boolean
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = true,
  label,
  size = 'md',
  animated = true,
  glow = false,
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const sizes = {
    sm: 'h-2',
    md: 'h-3', 
    lg: 'h-4'
  }
  
  const getProgressColorClass = (percent: number) => {
    if (percent >= 80) return 'bg-accent-green'
    if (percent >= 60) return 'bg-accent-blue' 
    if (percent >= 40) return 'bg-accent-yellow'
    return 'bg-accent-red'
  }
  
  const getGlowClass = (percent: number) => {
    if (!glow) return ''
    if (percent >= 80) return 'shadow-[0_0_10px_rgba(74,222,128,0.4)]'
    if (percent >= 60) return 'shadow-[0_0_10px_rgba(96,165,250,0.4)]'
    if (percent >= 40) return 'shadow-[0_0_10px_rgba(251,191,36,0.4)]'
    return 'shadow-[0_0_10px_rgba(248,113,113,0.4)]'
  }
  
  return (
    <div className={cn('w-full', className)} {...props}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
          {showLabel && (
            <span className="text-sm text-text-secondary">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className={cn(
        'bg-glass-primary backdrop-blur-glass border border-glass-border rounded-full overflow-hidden',
        sizes[size]
      )}>
        <div 
          className={cn(
            'h-full rounded-full transition-all duration-500',
            getProgressColorClass(percentage),
            getGlowClass(percentage),
            animated && 'animate-pulse'
          )}
          style={{ 
            width: `${percentage}%`,
            transition: animated ? 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'width 0.3s ease'
          }}
        />
      </div>
    </div>
  )
}