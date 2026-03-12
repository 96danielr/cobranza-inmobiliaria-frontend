'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
  glow?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled, 
    children,
    glow = false,
    ...props 
  }, ref) => {
    const baseClasses = `
      touch-target inline-flex items-center justify-center font-medium rounded-xl 
      transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-primary
      disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden
    `
    
    const variants = {
      primary: `
        bg-gradient-primary text-white border border-accent-blue/20
        hover:shadow-glow focus:ring-accent-blue/50
        ${glow ? 'animate-glass-glow' : ''}
      `,
      secondary: `
        glass-button hover:bg-glass-secondary
        focus:ring-glass-border-hover
      `,
      danger: `
        bg-gradient-to-r from-accent-red to-red-600 text-white border border-accent-red/20
        hover:shadow-[0_0_20px_rgba(248,113,113,0.3)] focus:ring-accent-red/50
      `,
      success: `
        bg-gradient-to-r from-accent-green to-green-600 text-white border border-accent-green/20
        hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] focus:ring-accent-green/50
      `,
      outline: `
        border-2 border-accent-blue/50 text-accent-blue bg-transparent
        hover:bg-accent-blue hover:text-dark-primary focus:ring-accent-blue/50
      `,
      glass: `
        glass-button text-text-primary
        hover:text-accent-blue focus:ring-accent-blue/30
      `
    }
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base'
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'