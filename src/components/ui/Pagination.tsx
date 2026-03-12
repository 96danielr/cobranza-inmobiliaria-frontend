'use client'

import { cn } from '@/lib/utils'
import { Button } from './Button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export interface PaginationControlsProps {
  page: number
  pages: number
  total: number
  limit: number
  startIndex: number
  endIndex: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  className?: string
  showLimitSelector?: boolean
  limitOptions?: number[]
}

export function PaginationControls({
  page,
  pages,
  total,
  limit,
  startIndex,
  endIndex,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onLimitChange,
  className,
  showLimitSelector = true,
  limitOptions = [10, 20, 50, 100]
}: PaginationControlsProps) {
  
  // Generate page numbers to show
  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i)
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (page + delta < pages - 1) {
      rangeWithDots.push('...', pages)
    } else {
      rangeWithDots.push(pages)
    }

    // Remove duplicates and invalid pages
    return rangeWithDots.filter((item, index, arr) => {
      if (typeof item === 'number') {
        return item >= 1 && item <= pages && arr.indexOf(item) === index
      }
      return true
    })
  }

  if (pages <= 1) return null

  const visiblePages = getVisiblePages()

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 p-4', className)}>
      {/* Results info */}
      <div className="text-sm text-text-secondary">
        Mostrando <span className="font-medium text-text-primary">{startIndex}</span> a{' '}
        <span className="font-medium text-text-primary">{endIndex}</span> de{' '}
        <span className="font-medium text-text-primary">{total.toLocaleString('es-CO')}</span> resultados
      </div>

      <div className="flex items-center gap-2">
        {/* Limit selector */}
        {showLimitSelector && onLimitChange && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-text-secondary">Mostrar:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="glass-input px-2 py-1 text-sm min-h-[32px] w-auto"
            >
              {limitOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* First page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="glass-button hidden sm:flex"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className="glass-button"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="ml-1 hidden sm:inline">Anterior</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((pageNum, index) => (
            <div key={index}>
              {pageNum === '...' ? (
                <span className="px-2 py-1 text-text-muted">...</span>
              ) : (
                <Button
                  variant={pageNum === page ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onPageChange(pageNum as number)}
                  className={cn(
                    "min-w-[32px] h-8",
                    pageNum === page 
                      ? "glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30" 
                      : "glass-button"
                  )}
                >
                  {pageNum}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Next page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="glass-button"
        >
          <span className="mr-1 hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(pages)}
          disabled={page === pages}
          className="glass-button hidden sm:flex"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// Simple pagination for mobile or compact views
export interface SimplePaginationProps {
  page: number
  pages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  onPageChange: (page: number) => void
  className?: string
}

export function SimplePagination({
  page,
  pages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  className
}: SimplePaginationProps) {
  if (pages <= 1) return null

  return (
    <div className={cn('flex items-center justify-between p-4', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPreviousPage}
        className="glass-button"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Anterior
      </Button>

      <span className="text-sm text-text-secondary">
        Página {page} de {pages}
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
        className="glass-button"
      >
        Siguiente
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  )
}

// Loading pagination - shows skeleton while paginating
export function LoadingPagination({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-between p-4 animate-pulse', className)}>
      <div className="bg-glass-secondary backdrop-blur-glass rounded h-4 w-48 shimmer-animation" />
      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-glass-secondary backdrop-blur-glass rounded h-8 w-8 shimmer-animation" />
        ))}
      </div>
    </div>
  )
}

// Pagination Info Component
export interface PaginationInfoProps {
  page: number
  limit: number
  total: number
  startIndex: number
  endIndex: number
  className?: string
}

export function PaginationInfo({
  page,
  limit,
  total,
  startIndex,
  endIndex,
  className
}: PaginationInfoProps) {
  if (total === 0) {
    return (
      <div className={cn('text-sm text-text-muted', className)}>
        No hay elementos para mostrar
      </div>
    )
  }

  return (
    <div className={cn('text-sm text-text-muted', className)}>
      Mostrando {startIndex} a {endIndex} de {total} elementos
    </div>
  )
}