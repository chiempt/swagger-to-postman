"use client"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Download, Copy, RotateCcw, Trash2, ChevronDown, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useOpenAPIStore } from "@/lib/store"
import { JsonViewer } from "@/components/json-viewer"
import { useState } from "react"

export function ResultPanel() {
  const { result, error, source, sourceType, setResult, clearState } = useOpenAPIStore()
  const { toast } = useToast()
  const [isErrorDetailsOpen, setIsErrorDetailsOpen] = useState(false)

  const handleDownload = () => {
    if (!result) return

    const filename = result.info?.title
      ? `${result.info.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-openapi.json`
      : "openapi-export.json"

    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: `File saved as ${filename}`,
    })
  }

  const handleCopy = async () => {
    if (!result) return

    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      toast({
        title: "Copied",
        description: "JSON copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleReRender = async () => {
    if (!source || !sourceType) return

    try {
      if (sourceType === "url") {
        const response = await fetch("/api/fetch-openapi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: source }),
        })

        const apiResult = await response.json()

        if (!apiResult.ok) {
          throw new Error(apiResult.error?.message || "Failed to fetch OpenAPI specification")
        }

        setResult(apiResult.data, source, sourceType)
      } else {
        const { processLocalContent } = await import("@/lib/openapi-processor")
        const processedResult = await processLocalContent(source)
        setResult(processedResult, source, sourceType)
      }

      toast({
        title: "Refreshed",
        description: "Content re-processed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to re-process content",
        variant: "destructive",
      })
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Collapsible open={isErrorDetailsOpen} onOpenChange={setIsErrorDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              Details
              <ChevronDown className={`h-4 w-4 transition-transform ${isErrorDetailsOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{error}</pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Enter a URL, paste content, or upload a file to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Converted JSON</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleReRender}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Re-render
          </Button>
          <Button variant="ghost" size="sm" onClick={clearState}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      <JsonViewer 
        data={result} 
        title={result.info?.title || "OpenAPI Specification"}
      />
    </div>
  )
}
