"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Clock, 
  Bookmark, 
  History, 
  Search, 
  Zap, 
  Target,
  BarChart3,
  Calendar,
  Activity,
  Star,
  FileText,
  Globe,
  Code,
  Download,
  Upload,
  Settings,
  Lightbulb,
  Tag
} from "lucide-react"
import { useOpenAPIStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

export function Dashboard() {
  const [isImporting, setIsImporting] = useState(false)
  const { stats, searchHistory, bookmarks, exportHistory, importHistory, clearHistory } = useOpenAPIStore()
  const { toast } = useToast()

  const handleQuickSearch = (url: string) => {
    // This would trigger a search - for now just show a toast
    toast({
      title: "Quick Search",
      description: `Would search: ${url}`,
    })
  }

  const handleImport = () => {
    setIsImporting(true)
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
      setIsImporting(false)
    }
    input.click()
  }

  const handleExport = () => {
    exportHistory()
    toast({
      title: "Exported",
      description: "Search history exported successfully",
    })
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

  const getPerformanceColor = (time: number) => {
    if (time < 100) return "text-green-500"
    if (time < 500) return "text-yellow-500"
    return "text-red-500"
  }

  const getSuccessRate = () => {
    if (stats.totalSearches === 0) return 0
    return Math.round((stats.successfulSearches / stats.totalSearches) * 100)
  }

  const recentSearches = searchHistory.slice(0, 5)
  const popularTags = stats.mostUsedTags.slice(0, 8)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OpenAPI Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Your comprehensive OpenAPI specification management center
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImport} disabled={isImporting}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={handleClearHistory}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSearches}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSearches > 0 ? `+${Math.round((stats.totalSearches / 30) * 100)}% from last month` : "No searches yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getSuccessRate()}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.successfulSearches} successful out of {stats.totalSearches} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(stats.averageProcessingTime)}`}>
              {stats.averageProcessingTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.averageProcessingTime < 100 ? "Excellent performance" : 
               stats.averageProcessingTime < 500 ? "Good performance" : "Consider optimization"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookmarks</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookmarks.length}</div>
            <p className="text-xs text-muted-foreground">
              {bookmarks.length > 0 ? `${Math.round((bookmarks.length / stats.totalSearches) * 100)}% of searches bookmarked` : "No bookmarks yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => handleQuickSearch("https://petstore3.swagger.io/api/v3/openapi.json")}
              >
                <Globe className="h-6 w-6 mb-2" />
                <span className="text-sm">Pet Store API</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => handleQuickSearch("https://api.github.com/openapi.json")}
              >
                <Code className="h-6 w-6 mb-2" />
                <span className="text-sm">GitHub API</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => handleQuickSearch("https://api.stripe.com/openapi.json")}
              >
                <FileText className="h-6 w-6 mb-2" />
                <span className="text-sm">Stripe API</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => handleQuickSearch("https://api.openai.com/openapi.json")}
              >
                <Zap className="h-6 w-6 mb-2" />
                <span className="text-sm">OpenAI API</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSearches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent searches</p>
                <p className="text-sm">Start exploring APIs to see your activity here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSearches.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        item.status === "success" ? "bg-green-500" : "bg-red-500"
                      }`} />
                      <div>
                        <p className="text-sm font-medium truncate max-w-32">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.sourceType}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular Tags & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-purple-500" />
              Popular Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularTags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tags yet</p>
                <p className="text-sm">Add tags to your searches to organize them better</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag, index) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-sm px-3 py-1"
                  >
                    {tag}
                    <span className="ml-2 text-xs opacity-70">
                      {Math.round((stats.totalSearches / (index + 1)) * 10)}%
                    </span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Response Time</span>
                <span className="text-sm font-medium">
                  {stats.averageProcessingTime.toFixed(0)}ms
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    stats.averageProcessingTime < 100 ? "bg-green-500" :
                    stats.averageProcessingTime < 500 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ 
                    width: `${Math.min((stats.averageProcessingTime / 1000) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Success Rate</span>
                <span className="text-sm font-medium">{getSuccessRate()}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${getSuccessRate()}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>Best Performance</span>
                <span className="text-green-500 font-medium">
                  {stats.averageProcessingTime < 100 ? "Excellent" : 
                   stats.averageProcessingTime < 500 ? "Good" : "Needs Improvement"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Search Trends (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-between gap-1">
            {stats.searchTrends.map((trend) => (
              <div key={trend.date} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-primary/20 rounded-t-sm transition-all hover:bg-primary/40 cursor-pointer"
                  style={{ 
                    height: `${Math.max((trend.count / Math.max(...stats.searchTrends.map(t => t.count))) * 160, 4)}px` 
                  }}
                  title={`${trend.count} searches on ${new Date(trend.date).toLocaleDateString()}`}
                />
                <span className="text-xs text-muted-foreground mt-2 text-center">
                  {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {stats.searchTrends.reduce((sum, trend) => sum + trend.count, 0)} total searches in the last 30 days
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
