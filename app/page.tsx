import { Header } from "@/components/header"
import { SourceForm } from "@/components/source-form"
import { ResultPanel } from "@/components/result-panel"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="backdrop-blur-sm bg-card/80 border border-border/50 rounded-2xl shadow-xl p-8 space-y-8">
          <SourceForm />
          <ResultPanel />
        </div>
      </main>
    </div>
  )
}
