"use client"

import { apiRequest } from "@/lib/api/client"
import type { SuggestedEventSummary } from "@/types/api"

export type SuggestedEventDraft = {
  title: string
  location: string
  category: string
  month: string
  description: string
}

export const EMPTY_SUGGESTED_EVENT_DRAFT: SuggestedEventDraft = {
  title: "",
  location: "",
  category: "",
  month: "",
  description: "",
}

export const SUGGESTED_EVENT_DRAFT_STORAGE_KEY = "baatasari-suggested-event-draft"
export const SUGGESTED_EVENT_FORM_ID = "suggest-event-form"
export const SUGGESTED_EVENTS_SECTION_ID = "suggested-events"
export const SUGGESTED_EVENT_RESUME_PARAM = "resumeSuggestion"
export const COMPLETE_SUGGESTED_EVENT_PARAM = "completeSuggestedEvent"

export const normalizeSuggestedEventDraft = (draft: SuggestedEventDraft): SuggestedEventDraft => ({
  title: draft.title.trim(),
  location: draft.location.trim(),
  category: draft.category.trim(),
  month: draft.month.trim(),
  description: draft.description.trim(),
})

export const draftHasAnyValue = (draft: SuggestedEventDraft) =>
  Object.values(draft).some((value) => value.trim().length > 0)

export const isSuggestedEventDraftComplete = (draft: SuggestedEventDraft) =>
  Object.values(normalizeSuggestedEventDraft(draft)).every((value) => value.length > 0)

export const readSuggestedEventDraft = (): SuggestedEventDraft => {
  if (typeof window === "undefined") return EMPTY_SUGGESTED_EVENT_DRAFT

  try {
    const stored = window.localStorage.getItem(SUGGESTED_EVENT_DRAFT_STORAGE_KEY)
    if (!stored) return EMPTY_SUGGESTED_EVENT_DRAFT

    return {
      ...EMPTY_SUGGESTED_EVENT_DRAFT,
      ...(JSON.parse(stored) as Partial<SuggestedEventDraft>),
    }
  } catch {
    return EMPTY_SUGGESTED_EVENT_DRAFT
  }
}

export const writeSuggestedEventDraft = (draft: SuggestedEventDraft) => {
  if (typeof window === "undefined") return

  const normalized = normalizeSuggestedEventDraft(draft)
  if (!draftHasAnyValue(normalized)) {
    window.localStorage.removeItem(SUGGESTED_EVENT_DRAFT_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(SUGGESTED_EVENT_DRAFT_STORAGE_KEY, JSON.stringify(normalized))
}

export const clearSuggestedEventDraft = () => {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(SUGGESTED_EVENT_DRAFT_STORAGE_KEY)
}

export const getSuggestedEventsRedirectPath = () => `/events?suggested=1#${SUGGESTED_EVENTS_SECTION_ID}`

export const getSuggestedEventResumePath = () =>
  `/events?${SUGGESTED_EVENT_RESUME_PARAM}=1#${SUGGESTED_EVENT_FORM_ID}`

export const getSuggestedEventOnboardingPath = () =>
  `/onboarding?next=${encodeURIComponent(getSuggestedEventsRedirectPath())}&${COMPLETE_SUGGESTED_EVENT_PARAM}=1`

export const createSuggestedEventFromDraft = async (draft: SuggestedEventDraft) => {
  const response = await apiRequest<{ data: { suggestedEvent: SuggestedEventSummary } }>("/events/suggested", {
    method: "POST",
    auth: true,
    body: JSON.stringify(normalizeSuggestedEventDraft(draft)),
  })

  return response.data.suggestedEvent
}

export const markSuggestedEventInterest = async (suggestedEventId: string) => {
  const response = await apiRequest<{ data: { suggestedEvent: SuggestedEventSummary } }>(
    `/events/suggested/${suggestedEventId}/interest`,
    {
      method: "POST",
      auth: true,
    }
  )

  return response.data.suggestedEvent
}
