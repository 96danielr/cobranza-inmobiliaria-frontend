'use client'

import { useState, useEffect, useMemo } from 'react'

// Server-side pagination hook
export interface UseServerPaginationProps {
  initialPage?: number
  initialLimit?: number
  fetchData: (page: number, limit: number, search?: string) => Promise<{
    data: any[]
    total: number
    page: number
    limit: number
    pages: number
  }>
  dependencies?: any[]
}

export function useServerPagination({
  initialPage = 1,
  initialLimit = 20,
  fetchData,
  dependencies = []
}: UseServerPaginationProps) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadData = async (pageToLoad = page, searchTerm = search) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await fetchData(pageToLoad, limit, searchTerm)
      
      setData(result.data)
      setTotal(result.total)
      setPages(result.pages)
      // Solo actualizamos la página si realmente cambia, para evitar renders innecesarios
      if (result.page !== page) {
        setPage(result.page)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // Load data when dependencies change
  useEffect(() => {
    loadData()
  }, [page, limit, search, ...dependencies])

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pages) {
      setPage(newPage)
    }
  }

  const goToNextPage = () => {
    if (page < pages) {
      setPage(page + 1)
    }
  }

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const changeLimit = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1) // Reset to first page when changing limit
  }

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm)
    setPage(1) // Reset to first page when searching
  }

  const refresh = () => {
    loadData()
  }

  return {
    // Data
    data,
    loading,
    error,
    
    // Pagination state
    page,
    limit,
    total,
    pages,
    search,
    
    // Actions
    goToPage,
    goToNextPage,
    goToPreviousPage,
    changeLimit,
    handleSearch,
    refresh,
    
    // Computed values
    hasNextPage: page < pages,
    hasPreviousPage: page > 1,
    startIndex: (page - 1) * limit + 1,
    endIndex: Math.min(page * limit, total),
  }
}

// Client-side pagination hook for smaller datasets
export interface UseClientPaginationProps<T> {
  data: T[]
  initialPage?: number
  initialLimit?: number
}

export function useClientPagination<T>({
  data,
  initialPage = 1,
  initialLimit = 20
}: UseClientPaginationProps<T>) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [search, setSearch] = useState('')

  const filteredData = useMemo(() => {
    if (!search) return data
    
    return data.filter(item => {
      const searchStr = search.toLowerCase()
      return JSON.stringify(item).toLowerCase().includes(searchStr)
    })
  }, [data, search])

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, page, limit])

  const total = filteredData.length
  const pages = Math.ceil(total / limit)

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pages) {
      setPage(newPage)
    }
  }

  const goToNextPage = () => {
    if (page < pages) {
      setPage(page + 1)
    }
  }

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const changeLimit = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm)
    setPage(1)
  }

  // Reset page when data changes
  useEffect(() => {
    if (page > pages && pages > 0) {
      setPage(1)
    }
  }, [data, page, pages])

  return {
    // Data
    data: paginatedData,
    allData: filteredData,
    
    // Pagination state
    page,
    limit,
    total,
    pages,
    search,
    
    // Actions
    goToPage,
    goToNextPage,
    goToPreviousPage,
    changeLimit,
    handleSearch,
    
    // Computed values
    hasNextPage: page < pages,
    hasPreviousPage: page > 1,
    startIndex: (page - 1) * limit + 1,
    endIndex: Math.min(page * limit, total),
  }
}