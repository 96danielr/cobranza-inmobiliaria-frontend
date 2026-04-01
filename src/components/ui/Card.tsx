'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'interactive'
  animate?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, variant = 'default', animate = true, ...props }, ref) => {
    const variantClasses = {
      default: 'glass-card',
      elevated: 'glass-card shadow-glass-hover transform hover:scale-[1.02]',
      interactive: 'glass-card cursor-pointer hover:shadow-glow transition-all duration-200'
    }

    const animationClasses = animate ? 'animate-fade-in-up' : ''

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          animationClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

export const CardHeader = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-4 md:px-6 py-4 border-b border-glass-border',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

export const CardContent = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-4 md:px-6 py-4', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

export const CardFooter = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-4 md:px-6 py-4 border-t border-glass-border bg-glass-primary/50',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-text-muted", className)}
      {...props}
    />
  )
)

Card.displayName = 'Card'
CardHeader.displayName = 'CardHeader'
CardTitle.displayName = 'CardTitle'
CardDescription.displayName = 'CardDescription'
CardContent.displayName = 'CardContent'
CardFooter.displayName = 'CardFooter'