"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Clock, 
  Bookmark, 
  Tag, 
  ExternalLink, 
  Copy, 
  Trash2, 
  Star,
  StarOff,
  Download,
  Upload,
  Filter,
  X,
  History,
  TrendingUp
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useOpenAPIStore, type SearchHistoryItem } from "@/lib/store"
import { JsonViewer } from "@/components/json-viewer"

export function SearchHistory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("history")
  const { toast } = useToast()
  const { 
    searchHistory, 
    bookmarks, 
    stats,
    removeFromHistory, 
    toggleBookmark, 
    updateTags, 
    clearHistory,
    exportHistory,
    importHistory,
    searchHistoryByQuery,
    searchHistoryByTags
  } = useOpenAPIStore()

  // Filter history based on search query and tags
  const filteredHistory = useMemo(() => {
    let filtered = searchHistory
    
    if (searchQuery) {
      filtered = searchHistoryByQuery(searchQuery)
    }
    
    if (selectedTags.length > 0) {
      filtered = searchHistoryByTags(selectedTags)
    }
    
    return filtered
  }, [searchHistory, searchQuery, selectedTags, searchHistoryByQuery, searchHistoryByTags])

  // Get all unique tags from history
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    searchHistory.forEach(item => {
      item.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [searchHistory])

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleRemoveItem = (id: string) => {
    removeFromHistory(id)
    toast({
      title: "Removed",
      description: "Item removed from history",
    })
  }

  const handleToggleBookmark = (id: string) => {
    toggleBookmark(id)
    toast({
      title: "Bookmark updated",
      description: "Bookmark status changed",
    })
  }

  const handleUpdateTags = (id: string, newTags: string[]) => {
    updateTags(id, newTags)
    toast({
      title: "Tags updated",
      description: "Tags have been updated",
    })
  }

  const handleExport = () => {
    exportHistory()
    toast({
      title: "Exported",
      description: "Search history exported successfully",
    })
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            if (data.searchHistory) {
              importHistory(data.searchHistory)
              toast({
                title: "Imported",
                description: "Search history imported successfully",
              })
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to import file",
              variant: "destructive",
            })
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all history? This action cannot be undone.")) {
      clearHistory()
      toast({
        title: "Cleared",
        description: "All search history has been cleared",
      })
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const formatProcessingTime = (time: number) => {
    return `${time.toFixed(2)}ms`
  }

  const renderHistoryItem = (item: SearchHistoryItem) => (
    <Card key={item.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {item.title}
              {item.isBookmarked && <Bookmark className="h-4 w-4 text-yellow-500" />}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDate(item.timestamp)}</span>
              <span>•</span>
              <span>{formatProcessingTime(item.processingTime)}</span>
              <span>•</span>
              <Badge variant={item.status === "success" ? "default" : "destructive"}>
                {item.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleBookmark(item.id)}
            >
              {item.isBookmarked ? (
                <StarOff className="h-4 w-4" />
              ) : (
                <Star className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveItem(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">Source:</span>
          <Badge variant="outline" className="font-mono text-xs">
            {item.sourceType}
          </Badge>
          <span className="text-sm font-mono text-muted-foreground truncate max-w-xs">
            {item.source}
          </span>
        </div>

        {item.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {item.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      
      {item.status === "success" && item.result && (
        <CardContent className="pt-0">
          <JsonViewer 
            data={item.result} 
            title={item.title}
            compact={true}
          />
        </CardContent>
      )}
      
      {item.status === "error" && item.errorMessage && (
        <CardContent className="pt-0">
          <div className="p-3 bg-destructive/10 rounded-md">
            <p className="text-sm text-destructive">{item.errorMessage}</p>
          </div>
        </CardContent>
      )}
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Search History</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearHistory}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalSearches}</p>
                <p className="text-sm text-muted-foreground">Total Searches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.successfulSearches}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.averageProcessingTime.toFixed(0)}ms</p>
                <p className="text-sm text-muted-foreground">Avg Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{bookmarks.length}</p>
                <p className="text-sm text-muted-foreground">Bookmarks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("")
              setSelectedTags([])
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by tags:</span>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            All History ({filteredHistory.length})
          </TabsTrigger>
          <TabsTrigger value="bookmarks">
            <Bookmark className="h-4 w-4 mr-2" />
            Bookmarks ({bookmarks.length})
          </TabsTrigger>
          <TabsTrigger value="stats">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No search history found</p>
              {searchQuery || selectedTags.length > 0 ? (
                <p className="text-sm">Try adjusting your search or filters</p>
              ) : (
                <p className="text-sm">Start searching to build your history</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map(renderHistoryItem)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarks" className="mt-6">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bookmarks yet</p>
              <p className="text-sm">Star items to save them for later</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarks.map(renderHistoryItem)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <div className="space-y-6">
            {/* Search Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Search Trends (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {stats.searchTrends.map((trend, index) => (
                    <div key={trend.date} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-primary/20 rounded-t-sm transition-all hover:bg-primary/40"
                        style={{ 
                          height: `${Math.max((trend.count / Math.max(...stats.searchTrends.map(t => t.count))) * 200, 4)}px` 
                        }}
                      />
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Most Used Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Most Used Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stats.mostUsedTags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
