'use client'

import { InputHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: 'default' | 'glass'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, variant = 'glass', id, ...props }, ref) => {
    const reactId = useId()
    const inputId = id || reactId
    
    const variantClasses = {
      default: `
        bg-glass-primary backdrop-blur-glass border border-glass-border rounded-xl
        text-text-primary placeholder-text-muted
        focus:bg-glass-secondary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20
        transition-all duration-300
      `,
      glass: `
        glass-input
      `
    }
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium text-text-primary mb-2"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'block w-full min-h-[44px] px-4 py-3',
            variantClasses[variant],
            error 
              ? 'border-accent-red/50 focus:border-accent-red focus:ring-accent-red/20' 
              : '',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-accent-red flex items-center">
            <span className="mr-1">⚠</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-text-muted">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'