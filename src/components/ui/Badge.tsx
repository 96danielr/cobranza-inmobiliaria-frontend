'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  glow?: boolean
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, glow = false, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center font-medium rounded-full backdrop-blur-glass border transition-all duration-300'
    
    const variants = {
      default: 'badge-info',
      success: 'badge-success',
      warning: 'badge-warning', 
      danger: 'badge-danger',
      info: 'badge-info',
      purple: 'badge-purple'
    }
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs min-h-[20px]',
      md: 'px-3 py-1 text-sm min-h-[24px]',
      lg: 'px-4 py-1.5 text-base min-h-[32px]'
    }
    
    const glowClasses = glow ? {
      success: 'shadow-[0_0_10px_rgba(74,222,128,0.3)]',
      warning: 'shadow-[0_0_10px_rgba(251,191,36,0.3)]',
      danger: 'shadow-[0_0_10px_rgba(248,113,113,0.3)]',
      info: 'shadow-[0_0_10px_rgba(96,165,250,0.3)]',
      purple: 'shadow-[0_0_10px_rgba(167,139,250,0.3)]',
      default: 'shadow-[0_0_10px_rgba(96,165,250,0.3)]'
    } : {}
    
    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          glow ? glowClasses[variant] : '',
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'