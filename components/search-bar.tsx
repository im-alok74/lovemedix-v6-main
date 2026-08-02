"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Suggestion {
  id: number
  name: string
  generic_name: string | null
}

interface SearchBarProps {
  className?: string
  compact?: boolean
  showButton?: boolean
  initialQuery?: string
}

export function SearchBar({ className, compact = false, showButton = true, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
          setShowSuggestions(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    if (abortRef.current) {
      abortRef.current.abort()
    }

    setIsLoading(true)
    debounceRef.current = window.setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch(`/api/medicines/search?q=${encodeURIComponent(searchQuery)}&limit=8`, {
          signal: controller.signal,
        })
        const data = await response.json()
        setSuggestions(data.medicines || [])
        setShowSuggestions(true)
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          console.error("Error fetching suggestions:", error)
          setSuggestions([])
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
        }
        setIsLoading(false)
      }
    }, 150)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (value.trim()) {
      fetchSuggestions(value)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedQuery = query.trim()
    if (trimmedQuery) {
      setShowSuggestions(false)
      router.push(`/medicines?search=${encodeURIComponent(trimmedQuery)}`)
    } else {
      router.push("/medicines")
    }
  }

  const handleSuggestionClick = (medicine: Suggestion) => {
    router.push(`/medicines?search=${encodeURIComponent(medicine.name)}`)
    setShowSuggestions(false)
  }

  const clearSearch = () => {
    setQuery("")
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSearch} className={cn("relative w-full", className)}>
      <div className={cn("flex w-full gap-2", compact && "gap-1.5")}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search for medicines..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (query.trim() && suggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            className={cn("h-11 rounded-2xl border-border/70 bg-background/90 pl-10 pr-10 shadow-sm", compact && "h-10")}
          />
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}

          {showSuggestions && suggestions.length > 0 ? (
            <div ref={suggestionsRef} className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-border bg-background shadow-lg">
              {suggestions.map((medicine) => (
                <button
                  key={medicine.id}
                  type="button"
                  onClick={() => handleSuggestionClick(medicine)}
                  className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left last:border-b-0 transition hover:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{medicine.name}</p>
                    {medicine.generic_name ? <p className="truncate text-xs text-muted-foreground">{medicine.generic_name}</p> : null}
                  </div>
                  <Search className="ml-2 h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </button>
              ))}
            </div>
          ) : null}

          {showSuggestions && query.trim() && suggestions.length === 0 && !isLoading ? (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-border bg-background p-4 text-center text-muted-foreground shadow-lg">
              No medicines found matching “{query}”
            </div>
          ) : null}

          {isLoading ? (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-border bg-background p-4 text-center text-muted-foreground shadow-lg">
              Searching...
            </div>
          ) : null}
        </div>
        {showButton ? <Button type="submit" className={cn(compact && "h-10 px-4")}>Search</Button> : null}
      </div>
    </form>
  )
}
