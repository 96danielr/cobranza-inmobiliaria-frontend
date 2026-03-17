'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface ComboboxProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
  searchPlaceholder?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  className,
  label,
  searchPlaceholder = 'Buscar...',
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
        </label>
      )}
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'glass-input min-h-[44px] px-4 py-2.5 flex items-center justify-between cursor-pointer group transition-all duration-300',
          'hover:border-accent-blue/40 hover:shadow-glow',
          isOpen && 'ring-2 ring-accent-blue/50 border-accent-blue shadow-glow'
        )}
      >
        <div className="flex flex-col truncate">
          <span className={cn('text-sm truncate font-medium', !selectedOption && 'text-text-muted')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 text-text-secondary transition-transform duration-500 ease-in-out',
          isOpen && 'rotate-180 text-accent-blue'
        )} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-[#1a1a2e]/98 border border-glass-border/30 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-fade-in origin-top backdrop-blur-2xl rounded-xl">
          {/* Search bar inside dropdown */}
          <div className="p-3 border-b border-glass-border flex items-center bg-glass-primary/10">
            <Search className="w-4 h-4 text-accent-blue mr-3 opacity-70" />
            <input
              autoFocus
              className="bg-transparent border-none outline-none text-sm text-text-primary w-full placeholder:text-text-disabled"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {search && (
              <X 
                className="w-4 h-4 text-text-muted cursor-pointer hover:text-accent-red transition-colors" 
                onClick={(e) => {
                  e.stopPropagation()
                  setSearch('')
                }}
              />
            )}
          </div>

          <div className="max-h-64 overflow-y-auto py-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(option.value)
                    setIsOpen(false)
                    setSearch('')
                  }}
                  className={cn(
                    'px-4 py-3 text-sm cursor-pointer flex items-center justify-between transition-all duration-200 mx-1 rounded-lg my-0.5',
                    'hover:bg-accent-blue/10 hover:translate-x-1',
                    value === option.value 
                      ? 'bg-accent-blue/20 text-accent-blue font-semibold border-l-2 border-accent-blue' 
                      : 'text-text-primary'
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && (
                    <div className="bg-accent-blue/20 p-1 rounded-full">
                      <Check className="w-3.5 h-3.5 text-accent-blue" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-text-muted text-center cursor-default italic">
                No se encontraron resultados para "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
