"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Globe, 
  Code, 
  FileText, 
  Zap, 
  Database, 
  Cloud, 
  MessageSquare,
  CreditCard,
  Camera,
  Music,
  Video,
  MapPin,
  ShoppingCart,
  Users,
  Calendar,
  Clock,
  Star,
  TrendingUp
} from "lucide-react"
import { useOpenAPIStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

interface QuickSearchItem {
  name: string
  url: string
  description: string
  icon: React.ReactNode
  category: string
  popularity: number
}

const popularAPIs: QuickSearchItem[] = [
  {
    name: "Pet Store API",
    url: "https://petstore3.swagger.io/api/v3/openapi.json",
    description: "Sample API for testing and learning",
    icon: <Globe className="h-5 w-5" />,
    category: "Sample",
    popularity: 95
  },
  {
    name: "GitHub API",
    url: "https://api.github.com/openapi.json",
    description: "GitHub's REST API for repositories and users",
    icon: <Code className="h-5 w-5" />,
    category: "Development",
    popularity: 90
  },
  {
    name: "Stripe API",
    url: "https://api.stripe.com/openapi.json",
    description: "Payment processing and financial services",
    icon: <CreditCard className="h-5 w-5" />,
    category: "Finance",
    popularity: 85
  },
  {
    name: "OpenAI API",
    url: "https://api.openai.com/openapi.json",
    description: "AI and machine learning services",
    icon: <Zap className="h-5 w-5" />,
    category: "AI/ML",
    popularity: 88
  },
  {
    name: "Twilio API",
    url: "https://api.twilio.com/openapi.json",
    description: "Communication and messaging services",
    icon: <MessageSquare className="h-5 w-5" />,
    category: "Communication",
    popularity: 82
  },
  {
    name: "AWS API",
    url: "https://api.aws.amazon.com/openapi.json",
    description: "Amazon Web Services APIs",
    icon: <Cloud className="h-5 w-5" />,
    category: "Cloud",
    popularity: 92
  },
  {
    name: "Google Maps API",
    url: "https://maps.googleapis.com/openapi.json",
    description: "Maps and location services",
    icon: <MapPin className="h-5 w-5" />,
    category: "Location",
    popularity: 87
  },
  {
    name: "Spotify API",
    url: "https://api.spotify.com/openapi.json",
    description: "Music streaming and playlist management",
    icon: <Music className="h-5 w-5" />,
    category: "Media",
    popularity: 80
  }
]

export function QuickSearch() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const { searchHistory, setResult, setError, clearState } = useOpenAPIStore()
  const { toast } = useToast()

  const categories = ["all", ...Array.from(new Set(popularAPIs.map(api => api.category)))]

  const filteredAPIs = selectedCategory === "all" 
    ? popularAPIs 
    : popularAPIs.filter(api => api.category === selectedCategory)

  const handleQuickSearch = async (api: QuickSearchItem) => {
    try {
      clearState()
      
      const response = await fetch("/api/fetch-openapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: api.url }),
      })

      const result = await response.json()

      if (!result.ok) {
        throw new Error(result.error?.message || "Failed to fetch OpenAPI specification")
      }

      setResult(result.data, api.url, "url")
      
      toast({
        title: "Quick Search",
        description: `${api.name} loaded successfully`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(message, api.url, "url")
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    }
  }

  const recentSearches = searchHistory.slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Quick Search</h2>
        <p className="text-muted-foreground">
          Get started quickly with popular APIs or explore recent searches
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="whitespace-nowrap"
          >
            {category === "all" ? "All APIs" : category}
          </Button>
        ))}
      </div>

      {/* Popular APIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAPIs.map((api) => (
          <Card 
            key={api.name} 
            className="hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => handleQuickSearch(api)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    {api.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{api.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {api.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{api.popularity}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {api.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono truncate max-w-32">
                  {api.url}
                </span>
                <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  Load API
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSearches.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    if (item.result) {
                      setResult(item.result, item.source, item.sourceType)
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      item.status === "success" ? "bg-green-500" : "bg-red-500"
                    }`} />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
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
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{popularAPIs.length}</div>
            <p className="text-sm text-muted-foreground">Popular APIs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{searchHistory.length}</div>
            <p className="text-sm text-muted-foreground">Total Searches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{categories.length - 1}</div>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
