"use client"

import { useEffect, useMemo, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/app/providers"
import { SuggestedEventCard } from "@/components/events/suggested-event-card"
import { apiRequest } from "@/lib/api/client"
import {
  getSuggestedEventsRedirectPath,
  markSuggestedEventInterest,
  SUGGESTED_EVENTS_SECTION_ID,
} from "@/lib/suggested-events"
import type { SuggestedEventSummary } from "@/types/api"

export function SuggestedEventsSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const sectionRef = useRef<HTMLElement>(null)
  const hasScrolledToSectionRef = useRef(false)

  const query = useQuery({
    queryKey: ["suggested-events", user?.id ?? "guest"],
    queryFn: async () => {
      const response = await apiRequest<{ data: { suggestedEvents: SuggestedEventSummary[] } }>("/events/suggested", {
        auth: Boolean(user),
      })

      return response.data.suggestedEvents
    },
  })

  useEffect(() => {
    if (hasScrolledToSectionRef.current) return
    if (searchParams.get("suggested") !== "1") return
    if (query.isLoading) return

    hasScrolledToSectionRef.current = true
    window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 120)
  }, [query.isLoading, searchParams])

  const interestMutation = useMutation({
    mutationFn: async (suggestedEventId: string) => markSuggestedEventInterest(suggestedEventId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["suggested-events"] })
    },
  })

  const actionByEventId = useMemo(() => {
    const map = new Map<string, { label: string; disabled: boolean; onAction: () => void }>()

    for (const event of query.data ?? []) {
      if (!user) {
        map.set(event.id, {
          label: "Sign up to support",
          disabled: false,
          onAction: () =>
            router.push(`/?auth=register&redirect=${encodeURIComponent(getSuggestedEventsRedirectPath())}`),
        })
        continue
      }

      if (user.onboardingStatus !== "COMPLETED") {
        map.set(event.id, {
          label: "Complete onboarding",
          disabled: false,
          onAction: () =>
            router.push(`/onboarding?next=${encodeURIComponent(getSuggestedEventsRedirectPath())}`),
        })
        continue
      }

      if (event.interestedByCurrentUser) {
        map.set(event.id, {
          label: "Interested",
          disabled: true,
          onAction: () => {},
        })
        continue
      }

      map.set(event.id, {
        label: "I'm Interested",
        disabled: false,
        onAction: () => interestMutation.mutate(event.id),
      })
    }

    return map
  }, [interestMutation, query.data, router, user])

  return (
    <section
      ref={sectionRef}
      id={SUGGESTED_EVENTS_SECTION_ID}
      className="container mx-auto px-4 py-10 scroll-mt-28"
    >
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-800/70">Community Picks</p>
          <h2 className="mt-2 font-bricolage text-3xl text-brand-900 md:text-4xl">Suggested Events</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Fresh event ideas from the community. Each idea needs at least 3 interested people within 15 days to stay live.
          </p>
        </div>
      </div>

      {query.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[22rem] animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : query.isError ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-600">
          Suggested events could not be loaded right now. Please try again in a moment.
        </div>
      ) : (query.data?.length ?? 0) === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <h3 className="text-xl font-semibold text-slate-900">No suggested events yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Be the first to pitch an idea and invite others to show interest.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {query.data?.map((event) => {
            const action = actionByEventId.get(event.id)

            return (
              <SuggestedEventCard
                key={event.id}
                event={event}
                actionLabel={action?.label ?? "I'm Interested"}
                actionDisabled={action?.disabled ?? false}
                actionLoading={interestMutation.isPending && interestMutation.variables === event.id}
                onAction={action?.onAction ?? (() => {})}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
