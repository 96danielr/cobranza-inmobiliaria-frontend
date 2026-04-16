'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'

// Server-side pagination hook
export interface UseServerPaginationProps {
  initialPage?: number
  initialLimit?: number
  initialSortBy?: string
  initialSortOrder?: 'asc' | 'desc'
  fetchData: (page: number, limit: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc') => Promise<{
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
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Stable reference to fetchData to avoid re-renders if it's not memoized
  const fetchRef = useRef(fetchData)
  useEffect(() => {
    fetchRef.current = fetchData
  }, [fetchData])

  const loadData = useCallback(async (pageToLoad = page, searchTerm = search, currentSortBy = sortBy, currentSortOrder = sortOrder) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchRef.current(pageToLoad, limit, searchTerm, currentSortBy, currentSortOrder)
      
      setData(result.data)
      setTotal(result.total)
      setPages(result.pages)
      
      // Sync local page if server returned a different one
      if (result.page !== pageToLoad) {
        setPage(result.page)
      }
    } catch (err) {

      setError(err instanceof Error ? err.message : 'Error loading data')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [limit, page, search, sortBy, sortOrder])

  // Load data when core state or external dependencies change
  useEffect(() => {
    loadData()
  }, [page, limit, search, sortBy, sortOrder, ...dependencies])

  // Actions
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pages) {
      setPage(newPage)
    }
  }

  const goToNextPage = () => {
    if (page < pages) setPage(page + 1)
  }

  const goToPreviousPage = () => {
    if (page > 1) setPage(page - 1)
  }

  const changeLimit = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm)
    setPage(1)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const refresh = () => loadData()

  return {
    data,
    loading,
    error,
    page,
    limit,
    total,
    pages,
    search,
    sortBy,
    sortOrder,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    changeLimit,
    handleSearch,
    handleSort,
    refresh,
    hasNextPage: page < pages,
    hasPreviousPage: page > 1,
    startIndex: total === 0 ? 0 : (page - 1) * limit + 1,
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
      // Deep search in object
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
    if (newPage >= 1 && newPage <= pages) setPage(newPage)
  }

  const changeLimit = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm)
    setPage(1)
  }

  // Reset page if it exceeds bounds after data change
  useEffect(() => {
    if (page > pages && pages > 0) {
      setPage(1)
    }
  }, [data, page, pages])

  return {
    data: paginatedData,
    allData: filteredData,
    page,
    limit,
    total,
    pages,
    search,
    goToPage,
    changeLimit,
    handleSearch,
    hasNextPage: page < pages,
    hasPreviousPage: page > 1,
    startIndex: total === 0 ? 0 : (page - 1) * limit + 1,
    endIndex: Math.min(page * limit, total),
  }
}
