"use client"
import { useEffect } from "react"

export default function AdBanner() {
  useEffect(() => {
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || []
      (window as any).adsbygoogle.push({})
    } catch (e) {
      console.error("Adsense error", e)
    }
  }, [])

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-6563309015438012"
      data-ad-slot="1234567890"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
