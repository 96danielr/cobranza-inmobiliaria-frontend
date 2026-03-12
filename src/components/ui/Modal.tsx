'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hideCloseButton?: boolean
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  hideCloseButton = false
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-dark-primary/80 backdrop-blur-glass transition-all duration-300"
        onClick={onClose}
      />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={cn(
            'relative w-full glass-card animate-fade-in-up shadow-glass-hover',
            sizeClasses[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-glass-border">
            <h3 className="text-lg font-semibold text-text-primary">
              {title}
            </h3>
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-glass-secondary rounded-xl border border-glass-border transition-all duration-300 min-h-[44px] min-w-[44px]"
              >
                <X className="w-5 h-5 text-text-secondary hover:text-accent-red transition-colors" />
              </button>
            )}
          </div>
          
          <div className="p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  const variantStyles = {
    danger: 'danger',
    warning: 'secondary', 
    info: 'primary'
  } as const

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-6">
        <p className="text-text-secondary leading-relaxed">
          {message}
        </p>
        
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
          <Button
            variant="glass"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={variantStyles[variant]}
            onClick={onConfirm}
            loading={isLoading}
            glow={variant === 'danger'}
            className="w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}