"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { SourceForm } from "@/components/source-form"
import { ResultPanel } from "@/components/result-panel"
import { Dashboard } from "@/components/dashboard"
import { SearchHistory } from "@/components/search-history"
import { QuickSearch } from "@/components/quick-search"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Zap, 
  BarChart3, 
  History, 
  Home,
  Search,
  TrendingUp
} from "lucide-react"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("converter")

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="backdrop-blur-sm bg-card/80 border border-border/50 rounded-2xl shadow-xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              OpenAPI Postman Converter
            </h1>
            <p className="text-muted-foreground">
              Convert, analyze, and manage your OpenAPI specifications with powerful tools
            </p>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="converter" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Converter
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="converter" className="mt-6">
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Search className="h-5 w-5" />
                    <span className="text-lg">Convert OpenAPI to Postman</span>
                  </div>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Paste a URL, upload a file, or enter content directly to convert your OpenAPI specification 
                    to Postman collection format. All conversions are automatically saved to your history.
                  </p>
                </div>
                
                <SourceForm />
                <ResultPanel />
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="mt-6">
              <Dashboard />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <SearchHistory />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <TrendingUp className="h-16 w-16 mx-auto text-primary/60" />
                  <h2 className="text-2xl font-bold">Advanced Analytics</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Deep insights into your API usage patterns, performance metrics, and search behavior.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Performance Analysis</h3>
                    <p className="text-muted-foreground">
                      Detailed breakdown of response times, success rates, and optimization opportunities.
                    </p>
                  </div>
                  
                  <div className="p-6 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Usage Patterns</h3>
                    <p className="text-muted-foreground">
                      Understand when and how you use different APIs, helping optimize your workflow.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
