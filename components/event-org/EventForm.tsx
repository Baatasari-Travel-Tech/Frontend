"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronUpIcon, ChevronDownIcon, CalendarIcon, ClockIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

import { EventFormData } from "./validateEventform";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import TimePicker from "@/components/ui/time-picker";

import { cn } from "@/lib/utils";
import { EVENT_CATEGORIES, TRANSPORT_OPTIONS } from "./data/create-event-data";

interface EventFormProps {
  formData: EventFormData;
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;

  photoPreview: string | null;

  // not used in this snippet but kept in props list in your original
  setPhotoPreview: (preview: string | null) => void;
  photoError: string;
  setPhotoError: (error: string) => void;
  additionalPhotos: File[];
  setAdditionalPhotos: (photos: File[]) => void;
  additionalPhotoPreviews: string[];
  setAdditionalPhotoPreviews: (previews: string[]) => void;
  additionalPhotosError: string;
  setAdditionalPhotosError: (error: string) => void;

  handleTransportToggle: (transportKey: string) => void;
  addArrayItem: (arrayName: string) => void;
  updateArrayField: (arrayName: string, index: number, field: string, value: string) => void;

  openSections: { [key: string]: boolean };
  toggleSection: (section: string) => void;

  formErrors: { [key: string]: string };
}

