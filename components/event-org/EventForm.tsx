"use client"

import React, { useState } from "react"
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon, ClockIcon, PlusIcon, Trash2, X, Upload } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import TimePicker from "@/components/ui/time-picker"
import { cn } from "@/lib/utils"
import type { EventFormData } from "./validateEventform"
import { EVENT_CATEGORY_GROUPS } from "@/lib/event-categories"

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
  setPhotoPreview,
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
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [activeSlotPicker, setActiveSlotPicker] = useState<{ index: number; field: "startTime" | "endTime" } | null>(null)

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
            <div className="flex flex-col lg:flex-row w-full gap-8 items-start">
              <div className="flex flex-col items-center gap-3 w-full lg:w-auto shrink-0">
                <label htmlFor="eventPhoto" className="cursor-pointer block w-full max-w-[260px] mx-auto">
                  <div className={`relative w-full aspect-[2/3] overflow-hidden flex flex-col items-center justify-center gap-2 bg-background rounded-2xl border border-dashed ${formErrors.eventPhoto ? "border-red-400" : "border-gray-400"}`}>
                    <input
                      id="eventPhoto"
                      type="file"
                      name="eventPhoto"
                      onChange={handleInputChange}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                    />
                    {photoPreview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoPreview}
                          alt="Event cover preview"
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={() => setPhotoPreview(null)}
                        />
                        <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white">
                          Change / adjust
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-900" />
                        <span className="font-normal text-gray-900 text-lg">Upload Image</span>
                      </>
                    )}
                  </div>
                </label>
                <div className="text-center text-xs text-gray-500 max-w-[260px]">
                  <p>Upload a high-quality image for your event</p>
                  <p>Formats: PNG, JPG, JPEG</p>
                  <p>Accepted aspect ratio: 2:3 (Portrait)</p>
                </div>
                {photoError ? <span className="text-danger-red text-xs block">{photoError}</span> : null}
                {formErrors.eventPhoto ? <span className="text-danger-red text-xs block">{formErrors.eventPhoto}</span> : null}
              </div>

              <div className="flex flex-col flex-1 w-full min-w-0 gap-5">
                <div className="flex w-full flex-wrap gap-6 items-center">
                  <div className="relative w-full flex-1">
                    <input
                      className={`w-full border rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14 ${formErrors.eventName ? "border-red-400" : "border-ring"}`}
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
                      className={`w-full border rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14 ${formErrors.category ? "border-red-400" : "border-ring"}`}
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      <option value="">Select category</option>
                      {EVENT_CATEGORY_GROUPS.map((group) => (
                        <optgroup key={group.category} label={group.category}>
                          {group.subcategories.map((sub) => (
                            <option key={`${group.category}-${sub}`} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </optgroup>
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
                    className={`w-full border rounded px-4 py-2 text-base text-gray-800 bg-background box-border min-h-30 resize-y ${formErrors.description ? "border-red-400" : "border-ring"}`}
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
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-14 px-4 py-1 border rounded text-base bg-transparent w-full justify-start text-left font-normal relative",
                          formData.date ? "text-gray-800" : "text-muted-foreground",
                          formErrors.date ? "border-red-400" : "border-ring"
                        )}
                      >
                        {formData.date && !Number.isNaN(new Date(formData.date).getTime())
                          ? format(new Date(formData.date), "dd/MM/yyyy")
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
                            setFormData((prev) => ({ ...prev, date: format(date, "yyyy-MM-dd") }))
                            setDatePickerOpen(false)
                          }
                        }}
                        startMonth={new Date()}
                        endMonth={new Date(new Date().setFullYear(new Date().getFullYear() + 5))}
                        disabled={(date) => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          const fiveYearsOut = new Date()
                          fiveYearsOut.setFullYear(today.getFullYear() + 5)
                          return date < today || date > fiveYearsOut
                        }}
                        autoFocus
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
                    className={`w-full border rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14 ${formErrors.time ? "border-red-400" : "border-ring"}`}
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
                    className={`w-full border rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14 ${formErrors.endTime ? "border-red-400" : "border-ring"}`}
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
                    className={`w-full border rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14 ${formErrors.venue ? "border-red-400" : "border-ring"}`}
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
                    className={`w-full border rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14 ${formErrors.googleMapsUrl ? "border-red-400" : "border-ring"}`}
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

              {/* Time Slots / Schedule */}
              <div className="border-t border-ring pt-5 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-upcoming-primary-700">Event Schedule (Optional)</p>
                    <p className="text-xs text-gray-500 mt-0.5">Break the event into named time slots (e.g. 7 AM–12 PM: Dance)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addArrayItem("timeSlots")}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-upcoming-primary-700 border border-upcoming-primary-700 rounded-full px-3 py-1 hover:bg-upcoming-primary-50 transition-colors"
                  >
                    <PlusIcon size={14} /> Add Slot
                  </button>
                </div>

                {(formData.timeSlots ?? []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No slots added yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {(formData.timeSlots ?? []).map((slot, index) => (
                      <div key={index} className="flex flex-wrap items-start gap-3 p-3 rounded-xl border border-ring bg-background">
                        <div className="relative flex-[2_1_160px] min-w-36">
                          <input
                            className="w-full border border-ring rounded px-3 py-2 text-sm text-gray-800 bg-background box-border h-10"
                            placeholder="Slot name (e.g. Dance)"
                            value={slot.name}
                            onChange={(e) => updateArrayField("timeSlots", index, "name", e.target.value)}
                          />
                          <span className="absolute -top-2.5 left-2 px-1 bg-background text-muted-foreground text-xs">Name</span>
                        </div>
                        <div className="relative flex-[1_1_120px] min-w-28">
                          <input
                            type="text"
                            readOnly
                            className="w-full border border-ring rounded px-3 py-2 text-sm text-gray-800 bg-background box-border h-10 cursor-pointer pr-8"
                            value={slot.startTime || ""}
                            onClick={() => setActiveSlotPicker({ index, field: "startTime" })}
                            placeholder="Start time"
                          />
                          <span className="absolute -top-2.5 left-2 px-1 bg-background text-muted-foreground text-xs">From</span>
                          <ClockIcon className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                          {activeSlotPicker?.index === index && activeSlotPicker.field === "startTime" ? (
                            <TimePicker
                              initialTime={slot.startTime}
                              onTimeChange={(val) => updateArrayField("timeSlots", index, "startTime", val)}
                              onClose={() => setActiveSlotPicker(null)}
                            />
                          ) : null}
                        </div>
                        <div className="relative flex-[1_1_120px] min-w-28">
                          <input
                            type="text"
                            readOnly
                            className="w-full border border-ring rounded px-3 py-2 text-sm text-gray-800 bg-background box-border h-10 cursor-pointer pr-8"
                            value={slot.endTime || ""}
                            onClick={() => setActiveSlotPicker({ index, field: "endTime" })}
                            placeholder="End time"
                          />
                          <span className="absolute -top-2.5 left-2 px-1 bg-background text-muted-foreground text-xs">To</span>
                          <ClockIcon className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                          {activeSlotPicker?.index === index && activeSlotPicker.field === "endTime" ? (
                            <TimePicker
                              initialTime={slot.endTime}
                              onTimeChange={(val) => updateArrayField("timeSlots", index, "endTime", val)}
                              onClose={() => setActiveSlotPicker(null)}
                            />
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeArrayItem?.("timeSlots", index)}
                          className="mt-0.5 p-2 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 h-10 w-10 flex items-center justify-center"
                          aria-label={`Remove slot ${index + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
