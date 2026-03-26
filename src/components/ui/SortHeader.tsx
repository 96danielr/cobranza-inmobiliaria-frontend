'use client'

import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'

interface SortHeaderProps {
  label: string
  field: string
  currentSortBy?: string
  currentSortOrder?: 'asc' | 'desc'
  onSort: (field: string) => void
  className?: string
}

export function SortHeader({
  label,
  field,
  currentSortBy,
  currentSortOrder,
  onSort,
  className = ''
}: SortHeaderProps) {
  const isSorted = currentSortBy === field
  
  return (
    <th 
      className={`cursor-pointer transition-colors hover:bg-glass-primary/20 group ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <div className="flex-shrink-0">
          {!isSorted ? (
            <ArrowUpDown className="w-3 h-3 text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity" />
          ) : currentSortOrder === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-accent-blue" />
          ) : (
            <ChevronDown className="w-3 h-3 text-accent-blue" />
          )}
        </div>
      </div>
    </th>
  )
}
