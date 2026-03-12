'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: { value: string; label: string }[]
  placeholder?: string
  variant?: 'default' | 'glass'
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    id, 
    options, 
    placeholder = 'Seleccionar...',
    variant = 'glass',
    ...props 
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`
    
    const variantClasses = {
      default: `
        bg-glass-primary backdrop-blur-glass border border-glass-border rounded-xl
        text-text-primary appearance-none
        focus:bg-glass-secondary focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20
        transition-all duration-300
      `,
      glass: `
        glass-input appearance-none
      `
    }
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={selectId} 
            className="block text-sm font-medium text-text-primary mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'block w-full min-h-[44px] px-4 py-3 pr-10',
              variantClasses[variant],
              error 
                ? 'border-accent-red/50 focus:border-accent-red focus:ring-accent-red/20' 
                : '',
              className
            )}
            {...props}
          >
            <option value="" className="bg-dark-secondary text-text-primary">{placeholder}</option>
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                className="bg-dark-secondary text-text-primary"
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none transition-colors" />
        </div>
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

Select.displayName = 'Select'