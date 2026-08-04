"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Clock3, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

type MedicineSuggestion = {
  id: number
  name: string
  generic_name: string | null
  category: string | null
  manufacturer: string | null
}

const RECENT_KEY = "davaa_recent_medicine_searches"
const MAX_RECENT = 6

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim()
  if (!trimmed) return <>{text}</>

  const parts = text.split(new RegExp(`(${escapeRegex(trimmed)})`, "ig"))
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <span key={`${part}-${index}`} className="font-semibold text-foreground">
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  )
}

function loadRecentSearches() {
  if (typeof window === "undefined") return []
  try {
    const stored = window.localStorage.getItem(RECENT_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? (parsed.filter((item): item is string => typeof item === "string") as string[]) : []
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === "undefined") return
  try {
    const current = loadRecentSearches()
    const next = [query, ...current.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, MAX_RECENT)
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage failures.
  }
}

export function HeroSearch() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<MedicineSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setRecentSearches(loadRecentSearches())
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      setIsLoading(false)
      setActiveIndex(-1)
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
        const response = await fetch(`/api/medicines/search?q=${encodeURIComponent(query)}&limit=8`, {
          signal: controller.signal,
        })
        const data = await response.json()
        setSuggestions((data.medicines || []) as MedicineSuggestion[])
        setIsOpen(true)
        setActiveIndex(-1)
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          setSuggestions([])
          setIsOpen(true)
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
        }
        setIsLoading(false)
      }
    }, 180)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const visibleItems = useMemo(() => {
    if (query.trim()) return suggestions
    return recentSearches
  }, [query, recentSearches, suggestions])

  const closeDropdown = () => {
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const pushSearch = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      router.push("/medicines")
      return
    }

    saveRecentSearch(trimmed)
    setRecentSearches(loadRecentSearches())
    router.push(`/medicines?search=${encodeURIComponent(trimmed)}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    pushSearch(query)
    closeDropdown()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true)
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, visibleItems.length - 1))
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, -1))
      return
    }

    if (e.key === "Enter" && activeIndex >= 0 && query.trim()) {
      const selected = suggestions[activeIndex]
      if (selected) {
        e.preventDefault()
        pushSearch(selected.name)
        closeDropdown()
      }
    }

    if (e.key === "Escape") {
      closeDropdown()
    }
  }

  const selectSuggestion = (name: string) => {
    setQuery(name)
    pushSearch(name)
    closeDropdown()
  }

  const clearSearch = () => {
    setQuery("")
    setSuggestions([])
    setIsOpen(true)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const showRecent = isOpen && !query.trim() && recentSearches.length > 0
  const showResults = isOpen && (query.trim().length > 0 || suggestions.length > 0 || isLoading)

  return (
    <div ref={containerRef} className="relative z-40 mx-auto w-full max-w-3xl isolate">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search Medicines"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="h-14 rounded-2xl border-border/70 bg-background pl-14 pr-12 text-base shadow-[0_16px_40px_-20px_rgba(15,23,42,0.35)] ring-0 placeholder:text-muted-foreground/80 focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/10 sm:h-16 sm:rounded-[1.25rem] sm:pl-14 sm:text-lg"
          />
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {showResults || showRecent ? (
          <div className="absolute left-0 top-full z-[60] mt-3 w-full overflow-hidden rounded-2xl border border-border/80 bg-white/98 shadow-[0_28px_80px_-24px_rgba(15,23,42,0.42)] ring-1 ring-black/5 backdrop-blur-sm">
            <div className="max-h-[24rem] overflow-y-auto">
              {isLoading ? (
                <div className="space-y-3 p-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-xl p-3">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : showRecent ? (
                <div className="p-2">
                  <div className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Recent searches
                  </div>
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => selectSuggestion(item)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-muted"
                    >
                      <Clock3 className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate text-sm font-medium text-foreground">{item}</span>
                    </button>
                  ))}
                </div>
              ) : suggestions.length > 0 ? (
                <div className="py-2">
                  {suggestions.map((medicine, index) => (
                    <button
                      key={medicine.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectSuggestion(medicine.name)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition",
                        index === activeIndex ? "bg-primary/5" : "hover:bg-muted/70",
                      )}
                    >
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Search className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          <HighlightedText text={medicine.name} query={query} />
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {medicine.generic_name ? (
                            <span className="truncate">
                              <HighlightedText text={medicine.generic_name} query={query} />
                            </span>
                          ) : null}
                          {medicine.category ? <span>{medicine.category}</span> : null}
                          {medicine.manufacturer ? <span>{medicine.manufacturer}</span> : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">No medicines found</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try a different medicine or brand name.</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </form>
    </div>
  )
}
