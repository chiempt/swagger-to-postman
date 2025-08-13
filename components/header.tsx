import { Github } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">OpenAPI → Postman JSON</h1>
            <p className="text-sm text-muted-foreground">Convert OpenAPI specifications to Postman-compatible format</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://github.com/chiempt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
