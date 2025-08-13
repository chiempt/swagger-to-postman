"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Upload, Loader2, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useOpenAPIStore } from "@/lib/store"

export function SourceForm() {
  const [url, setUrl] = useState("")
  const [rawText, setRawText] = useState("")
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingPostman, setIsGeneratingPostman] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { setResult, setError, clearState, result } = useOpenAPIStore()

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
    setIsLoading(true)
    clearState()

    try {
      let source = ""
      let sourceType = ""

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

        setResult(result.data, source, sourceType)
      } else {
        // Process raw text locally
        const { processLocalContent } = await import("@/lib/openapi-processor")
        const result = await processLocalContent(source)
        setResult(result, source, sourceType)
      }

      toast({
        title: "Success",
        description: "OpenAPI specification processed successfully",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(message)
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

      </div>

      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            Advanced Options
            <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="raw-text">Raw Content (JSON/YAML)</Label>
            <Textarea
              id="raw-text"
              placeholder="Paste your OpenAPI specification here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>File Upload</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">Supports .json, .yaml, .yml files</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
