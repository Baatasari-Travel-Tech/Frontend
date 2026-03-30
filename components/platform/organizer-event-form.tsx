"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Camera, Plus, Trash2 } from "lucide-react"
import { uploadFile } from "@/lib/api/uploads"
import type { EventDetail } from "@/types/api"

const tierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tier name is required"),
  description: z.string().optional(),
  quantity: z.coerce.number().int().positive("Quantity must be greater than zero"),
  price: z.coerce.number().nonnegative("Price cannot be negative"),
})

const schema = z.object({
  title: z.string().min(2, "Enter an event title"),
  description: z.string().min(20, "Add a stronger event description"),
  date: z.string().min(1, "Select the event date and time"),
  venue: z.string().min(2, "Enter a venue"),
  capacity: z.coerce.number().int().positive("Capacity must be greater than zero"),
  category: z.string().optional(),
  tagline: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  googleMapsUrl: z.string().url("Enter a valid maps URL").or(z.literal("")).optional(),
  ticketTiers: z.array(tierSchema).min(1, "Add at least one ticket tier"),
})

export type OrganizerEventFormValues = z.infer<typeof schema>

function toLocalDateTimeInput(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  const hours = `${date.getHours()}`.padStart(2, "0")
  const minutes = `${date.getMinutes()}`.padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function OrganizerEventForm({
  mode,
  initialEvent,
  onSubmit,
}: {
  mode: "create" | "edit"
  initialEvent?: EventDetail | null
  onSubmit: (payload: Record<string, unknown>) => Promise<void>
}) {
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<OrganizerEventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialEvent?.title ?? "",
      description: initialEvent?.description ?? "",
      date: toLocalDateTimeInput(initialEvent?.date),
      venue: initialEvent?.venue ?? "",
      capacity: initialEvent?.capacity ?? 100,
      category: initialEvent?.category ?? "",
      tagline: initialEvent?.tagline ?? "",
      startTime: initialEvent?.startTime ?? "",
      endTime: initialEvent?.endTime ?? "",
      googleMapsUrl: initialEvent?.googleMapsUrl ?? "",
      ticketTiers:
        initialEvent?.ticketTiers?.map((tier) => ({
          id: tier.id,
          name: tier.name,
          description: tier.description ?? "",
          quantity: tier.quantity,
          price: tier.price,
        })) ?? [{ name: "General Admission", description: "", quantity: 100, price: 499 }],
    },
  })
  const tiers = useFieldArray({
    control: form.control,
    name: "ticketTiers",
  })

  useEffect(() => {
    form.reset({
      title: initialEvent?.title ?? "",
      description: initialEvent?.description ?? "",
      date: toLocalDateTimeInput(initialEvent?.date),
      venue: initialEvent?.venue ?? "",
      capacity: initialEvent?.capacity ?? 100,
      category: initialEvent?.category ?? "",
      tagline: initialEvent?.tagline ?? "",
      startTime: initialEvent?.startTime ?? "",
      endTime: initialEvent?.endTime ?? "",
      googleMapsUrl: initialEvent?.googleMapsUrl ?? "",
      ticketTiers:
        initialEvent?.ticketTiers?.map((tier) => ({
          id: tier.id,
          name: tier.name,
          description: tier.description ?? "",
          quantity: tier.quantity,
          price: tier.price,
        })) ?? [{ name: "General Admission", description: "", quantity: 100, price: 499 }],
    })
  }, [form, initialEvent])

  const handleSubmit = form.handleSubmit(async (values) => {
    setError(null)
    setMessage(null)

    try {
      let heroImageUrl = initialEvent?.heroImageUrl ?? null
      let heroImagePublicId = initialEvent?.heroImagePublicId ?? null

      if (heroFile) {
        const upload = await uploadFile(heroFile, "eventAsset")
        heroImageUrl = upload.secureUrl
        heroImagePublicId = upload.publicId
      }

      await onSubmit({
        title: values.title,
        description: values.description,
        date: new Date(values.date).toISOString(),
        venue: values.venue,
        capacity: values.capacity,
        category: values.category || null,
        tagline: values.tagline || null,
        startTime: values.startTime || null,
        endTime: values.endTime || null,
        googleMapsUrl: values.googleMapsUrl || null,
        heroImageUrl,
        heroImagePublicId,
        published: true,
        ticketTiers: values.ticketTiers.map((tier) => ({
          id: tier.id,
          name: tier.name,
          description: tier.description || null,
          quantity: tier.quantity,
          price: tier.price,
        })),
      })

      setMessage(mode === "create" ? "Event created successfully." : "Event updated successfully.")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Event submission failed.")
    }
  })

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Event title</label>
          <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("title")} />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.title?.message ?? ""}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Category</label>
          <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("category")} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea className="mt-2 min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("description")} />
        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.description?.message ?? ""}</p>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Tagline</label>
        <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("tagline")} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Date and time</label>
          <input type="datetime-local" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("date")} />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.date?.message ?? ""}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Venue</label>
          <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("venue")} />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.venue?.message ?? ""}</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Capacity</label>
          <input type="number" min={1} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("capacity", { valueAsNumber: true })} />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.capacity?.message ?? ""}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Start time label</label>
          <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="6:00 PM" {...form.register("startTime")} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">End time label</label>
          <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="11:00 PM" {...form.register("endTime")} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Google Maps URL</label>
        <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("googleMapsUrl")} />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Hero image</label>
        <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <Camera className="h-4 w-4 text-brand-900" />
          <span>{heroFile ? heroFile.name : "Upload an event hero asset"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={(event) => setHeroFile(event.target.files?.[0] ?? null)} />
        </label>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Ticket tiers</h3>
            <p className="mt-1 text-sm text-slate-600">Create at least one purchasable ticket tier for checkout.</p>
          </div>
          <button
            type="button"
            onClick={() => tiers.append({ name: "", description: "", quantity: 50, price: 999 })}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <Plus className="h-4 w-4" />
            Add tier
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {tiers.fields.map((field, index) => (
            <div key={field.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-950">Tier {index + 1}</p>
                {tiers.fields.length > 1 ? (
                  <button type="button" onClick={() => tiers.remove(index)} className="text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input type="hidden" {...form.register(`ticketTiers.${index}.id`)} />
                <div>
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register(`ticketTiers.${index}.name`)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register(`ticketTiers.${index}.description`)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Quantity</label>
                  <input type="number" min={1} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register(`ticketTiers.${index}.quantity`, { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Price</label>
                  <input type="number" min={0} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register(`ticketTiers.${index}.price`, { valueAsNumber: true })} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

      <button type="submit" disabled={form.formState.isSubmitting} className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {form.formState.isSubmitting ? "Saving..." : mode === "create" ? "Create event" : "Save event"}
      </button>
    </form>
  )
}
