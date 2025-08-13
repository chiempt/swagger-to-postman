"use client"

import { create } from "zustand"

interface OpenAPIState {
  result: any | null
  error: string | null
  source: string | null
  sourceType: "url" | "text" | null
  setResult: (data: any, source: string, sourceType: "url" | "text") => void
  setError: (error: string) => void
  clearState: () => void
}

export const useOpenAPIStore = create<OpenAPIState>((set) => ({
  result: null,
  error: null,
  source: null,
  sourceType: null,
  setResult: (data, source, sourceType) => set({ result: data, error: null, source, sourceType }),
  setError: (error) => set({ error, result: null }),
  clearState: () => set({ result: null, error: null, source: null, sourceType: null }),
}))