const EventForm: React.FC<EventFormProps> = ({
  formData,
  setFormData,
  handleInputChange,
  photoPreview,
  handleTransportToggle,
  updateArrayField,
  openSections,
  toggleSection,
  formErrors = {},
}) => {
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Auto-grow refs and focus state
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const personnelRef = useRef<HTMLTextAreaElement>(null);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [personnelFocused, setPersonnelFocused] = useState(false);

  useEffect(() => {
    if (descriptionRef.current) {
      if (descriptionFocused) {
        descriptionRef.current.style.height = "auto";
        descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
        descriptionRef.current.style.overflow = "hidden";
      } else {
        descriptionRef.current.style.height = "";
        descriptionRef.current.style.overflow = "auto";
      }
    }
  }, [formData.description, descriptionFocused]);

  useEffect(() => {
    if (personnelRef.current) {
      if (personnelFocused) {
        personnelRef.current.style.height = "auto";
        personnelRef.current.style.height = `${personnelRef.current.scrollHeight}px`;
        personnelRef.current.style.overflow = "hidden";
      } else {
        personnelRef.current.style.height = "";
        personnelRef.current.style.overflow = "auto";
      }
    }
  }, [formData.personnel, personnelFocused]);

  const handleTimeUpdate = (field: "time" | "endTime", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col items-start gap-8 w-full">
      {/* Event Information Section */}
      <div className="w-full bg-card rounded-2xl border border-ring mb-8">
        <div className="w-full bg-card rounded-2xl border border-ring">
          <div
            onClick={() => toggleSection("event-info")}
            className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
          >
            <h3 className="text-2xl font-medium text-upcoming-primary-700">Event Information</h3>
            {openSections["event-info"] ? (
              <ChevronUpIcon className="w-6 h-6" />
            ) : (
              <ChevronDownIcon className="w-6 h-6" />
            )}
          </div>

          {openSections["event-info"] && (
            <div className="px-8 pb-8">
              <div className="flex w-full flex-wrap gap-10 items-start">
                {/* Photo */}
                <div className="flex flex-col w-64.5 min-w-50 flex-[1_1_258px] max-w-full max-[600px]:w-full max-[600px]:flex-[1_1_100%]">
                  <label htmlFor="eventPhoto" className="cursor-pointer block w-full">
                    <div className="flex flex-col h-97 min-h-97 items-center justify-center gap-3.25 px-6 py-5 bg-background rounded-xl border border-dashed border-gray-400 w-full max-[600px]:h-auto max-[600px]:min-h-50">
                      <input
                        id="eventPhoto"
                        type="file"
                        name="eventPhoto"
                        onChange={handleInputChange}
                        accept="image/jpeg,image/png,image/gif"
                        className="hidden"
                      />

                      {photoPreview ? (
                        <Image
                          src={photoPreview}
                          alt="Uploaded event photo preview"
                          className="h-64 w-auto object-contain max-w-full"
                          width={240}
                          height={360}
                          style={{ objectFit: "cover", borderRadius: "8px" }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-6 h-6 text-gray-900" />
                          <span className="font-normal text-gray-900 text-lg font-[Inter,Helvetica,sans-serif]">Upload Image</span>
                        </div>
                      )}
                    </div>
                  </label>

                  <div className="flex flex-col w-full mt-4 gap-1.25">
                    <p className="text-sm font-semibold text-gray-900 text-center">
                      Upload a high-quality image for your event
                    </p>
                    <p className="text-sm font-semibold text-gray-900 text-center">Formats: PNG, JPG, JPEG</p>
                    <p className="text-sm font-semibold text-gray-900 text-center">Accepted aspect ratio: 2:3 (Portrait)</p>
                  </div>
                </div>

                {/* Fields */}
                <div className="flex flex-col flex-[1_1_300px] min-w-0" style={{ gap: 20 }}>
                  <div className="flex w-full flex-wrap gap-10 items-center">
                    <div className="relative w-full flex-1">
                      <input
                        className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                        placeholder="Enter event title"
                        name="eventName"
                        value={formData.eventName}
                        onChange={handleInputChange}
                      />
                      <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Event Name</span>
                      {formErrors.eventName && (
                        <span className="text-danger-red text-xs">{formErrors.eventName}</span>
                      )}
                    </div>

                    <div className="relative w-full flex-1">
                      <select
                        className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                      >
                        <option value="">Select the Category</option>
                        {EVENT_CATEGORIES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Category</span>
                      {formErrors.category && (
                        <span className="text-danger-red text-xs">{formErrors.category}</span>
                      )}
                    </div>
                  </div>

                  <div className="relative w-full">
                    <textarea
                      ref={(e) => {
                        if (e) {
                          e.style.height = "auto";
                          e.style.height = `${e.scrollHeight}px`;
                        }
                      }}
                      className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-16 resize-y"
                      placeholder='Write a catchy tagline, e.g., "Unleash Your Inner Techie!"'
                      name="tagline"
                      value={formData.tagline}
                      onChange={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                        handleInputChange(e);
                      }}
                    />
                    <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Tagline</span>
                    {formErrors.tagline && (
                      <span className="text-danger-red text-xs">{formErrors.tagline}</span>
                    )}
                  </div>

                  <div className="relative w-full">
                    <Textarea
                      ref={descriptionRef}
                      className={cn("w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-36 resize-y", "min-h-36 transition-[height] duration-200")}
                      placeholder="Describe about the event, including purpose and experience"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      onFocus={() => setDescriptionFocused(true)}
                      onBlur={() => setDescriptionFocused(false)}
                    />
                    <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Description</span>
                    {formErrors.description && (
                      <span className="text-danger-red text-xs">{formErrors.description}</span>
                    )}
                  </div>

                  <div className="relative w-full">
                    <Textarea
                      ref={personnelRef}
                      className={cn("w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-16 resize-y", "min-h-20 transition-[height] duration-200")}
                      placeholder="List speakers, MCs, DJs, or any special hosts"
                      name="personnel"
                      value={formData.personnel}
                      onChange={handleInputChange}
                      onFocus={() => setPersonnelFocused(true)}
                      onBlur={() => setPersonnelFocused(false)}
                    />
                    <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Customized Personnel</span>
                    {formErrors.personnel && (
                      <span className="text-danger-red text-xs">{formErrors.personnel}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date & Time Section */}
      <div className="w-full bg-card rounded-2xl border border-ring mb-8">
        <div className="w-full bg-card rounded-2xl border border-ring">
          <div
            onClick={() => toggleSection("date-time")}
            className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
          >
            <h3 className="text-2xl font-medium text-upcoming-primary-700">Date &amp; Time</h3>
            {openSections["date-time"] ? (
              <ChevronUpIcon className="w-6 h-6" />
            ) : (
              <ChevronDownIcon className="w-6 h-6" />
            )}
          </div>

          {openSections["date-time"] && (
            <div className="px-8 pb-8">
              <div className="flex flex-col" style={{ gap: 24 }}>
                {/* Date + start time + end time */}
                <div className="flex w-full flex-wrap gap-4 items-start">
                  {/* Date */}
                  <div className="relative min-w-37.5 flex-[1_1_200px]">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "h-14 px-4 py-1 border border-ring rounded text-base bg-transparent w-full justify-start text-left font-normal relative",
                            formData.date ? "text-gray-800" : "text-muted-foreground"
                          )}
                        >
                          {formData.date && !isNaN(new Date(formData.date).getTime()) ? (
                            format(new Date(formData.date), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="absolute right-4 top-4 w-6 h-6 text-gray-500 opacity-75" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date && !isNaN(new Date(formData.date).getTime()) ? new Date(formData.date) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const formatted = format(date, "yyyy-MM-dd");
                              setFormData((prev) => ({ ...prev, date: formatted }));
                            }
                          }}
                          fromDate={new Date()}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Start Date</span>
                    {formErrors.date && <span className="text-danger-red text-xs">{formErrors.date}</span>}
                  </div>

                  {/* Start time */}
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
                    <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Start Time</span>
                    <ClockIcon className="absolute right-4 top-4 w-6 h-6 text-gray-500 pointer-events-none" />
                    {formErrors.time && <span className="text-danger-red text-xs">{formErrors.time}</span>}

                    {showStartTimePicker && (
                      <TimePicker
                        initialTime={formData.time}
                        onTimeChange={(val) => handleTimeUpdate("time", val)}
                        onClose={() => setShowStartTimePicker(false)}
                      />
                    )}
                  </div>

                  {/* End time */}
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
                    <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">End Time</span>
                    <ClockIcon className="absolute right-4 top-4 w-6 h-6 text-gray-500 pointer-events-none" />
                    {formErrors.endTime && (
                      <span className="text-danger-red text-xs">{formErrors.endTime}</span>
                    )}

                    {showEndTimePicker && (
                      <TimePicker
                        initialTime={formData.endTime}
                        onTimeChange={(val) => handleTimeUpdate("endTime", val)}
                        onClose={() => setShowEndTimePicker(false)}
                      />
                    )}
                  </div>
                </div>

                <div className="h-6" />

                {/* Venue + Maps */}
                <div className="flex w-full flex-wrap gap-10 items-start">
                  <div className="relative min-w-62.5 flex-[1_1_250px]">
                    <input
                      className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                      placeholder="Enter the full address or venue name"
                      name="venue"
                      value={formData.venue}
                      onChange={handleInputChange}
                    />
                    <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Venue</span>
                    {formErrors.venue && <span className="text-danger-red text-xs">{formErrors.venue}</span>}
                  </div>

                  <div className="relative min-w-62.5 flex-[1_1_250px]">
                    <input
                      className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                      placeholder="Enter the Google Maps link of the venue"
                      name="googleMapsUrl"
                      value={formData.googleMapsUrl}
                      onChange={handleInputChange}
                    />
                    <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Google Maps URL</span>
                    {formErrors.googleMapsUrl && (
                      <span className="text-danger-red text-xs">{formErrors.googleMapsUrl}</span>
                    )}
                  </div>
                </div>

                <div className="h-6" />

                {/* Transport to Event + Entry Side */}
                <div className="flex w-full flex-wrap gap-10 items-start">
                  <div className="relative min-w-62.5 flex-[1_1_250px]">
                    <input
                      className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                      placeholder="Describe how to reach the event"
                      name="transportToEvent"
                      value={formData.transportToEvent || ""}
                      onChange={handleInputChange}
                    />
                    <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Transport to Event</span>
                    {formErrors.transportToEvent && (
                      <span className="text-danger-red text-xs">{formErrors.transportToEvent}</span>
                    )}
                  </div>

                  <div className="relative min-w-62.5 flex-[1_1_250px]">
                    <input
                      className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                      placeholder="Enter Entry Side details"
                      name="entrySide"
                      value={formData.entrySide || ""}
                      onChange={handleInputChange}
                    />
                    <span className="absolute -top-3 -left-1 px-1 bg-card text-muted-foreground text-sm z-10">Entry Side</span>
                    {formErrors.entrySide && (
                      <span className="text-danger-red text-xs">{formErrors.entrySide}</span>
                    )}
                  </div>
                </div>

                <div className="h-6" />

                {/* Transport Availability */}
                <div>
                  <span className="text-muted-foreground text-sm mb-2 block font-semibold">Transport Availability</span>
                  <div className="flex gap-4 flex-wrap">
                    {TRANSPORT_OPTIONS.map((option) => {
                      const active =
                        formData.transportOptions[
                        option.value as keyof typeof formData.transportOptions
                        ];

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleTransportToggle(option.value)}
                          className={cn(
                            "px-4 py-2 rounded-full text-xs bg-background text-muted-foreground border border-ring cursor-pointer",
                            active && "bg-blue-soft text-background"
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Highlights Section */}
      <div className="w-full bg-card rounded-2xl border border-ring mb-8">
        <div className="w-full bg-card rounded-2xl border border-ring">
          <div
            onClick={() => toggleSection("event-highlights")}
            className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
          >
            <h3 className="text-2xl font-medium text-upcoming-primary-700">Event Highlights</h3>
            {openSections["event-highlights"] ? (
              <ChevronUpIcon className="w-6 h-6" />
            ) : (
              <ChevronDownIcon className="w-6 h-6" />
            )}
          </div>

          {openSections["event-highlights"] && (
            <div className="px-8 pb-8">
              <div className="flex flex-col" style={{ gap: 24 }}>
                <div style={{ width: "100%" }}>
                  <span style={{ color: "var(--gray-500)", fontSize: 14, marginBottom: 8, display: "block" }}>
                    Add Any Artists Attending the Event
                  </span>

                  {formData.artists.map((artist, index) => (
                    <div key={index} className="flex items-start gap-4 mb-3">
                      <div style={{ flex: 1 }}>
                        <input
                          className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                          placeholder="Artist Name"
                          value={artist.name}
                          onChange={(e) =>
                            updateArrayField("artists", index, "name", e.target.value)
                          }
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <input
                          className="w-full border border-ring rounded px-4 py-1 text-base text-gray-800 bg-background box-border h-14"
                          placeholder="Genre of Artist"
                          value={artist.genre}
                          onChange={(e) =>
                            updateArrayField("artists", index, "genre", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventForm;
