"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { HeroSection } from "@/components/landing/hero-section"
import { PersonalizedEventSection } from "@/components/landing/personalized-event-section"
import { ArtistSection } from "@/components/landing/artist-section"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/app/providers"
import { toEventCardData } from "@/lib/event-helpers"
import { apiRequest } from "@/lib/api/client"
import type { EventSummary } from "@/types/api"

function calcAge(dob: string | null): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (isNaN(birth.getTime())) return null
  const now = new Date()
  return Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function matchesUser(event: EventSummary, profession: string | null, age: number | null): boolean {
  const range = event.audienceRange as Record<string, unknown>
  const minAge = typeof range.minAge === "number" ? range.minAge : null
  const maxAge = typeof range.maxAge === "number" ? range.maxAge : null

  if (age !== null && minAge !== null && maxAge !== null) {
    if (age < minAge || age > maxAge) return false
  }

  if (profession) {
    const target = event.targetAudience as Record<string, boolean>
    const keys = Object.keys(target).filter((k) => target[k])
    if (keys.length > 0) {
      const profLower = profession.toLowerCase()
      const matched = keys.some((k) => profLower.includes(k.toLowerCase()) || k.toLowerCase().includes(profLower))
      if (!matched) return false
    }
  }

  return true
}

function DashboardContent() {
  const { profile } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ["public-events"],
    queryFn: () =>
      apiRequest<{ data: { events: EventSummary[] } }>("/events").then((r) => r.data.events),
    staleTime: 60_000,
  })

  const age = useMemo(() => calcAge(profile?.dob ?? null), [profile?.dob])

  const allCards = useMemo(() => (data ?? []).map(toEventCardData), [data])

  const personalizedCards = useMemo(() => {
    if (!data || data.length === 0) return []
    const hasFilter = profile?.profession || age !== null
    if (!hasFilter) return allCards
    const filtered = data.filter((e) => matchesUser(e, profile?.profession ?? null, age))
    return filtered.map(toEventCardData)
  }, [data, profile?.profession, age, allCards])

  const affordableCards = useMemo(
    () => allCards.filter((e) => e.numericPrice === 0 || e.numericPrice <= 499),
    [allCards],
  )

  return (
    <div className="min-h-screen">
      <main className="flex flex-col gap-2">
        <HeroSection />
        <br />

        <PersonalizedEventSection
          title="Experiences for You"
          events={personalizedCards}
          isLoading={isLoading}
          showExploreOnEmpty
        />

        <ArtistSection />

        <PersonalizedEventSection
          title="Pocket-Friendly (Under Rs 499)"
          events={affordableCards}
          isLoading={isLoading}
        />
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
