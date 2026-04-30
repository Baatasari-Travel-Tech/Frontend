"use client"

import React, { useState } from "react"
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon, ClockIcon, PlusIcon, Trash2, Upload } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import TimePicker from "@/components/ui/time-picker"
import { cn } from "@/lib/utils"
import type { EventFormData } from "./validateEventform"
import { EVENT_CATEGORIES } from "./data/create-event-data"

interface EventFormProps {
  formData: EventFormData
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  photoPreview: string | null
  setPhotoPreview: (preview: string | null) => void
  photoError: string
  setPhotoError: (error: string) => void
  additionalPhotos: File[]
  setAdditionalPhotos: (photos: File[]) => void
  additionalPhotoPreviews: string[]
  setAdditionalPhotoPreviews: (previews: string[]) => void
  additionalPhotosError: string
  setAdditionalPhotosError: (error: string) => void
  addArrayItem: (arrayName: string) => void
  updateArrayField: (arrayName: string, index: number, field: string, value: unknown) => void
  removeArrayItem?: (arrayName: string, index: number) => void
  openSections: { [key: string]: boolean }
  toggleSection: (section: string) => void
  formErrors: { [key: string]: string }
}

const EventForm: React.FC<EventFormProps> = ({
  formData,
  setFormData,
  handleInputChange,
  photoPreview,
  photoError,
  addArrayItem,
  updateArrayField,
  removeArrayItem,
  openSections,
  toggleSection,
  formErrors,
}) => {
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)

  return (
    <div className="flex flex-col items-start gap-8 w-full">
      <div className="w-full bg-card rounded-2xl border border-ring mb-8">
        <div
          onClick={() => toggleSection("event-info")}
          className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
        >
          <h3 className="text-2xl font-medium text-upcoming-primary-700">Event Information</h3>
          {openSections["event-info"] ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
        </div>

        {openSections["event-info"] && (
          <div className="px-8 pb-8">
            <div className="flex w-full flex-wrap gap-10 items-start">
              <div className="flex flex-col w-64.5 min-w-50 flex-[1_1_258px] max-w-full max-[600px]:w-full">
                <label htmlFor="eventPhoto" className="cursor-pointer block w-full">
                  <div className="flex flex-col h-97 min-h-97 items-center justify-center gap-3.25 px-6 py-5 bg-background rounded-xl border border-dashed border-gray-400 w-full">
                    <input
                      id="eventPhoto"
                      type="file"
                      name="eventPhoto"
                      onChange={handleInputChange}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                    />
                    {photoPreview ? (
                      <Image
                        src={photoPreview}
                        alt="Uploaded event cover"
                        className="h-64 w-auto object-contain max-w-full"
                        width={240}
                        height={360}
                        style={{ objectFit: "cover", borderRadius: "8px" }}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-gray-900" />
                        <span className="font-normal text-gray-900 text-lg">Upload Cover Image *</span>
                      </div>
                    )}
                  </div>
                </label>
                {photoError ? <span className="text-danger-red text-xs mt-2">{photoError}</span> : null}
                {formErrors.eventPhoto ? <span className="text-danger-red text-xs mt-2">{formErrors.eventPhoto}</span> : null}
              </div>

              <div className="flex flex-col flex-[1_1_300px] min-w-0 gap-5">
                <div className="flex w-full flex-wrap gap-6 items-center">
                  <div className="relative w-full flex-1">
                    <input
                      className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                      placeholder="Enter event title"
                      name="eventName"
                      value={formData.eventName}
                      onChange={handleInputChange}
                    />
                    <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Event Name *</span>
                    {formErrors.eventName ? <span className="text-danger-red text-xs">{formErrors.eventName}</span> : null}
                  </div>

                  <div className="relative w-full flex-1">
                    <select
                      className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      <option value="">Select category</option>
                      {EVENT_CATEGORIES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Category *</span>
                    {formErrors.category ? <span className="text-danger-red text-xs">{formErrors.category}</span> : null}
                  </div>
                </div>

                <div className="relative w-full">
                  <textarea
                    className="w-full border border-ring rounded px-4 py-2 text-base text-gray-800 bg-background box-border min-h-16 resize-y"
                    placeholder='Write a catchy tagline, e.g., "Unleash Your Inner Techie!"'
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleInputChange}
                  />
                  <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Tagline (Optional)</span>
                  {formErrors.tagline ? <span className="text-danger-red text-xs">{formErrors.tagline}</span> : null}
                </div>

                <div className="relative w-full">
                  <textarea
                    className="w-full border border-ring rounded px-4 py-2 text-base text-gray-800 bg-background box-border min-h-30 resize-y"
                    placeholder="Describe the event purpose and attendee experience"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                  <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Description *</span>
                  {formErrors.description ? <span className="text-danger-red text-xs">{formErrors.description}</span> : null}
                </div>

                <div className="relative w-full">
                  <textarea
                    className="w-full border border-ring rounded px-4 py-2 text-base text-gray-800 bg-background box-border min-h-20 resize-y"
                    placeholder="List speakers, MCs, DJs, or custom personnel requirements"
                    name="personnel"
                    value={formData.personnel}
                    onChange={handleInputChange}
                  />
                  <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Customized Personnel (Optional)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full bg-card rounded-2xl border border-ring mb-8">
        <div
          onClick={() => toggleSection("date-time")}
          className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
        >
          <h3 className="text-2xl font-medium text-upcoming-primary-700">Date &amp; Time</h3>
          {openSections["date-time"] ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
        </div>

        {openSections["date-time"] && (
          <div className="px-8 pb-8">
            <div className="flex flex-col gap-6">
              <div className="flex w-full flex-wrap gap-4 items-start">
                <div className="relative min-w-37.5 flex-[1_1_200px]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-14 px-4 py-1 border border-ring rounded text-base bg-transparent w-full justify-start text-left font-normal relative",
                          formData.date ? "text-gray-800" : "text-muted-foreground"
                        )}
                      >
                        {formData.date && !Number.isNaN(new Date(formData.date).getTime())
                          ? format(new Date(formData.date), "PPP")
                          : <span>Pick a date</span>}
                        <CalendarIcon className="absolute right-4 top-4 w-6 h-6 text-gray-500 opacity-75" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date && !Number.isNaN(new Date(formData.date).getTime()) ? new Date(formData.date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const formatted = format(date, "yyyy-MM-dd")
                            setFormData((prev) => ({ ...prev, date: formatted }))
                          }
                        }}
                        fromDate={new Date()}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Start Date *</span>
                  {formErrors.date ? <span className="text-danger-red text-xs">{formErrors.date}</span> : null}
                </div>

                <div className="relative min-w-37.5 flex-[1_1_200px]">
                  <input
                    type="text"
                    readOnly
                    className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                    value={formData.time || ""}
                    onClick={() => setShowStartTimePicker(true)}
                    placeholder="HH:MM AM/PM"
                    style={{ cursor: "pointer" }}
                  />
                  <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Start Time *</span>
                  <ClockIcon className="absolute right-4 top-4 w-6 h-6 text-gray-500 pointer-events-none" />
                  {formErrors.time ? <span className="text-danger-red text-xs">{formErrors.time}</span> : null}
                  {showStartTimePicker ? (
                    <TimePicker
                      initialTime={formData.time}
                      onTimeChange={(val) => setFormData((prev) => ({ ...prev, time: val }))}
                      onClose={() => setShowStartTimePicker(false)}
                    />
                  ) : null}
                </div>

                <div className="relative min-w-37.5 flex-[1_1_200px]">
                  <input
                    type="text"
                    readOnly
                    className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                    value={formData.endTime || ""}
                    onClick={() => setShowEndTimePicker(true)}
                    placeholder="HH:MM AM/PM"
                    style={{ cursor: "pointer" }}
                  />
                  <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">End Time *</span>
                  <ClockIcon className="absolute right-4 top-4 w-6 h-6 text-gray-500 pointer-events-none" />
                  {formErrors.endTime ? <span className="text-danger-red text-xs">{formErrors.endTime}</span> : null}
                  {showEndTimePicker ? (
                    <TimePicker
                      initialTime={formData.endTime}
                      onTimeChange={(val) => setFormData((prev) => ({ ...prev, endTime: val }))}
                      onClose={() => setShowEndTimePicker(false)}
                    />
                  ) : null}
                </div>
              </div>

              <div className="flex w-full flex-wrap gap-6 items-start">
                <div className="relative min-w-62.5 flex-[1_1_250px]">
                  <input
                    className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                    placeholder="Enter venue address or name"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                  />
                  <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Venue *</span>
                  {formErrors.venue ? <span className="text-danger-red text-xs">{formErrors.venue}</span> : null}
                </div>

                <div className="relative min-w-62.5 flex-[1_1_250px]">
                  <input
                    className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                    placeholder="Paste Google Maps URL"
                    name="googleMapsUrl"
                    value={formData.googleMapsUrl}
                    onChange={handleInputChange}
                  />
                  <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Google Maps URL *</span>
                  {formErrors.googleMapsUrl ? <span className="text-danger-red text-xs">{formErrors.googleMapsUrl}</span> : null}
                </div>
              </div>

              <div className="flex w-full flex-wrap gap-6 items-start">
                <div className="relative min-w-62.5 flex-[1_1_250px]">
                  <input
                    className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                    placeholder="How attendees can reach the event"
                    name="transportToEvent"
                    value={formData.transportToEvent || ""}
                    onChange={handleInputChange}
                  />
                  <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Transport To Event (Optional)</span>
                </div>

                <div className="relative min-w-62.5 flex-[1_1_250px]">
                  <input
                    className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                    placeholder="Entry gate/side details"
                    name="entrySide"
                    value={formData.entrySide || ""}
                    onChange={handleInputChange}
                  />
                  <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Entry Side (Optional)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full bg-card rounded-2xl border border-ring mb-8">
        <div
          onClick={() => toggleSection("event-highlights")}
          className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
        >
          <h3 className="text-2xl font-medium text-upcoming-primary-700">Event Highlights (Optional)</h3>
          {openSections["event-highlights"] ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
        </div>

        {openSections["event-highlights"] && (
          <div className="px-8 pb-8">
            <div className="flex flex-col gap-4">
              {formData.artists.map((artist, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    className="w-full border border-ring rounded px-4 py-2 text-base text-gray-800 bg-background box-border h-12"
                    placeholder={`Highlight ${index + 1}`}
                    value={artist.name}
                    onChange={(e) => updateArrayField("artists", index, "name", e.target.value)}
                  />
                  {formData.artists.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeArrayItem?.("artists", index)}
                      className="p-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100"
                      aria-label={`Remove highlight ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ))}

              <button
                type="button"
                onClick={() => addArrayItem("artists")}
                className="inline-flex items-center gap-2 text-sm font-medium text-upcoming-primary-700"
              >
                <PlusIcon size={16} /> Add highlight
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EventForm
