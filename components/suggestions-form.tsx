"use client"

import { useEffect, useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/app/providers"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/hooks/use-local-storage"
import {
  LOCATIONS,
  CATEGORIES,
  MONTHS,
  type ComboboxItem as ComboboxItemType,
} from "@/lib/suggestions-data"
import {
  clearSuggestedEventDraft,
  createSuggestedEventFromDraft,
  draftHasAnyValue,
  EMPTY_SUGGESTED_EVENT_DRAFT,
  getSuggestedEventOnboardingPath,
  getSuggestedEventResumePath,
  getSuggestedEventsRedirectPath,
  isSuggestedEventDraftComplete,
  normalizeSuggestedEventDraft,
  SUGGESTED_EVENT_DRAFT_STORAGE_KEY,
  SUGGESTED_EVENT_FORM_ID,
  SUGGESTED_EVENT_RESUME_PARAM,
  type SuggestedEventDraft,
} from "@/lib/suggested-events"

type SuggestionsFormProps = {
  autoScrollOnDraft?: boolean
}

export default function SuggestionsForm({ autoScrollOnDraft = false }: SuggestionsFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const sectionRef = useRef<HTMLElement>(null)
  const hasScrolledToDraftRef = useRef(false)
  const resumeHandledRef = useRef(false)
  const [draft, setDraft, isDraftReady] = useLocalStorage<SuggestedEventDraft>(
    SUGGESTED_EVENT_DRAFT_STORAGE_KEY,
    EMPTY_SUGGESTED_EVENT_DRAFT
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const inputClass =
    "w-full px-5 py-1 md:py-3 h-8 md:h-auto rounded-lg bg-(--white) dark:bg-(--white) text-(--gray-800) placeholder-(--gray-500) focus:outline-none focus:ring-2 focus:ring-(--white)/40 text-sm md:text-base border-0"

  const comboboxWrapperClass =
    "w-full h-8 md:h-auto rounded-lg border-0 bg-(--white) dark:bg-(--white) shadow-none"

  const comboboxInputClass =
    "h-8 md:h-auto rounded-lg border-0 bg-(--white) dark:bg-(--white) px-5 py-1 md:py-3 text-(--gray-800) placeholder-(--gray-500) focus:outline-none focus:ring-0 text-sm md:text-base"

  const labelClass =
    "font-albert font-medium text-[16px] leading-[24px] tracking-[0] text-(--white) mb-[14px] block"

  const createMutation = useMutation({
    mutationFn: async (currentDraft: SuggestedEventDraft) => createSuggestedEventFromDraft(currentDraft),
    onSuccess: async () => {
      clearSuggestedEventDraft()
      setDraft(EMPTY_SUGGESTED_EVENT_DRAFT)
      setSuccess("Your event idea has been added to Suggested Events.")
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ["suggested-events"] })
      router.replace(getSuggestedEventsRedirectPath())
    },
    onError: (submitError) => {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not save your event idea. Please try again."
      )
    },
  })

  useEffect(() => {
    if (!autoScrollOnDraft || !isDraftReady || hasScrolledToDraftRef.current) return
    if (!draftHasAnyValue(draft)) return

    hasScrolledToDraftRef.current = true
    window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 120)
  }, [autoScrollOnDraft, draft, isDraftReady])

  useEffect(() => {
    if (!isDraftReady || resumeHandledRef.current) return
    if (searchParams.get(SUGGESTED_EVENT_RESUME_PARAM) !== "1") return
    if (!draftHasAnyValue(draft)) {
      resumeHandledRef.current = true
      return
    }
    if (!user) return

    resumeHandledRef.current = true

    if (user.onboardingStatus !== "COMPLETED") {
      router.replace(getSuggestedEventOnboardingPath())
      return
    }

    if (!isSuggestedEventDraftComplete(draft)) {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      setError("Finish the missing suggestion details and then click Let's Create.")
      return
    }

    setError(null)
    setSuccess(null)
    createMutation.mutate(normalizeSuggestedEventDraft(draft))
  }, [createMutation, draft, isDraftReady, router, searchParams, user])

  const updateDraft = <K extends keyof SuggestedEventDraft>(key: K, value: SuggestedEventDraft[K]) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedDraft = normalizeSuggestedEventDraft(draft)

    setError(null)
    setSuccess(null)

    if (!isSuggestedEventDraftComplete(normalizedDraft)) {
      setError("Please complete all the suggestion fields before continuing.")
      return
    }

    if (!user) {
      setDraft(normalizedDraft)
      router.push(`/?auth=register&redirect=${encodeURIComponent(getSuggestedEventResumePath())}`)
      return
    }

    if (user.onboardingStatus !== "COMPLETED") {
      setDraft(normalizedDraft)
      router.push(getSuggestedEventOnboardingPath())
      return
    }

    createMutation.mutate(normalizedDraft)
  }

  const ComboboxField = ({
    items,
    value,
    onValueChange,
    placeholder,
  }: {
    items: ComboboxItemType[]
    value: string
    onValueChange: (nextValue: string) => void
    placeholder: string
  }) => {
    const [inputValue, setInputValue] = useState("")
    const query = inputValue.trim().toLowerCase()
    const filteredItems =
      query.length === 0
        ? items
        : items.filter((item) => item.label.toLowerCase().startsWith(query))

    return (
      <Combobox
        value={value || null}
        onValueChange={(nextValue) => onValueChange(nextValue ?? "")}
        onInputValueChange={(nextInputValue) => setInputValue(nextInputValue)}
      >
        <ComboboxInput
          placeholder={placeholder}
          className={comboboxWrapperClass}
          inputClassName={comboboxInputClass}
        />
        <ComboboxContent>
          <ComboboxList>
            {filteredItems.map((item) => (
              <ComboboxItem key={item.value} value={item.value}>
                {item.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    )
  }

  return (
    <section ref={sectionRef} id={SUGGESTED_EVENT_FORM_ID} className="scroll-mt-28">
      <div className="mx-auto px-1 md:px-2 max-w-8xl">
        <div className="rounded-[5rem] bg-(--brand-blue) px-12 py-12 md:px-26">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="font-bricolage font-semibold text-3xl md:text-[48px] leading-tight md:leading-15 tracking-[-0.02em] text-(--white) mb-4">
              Got an Event Idea? Let&apos;s Make It Happen.
            </h2>

            <p className="font-albert font-normal text-[20px] leading-6 tracking-[0.5px] text-(--white) mb-5">
              At Baatasari, We believe that your city isn&apos;t shaped by the organizers alone - it&apos;s
              shaped by you.
              Have something you&apos;d love to see? A beach art night? A food festival? A music jam? A fitness meetup? Submit your idea below. If enough people are interested, local organizers can bring it to life. Because great events start with great ideas.
            </p>
          </div><br/>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Top row */}
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <label className={labelClass}>Event Name</label>
                <Input
                  type="text"
                  placeholder="Ex: Prom Night"
                  className={inputClass}
                  value={draft.title}
                  onChange={(event) => updateDraft("title", event.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Location</label>
                <ComboboxField
                  items={LOCATIONS}
                  value={draft.location}
                  onValueChange={(nextValue) => updateDraft("location", nextValue)}
                  placeholder="Select Location"
                />
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <ComboboxField
                  items={CATEGORIES}
                  value={draft.category}
                  onValueChange={(nextValue) => updateDraft("category", nextValue)}
                  placeholder="Select Category"
                />
              </div>

              <div>
                <label className={labelClass}>Month</label>
                <ComboboxField
                  items={MONTHS}
                  value={draft.month}
                  onValueChange={(nextValue) => updateDraft("month", nextValue)}
                  placeholder="Select Month"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Describe your suggestion.</label>
              <Textarea
                rows={4}
                placeholder="Ex: I would like to have an art event at RK Beach..."
                className={`${inputClass} resize-none h-auto md:h-auto py-3`}
                value={draft.description}
                onChange={(event) => updateDraft("description", event.target.value)}
              />
            </div>

            {error ? (
              <div className="rounded-3xl border border-rose-200/60 bg-white/92 px-5 py-3 text-sm text-rose-600">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-3xl border border-emerald-200/60 bg-white/92 px-5 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            {/* Submit */}
            <div className="pt-6 flex justify-center">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full max-w-120 h-15 px-5 py-4.5 rounded-full bg-brand-900 border border-brand-900 text-(--white) font-inter font-semibold text-[16px] leading-6 tracking-[0] flex items-center justify-center transition hover:bg-(--brand-navy)/90"
              >
                {createMutation.isPending ? "Saving..." : "Let's Create"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
