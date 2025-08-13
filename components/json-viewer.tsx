"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Copy, 
  Download, 
  Expand, 
  Minus, 
  Filter,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  FileJson,
  Code
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface JsonViewerProps {
  data: any
  title?: string
  compact?: boolean
}

export function JsonViewer({ data, title = "JSON Viewer", compact = false }: JsonViewerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set([""]))
  const [viewMode, setViewMode] = useState<"tree" | "raw">("tree")
  const [showNullValues, setShowNullValues] = useState(true)
  const [showEmptyArrays, setShowEmptyArrays] = useState(true)
  const { toast } = useToast()

  const jsonString = useMemo(() => JSON.stringify(data, null, 2), [data])

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedPaths)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedPaths(newExpanded)
  }

  const expandAll = () => {
    const allPaths = new Set<string>()
    const collectPaths = (obj: any, path = "") => {
      if (Array.isArray(obj)) {
        allPaths.add(path)
        obj.forEach((item, index) => {
          if (typeof item === "object" && item !== null) {
            collectPaths(item, `${path}[${index}]`)
          }
        })
      } else if (typeof obj === "object" && obj !== null) {
        allPaths.add(path)
        Object.keys(obj).forEach(key => {
          const keyPath = path ? `${path}.${key}` : key
          if (typeof obj[key] === "object" && obj[key] !== null) {
            collectPaths(obj[key], keyPath)
          }
        })
      }
    }
    collectPaths(data)
    setExpandedPaths(allPaths)
  }

  const collapseAll = () => {
    setExpandedPaths(new Set([""]))
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString)
      toast({
        title: "Copied!",
        description: "JSON data copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const downloadJson = () => {
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded!",
      description: "JSON file downloaded successfully",
    })
  }

  const renderValue = (value: any, path = "", depth = 0): React.ReactNode => {
    if (value === null) {
      if (!showNullValues) return null
      return <Badge variant="secondary" className="text-xs">null</Badge>
    }
    
    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {String(value)}
        </Badge>
      )
    }
    
    if (typeof value === "number") {
      return <span className="text-green-600 dark:text-green-400 font-mono">{value}</span>
    }
    
    if (typeof value === "string") {
      return (
        <span className="text-orange-600 dark:text-orange-400 font-mono bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded text-sm">
          "{value}"
        </span>
      )
    }

    if (Array.isArray(value)) {
      if (value.length === 0 && !showEmptyArrays) return null
      
      const isExpanded = expandedPaths.has(path)
      const hasSearchMatch = searchTerm && JSON.stringify(value).toLowerCase().includes(searchTerm.toLowerCase())

      return (
        <div className={`${hasSearchMatch ? "bg-yellow-100 dark:bg-yellow-900/20 ring-2 ring-yellow-300 dark:ring-yellow-700" : ""} rounded-lg transition-all duration-200`}>
          <button 
            onClick={() => toggleExpanded(path)} 
            className="flex items-center gap-2 text-left hover:bg-muted/50 rounded-lg px-3 py-2 w-full transition-colors duration-200 group"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
            <Badge variant="outline" className="text-xs">
              Array [{value.length}]
            </Badge>
            {hasSearchMatch && (
              <Badge variant="default" className="text-xs bg-yellow-500">
                Match
              </Badge>
            )}
          </button>
          
          {isExpanded && (
            <div className="ml-6 border-l-2 border-border/50 pl-4 space-y-1">
              {value.map((item, index) => (
                <div key={index} className="py-1">
                  <span className="text-muted-foreground mr-2 font-mono text-sm">[{index}]:</span>
                  {renderValue(item, `${path}[${index}]`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (typeof value === "object") {
      const isExpanded = expandedPaths.has(path)
      const keys = Object.keys(value)
      const hasSearchMatch = searchTerm && JSON.stringify(value).toLowerCase().includes(searchTerm.toLowerCase())

      return (
        <div className={`${hasSearchMatch ? "bg-yellow-100 dark:bg-yellow-900/20 ring-2 ring-yellow-300 dark:ring-yellow-700" : ""} rounded-lg transition-all duration-200`}>
          <button 
            onClick={() => toggleExpanded(path)} 
            className="flex items-center gap-2 text-left hover:bg-muted/50 rounded-lg px-3 py-2 w-full transition-colors duration-200 group"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
            <Badge variant="outline" className="text-xs">
              Object {`{${keys.length}}`}
            </Badge>
            {hasSearchMatch && (
              <Badge variant="default" className="text-xs bg-yellow-500">
                Match
              </Badge>
            )}
          </button>
          
          {isExpanded && (
            <div className="ml-6 border-l-2 border-border/50 pl-4 space-y-1">
              {keys.map((key) => {
                const keyPath = path ? `${path}.${key}` : key
                const keyMatch = searchTerm && key.toLowerCase().includes(searchTerm.toLowerCase())
                const valueToRender = value[key]

                return (
                  <div key={key} className="py-1">
                    <span
                      className={`mr-2 font-medium text-sm ${
                        keyMatch 
                          ? "bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded" 
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      "{key}":
                    </span>
                    {renderValue(valueToRender, keyPath, depth + 1)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return <span className="font-mono text-sm">{String(value)}</span>
  }

  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    
    const filterObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(filterObject).filter(item => item !== null)
      }
      
      if (typeof obj === "object" && obj !== null) {
        const filtered: any = {}
        let hasMatch = false
        
        Object.entries(obj).forEach(([key, value]) => {
          const keyMatch = key.toLowerCase().includes(searchTerm.toLowerCase())
          const valueMatch = JSON.stringify(value).toLowerCase().includes(searchTerm.toLowerCase())
          
          if (keyMatch || valueMatch) {
            filtered[key] = filterObject(value)
            hasMatch = true
          }
        })
        
        return hasMatch ? filtered : null
      }
      
      return obj
    }
    
    return filterObject(data)
  }, [data, searchTerm])

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="flex items-center gap-2"
            >
              <Expand className="h-4 w-4" />
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="flex items-center gap-2"
            >
              <Minus className="h-4 w-4" />
              Collapse All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadJson}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "tree" | "raw")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tree" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Tree View
            </TabsTrigger>
            <TabsTrigger value="raw" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Raw JSON
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tree" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search keys and values..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNullValues(!showNullValues)}
                  className={`flex items-center gap-2 ${!showNullValues ? 'opacity-50' : ''}`}
                >
                  {showNullValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Null
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmptyArrays(!showEmptyArrays)}
                  className={`flex items-center gap-2 ${!showEmptyArrays ? 'opacity-50' : ''}`}
                >
                  {showEmptyArrays ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Empty
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-muted/20 max-h-[600px] overflow-auto">
              <div className="font-mono text-sm space-y-1">
                {renderValue(filteredData)}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="raw">
            <div className="border rounded-lg p-4 bg-muted/20 max-h-[600px] overflow-auto">
              <pre className="font-mono text-sm whitespace-pre-wrap break-words">
                {jsonString}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
