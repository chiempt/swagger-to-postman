"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Upload, Loader2, Download, History, Bookmark, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useOpenAPIStore } from "@/lib/store"

export function SourceForm() {
  const [url, setUrl] = useState("")
  const [rawText, setRawText] = useState("")
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingPostman, setIsGeneratingPostman] = useState(false)
  const [tags, setTags] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { setResult, setError, clearState, result, searchHistory, bookmarks, updateTags } = useOpenAPIStore()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setRawText(content)
    }
    reader.readAsText(file)
  }

  const processOpenAPI = async () => {
    const startTime = performance.now()
    setIsLoading(true)
    clearState()

    let source = ""
    let sourceType: "url" | "text" = "url"

    try {

      // Priority: File upload → Raw paste → URL
      if (rawText.trim()) {
        source = rawText.trim()
        sourceType = "text"
      } else if (url.trim()) {
        source = url.trim()
        sourceType = "url"
      } else {
        throw new Error("Please provide a URL, paste content, or upload a file")
      }

      if (sourceType === "url") {
        const response = await fetch("/api/fetch-openapi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: source }),
        })

        const result = await response.json()

        if (!result.ok) {
          throw new Error(result.error?.message || "Failed to fetch OpenAPI specification")
        }

        const processingTime = performance.now() - startTime
        setResult(result.data, source, sourceType, processingTime)
      } else {
        // Process raw text locally
        const { processLocalContent } = await import("@/lib/openapi-processor")
        const result = await processLocalContent(source)
        const processingTime = performance.now() - startTime
        setResult(result, source, sourceType, processingTime)
      }

      // Add tags if provided
      if (tags.trim()) {
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean)
        // Update the latest history item with tags
        if (tagArray.length > 0) {
          const latestItem = searchHistory[0]
          if (latestItem) {
            updateTags(latestItem.id, tagArray)
          }
        }
      }

      toast({
        title: "Success",
        description: "OpenAPI specification processed successfully",
      })
    } catch (error) {
      const processingTime = performance.now() - startTime
      const message = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(message, source || "", sourceType || "url", processingTime)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setUrl("")
    setRawText("")
    setTags("")
    clearState()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      processOpenAPI()
    }
  }

  const generatePostmanCollection = async () => {
    if (!result || !url.trim()) {
      toast({
        title: "Error",
        description: "Please fetch an OpenAPI specification first",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingPostman(true)

    try {
      processOpenAPI()
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPostman(false)
    }
  }

  const historyCount = searchHistory.length
  const bookmarkCount = bookmarks.length

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">OpenAPI Specification URL</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://petstore3.swagger.io/api/v3/openapi.json"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={processOpenAPI} disabled={isLoading || (!url.trim() && !rawText.trim())} className="flex-1">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Processing..." : "Fetch & Convert"}
          </Button>
          <Button variant="ghost" onClick={handleReset} disabled={isLoading}>
            Reset
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <History className="h-4 w-4" />
            <span>{historyCount} searches</span>
          </div>
          <div className="flex items-center gap-1">
            <Bookmark className="h-4 w-4" />
            <span>{bookmarkCount} bookmarks</span>
          </div>
        </div>
      </div>
    </div>
  )
}
