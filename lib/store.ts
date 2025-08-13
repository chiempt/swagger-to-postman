"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface SearchHistoryItem {
  id: string
  title: string
  source: string
  sourceType: "url" | "text"
  result: any
  timestamp: number
  tags: string[]
  isBookmarked: boolean
  processingTime: number
  status: "success" | "error"
  errorMessage?: string
}

export interface SearchStats {
  totalSearches: number
  successfulSearches: number
  failedSearches: number
  averageProcessingTime: number
  mostUsedTags: string[]
  searchTrends: { date: string; count: number }[]
}

interface OpenAPIState {
  result: any | null
  error: string | null
  source: string | null
  sourceType: "url" | "text" | null
  searchHistory: SearchHistoryItem[]
  bookmarks: SearchHistoryItem[]
  stats: SearchStats
  setResult: (data: any, source: string, sourceType: "url" | "text", processingTime?: number) => void
  setError: (error: string, source: string, sourceType: "url" | "text", processingTime?: number) => void
  clearState: () => void
  addToHistory: (item: Omit<SearchHistoryItem, "id" | "timestamp">) => void
  removeFromHistory: (id: string) => void
  toggleBookmark: (id: string) => void
  updateTags: (id: string, tags: string[]) => void
  clearHistory: () => void
  exportHistory: () => void
  importHistory: (data: SearchHistoryItem[]) => void
  getStats: () => SearchStats
  searchHistoryByQuery: (query: string) => SearchHistoryItem[]
  searchHistoryByTags: (tags: string[]) => SearchHistoryItem[]
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const calculateStats = (history: SearchHistoryItem[]): SearchStats => {
  const total = history.length
  const successful = history.filter(item => item.status === "success").length
  const failed = total - successful
  
  const avgProcessingTime = history.length > 0 
    ? history.reduce((sum, item) => sum + item.processingTime, 0) / history.length 
    : 0

  // Get most used tags
  const tagCounts = history.reduce((acc, item) => {
    item.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const mostUsedTags = Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([tag]) => tag)

  // Get search trends (last 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
  const recentSearches = history.filter(item => item.timestamp > thirtyDaysAgo)
  
  const searchTrends = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
    const dateStr = date.toISOString().split('T')[0]
    const count = recentSearches.filter(item => 
      new Date(item.timestamp).toISOString().split('T')[0] === dateStr
    ).length
    return { date: dateStr, count }
  }).reverse()

  return {
    totalSearches: total,
    successfulSearches: successful,
    failedSearches: failed,
    averageProcessingTime: avgProcessingTime,
    mostUsedTags,
    searchTrends
  }
}

export const useOpenAPIStore = create<OpenAPIState>()(
  persist(
    (set, get) => ({
      result: null,
      error: null,
      source: null,
      sourceType: null,
      searchHistory: [],
      bookmarks: [],
      stats: {
        totalSearches: 0,
        successfulSearches: 0,
        failedSearches: 0,
        averageProcessingTime: 0,
        mostUsedTags: [],
        searchTrends: []
      },
      
      setResult: (data, source, sourceType, processingTime = 0) => {
        const item: SearchHistoryItem = {
          id: generateId(),
          title: data?.info?.title || "Untitled API",
          source,
          sourceType,
          result: data,
          timestamp: Date.now(),
          tags: [],
          isBookmarked: false,
          processingTime,
          status: "success"
        }
        
        set(state => {
          const newHistory = [item, ...state.searchHistory]
          const newStats = calculateStats(newHistory)
          return {
            result: data,
            error: null,
            source,
            sourceType,
            searchHistory: newHistory,
            stats: newStats
          }
        })
      },

      setError: (error, source, sourceType, processingTime = 0) => {
        const item: SearchHistoryItem = {
          id: generateId(),
          title: "Failed API Request",
          source,
          sourceType,
          result: null,
          timestamp: Date.now(),
          tags: [],
          isBookmarked: false,
          processingTime,
          status: "error",
          errorMessage: error
        }
        
        set(state => {
          const newHistory = [item, ...state.searchHistory]
          const newStats = calculateStats(newHistory)
          return {
            error,
            result: null,
            source,
            sourceType,
            searchHistory: newHistory,
            stats: newStats
          }
        })
      },

      clearState: () => set({ result: null, error: null, source: null, sourceType: null }),

      addToHistory: (item) => {
        const historyItem: SearchHistoryItem = {
          ...item,
          id: generateId(),
          timestamp: Date.now()
        }
        
        set(state => {
          const newHistory = [historyItem, ...state.searchHistory]
          const newStats = calculateStats(newHistory)
          return {
            searchHistory: newHistory,
            stats: newStats
          }
        })
      },

      removeFromHistory: (id) => {
        set(state => {
          const newHistory = state.searchHistory.filter(item => item.id !== id)
          const newBookmarks = state.bookmarks.filter(item => item.id !== id)
          const newStats = calculateStats(newHistory)
          return {
            searchHistory: newHistory,
            bookmarks: newBookmarks,
            stats: newStats
          }
        })
      },

      toggleBookmark: (id) => {
        set(state => {
          const item = state.searchHistory.find(item => item.id === id)
          if (!item) return state

          const updatedItem = { ...item, isBookmarked: !item.isBookmarked }
          const newHistory = state.searchHistory.map(item => 
            item.id === id ? updatedItem : item
          )
          
          let newBookmarks = state.bookmarks
          if (updatedItem.isBookmarked) {
            newBookmarks = [updatedItem, ...newBookmarks]
          } else {
            newBookmarks = newBookmarks.filter(item => item.id !== id)
          }

          return {
            searchHistory: newHistory,
            bookmarks: newBookmarks
          }
        })
      },

      updateTags: (id, tags) => {
        set(state => ({
          searchHistory: state.searchHistory.map(item =>
            item.id === id ? { ...item, tags } : item
          )
        }))
      },

      clearHistory: () => set({ searchHistory: [], bookmarks: [], stats: calculateStats([]) }),

      exportHistory: () => {
        const state = get()
        const dataStr = JSON.stringify({
          searchHistory: state.searchHistory,
          bookmarks: state.bookmarks,
          exportDate: new Date().toISOString()
        }, null, 2)
        
        const blob = new Blob([dataStr], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `openapi-search-history-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      },

      importHistory: (data) => {
        set(state => {
          const newHistory = [...state.searchHistory, ...data]
          const newStats = calculateStats(newHistory)
          return {
            searchHistory: newHistory,
            stats: newStats
          }
        })
      },

      getStats: () => get().stats,

      searchHistoryByQuery: (query) => {
        const state = get()
        const lowercaseQuery = query.toLowerCase()
        return state.searchHistory.filter(item =>
          item.title.toLowerCase().includes(lowercaseQuery) ||
          item.source.toLowerCase().includes(lowercaseQuery) ||
          item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        )
      },

      searchHistoryByTags: (tags) => {
        const state = get()
        return state.searchHistory.filter(item =>
          tags.some(tag => item.tags.includes(tag))
        )
      }
    }),
    {
      name: "openapi-store",
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        bookmarks: state.bookmarks
      })
    }
  )
)
