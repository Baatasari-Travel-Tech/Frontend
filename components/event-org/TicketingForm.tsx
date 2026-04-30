"use client"

import React, { useCallback, useRef } from "react"
import { ChevronDownIcon, PlusIcon, TrashIcon } from "lucide-react"
import { EventFormData, ADD_ON_OPTIONS, TARGET_AUDIENCE_OPTIONS } from "./data/create-event-data"

interface TicketingFormProps {
  formData: EventFormData
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  addArrayItem: (arrayName: string) => void
  updateArrayField: (arrayName: string, index: number, field: string, value: unknown) => void
  removeArrayItem: (arrayName: string, index: number) => void
  openSections: { [key: string]: boolean }
  toggleSection: (section: string) => void
  formErrors: { [key: string]: string }
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(val, max))
}

const minGap = 10

const DualThumbSlider: React.FC<{
  min: number
  max: number
  valueMin: number
  valueMax: number
  onChange: (values: { min: number; max: number }) => void
}> = ({ min = 0, max = 100, valueMin, valueMax, onChange }) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const percent = (v: number) => ((v - min) / (max - min)) * 100

  const startDrag = (thumb: "min" | "max") => () => {
    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = "touches" in moveEvent ? moveEvent.touches[0]?.clientX : moveEvent.clientX
      if (!clientX || !trackRef.current) return

      const rect = trackRef.current.getBoundingClientRect()
      const percentVal = clamp((clientX - rect.left) / rect.width, 0, 1)
      let value = Math.round(percentVal * (max - min) + min)

      if (thumb === "min") {
        value = clamp(value, min, valueMax - minGap)
        onChange({ min: value, max: valueMax })
      } else {
        value = clamp(value, valueMin + minGap, max)
        onChange({ min: valueMin, max: value })
      }
    }

    const stopHandler = () => {
      document.removeEventListener("mousemove", moveHandler)
      document.removeEventListener("touchmove", moveHandler)
      document.removeEventListener("mouseup", stopHandler)
      document.removeEventListener("touchend", stopHandler)
    }

    document.addEventListener("mousemove", moveHandler)
    document.addEventListener("touchmove", moveHandler)
    document.addEventListener("mouseup", stopHandler)
    document.addEventListener("touchend", stopHandler)
  }

  const minLeft = `calc(${percent(valueMin)}% - 10px)`
  const maxLeft = `calc(${percent(valueMax)}% - 10px)`

  return (
    <div className="relative h-10 my-5">
      <div ref={trackRef} className="absolute top-4.5 left-0 right-0 h-1.5 bg-gray-300 rounded-[3px] z-1" />
      <div
        className="absolute top-4.5 h-1.5 rounded-[3px] z-2 transition-all duration-100"
        style={{
          left: `${percent(valueMin)}%`,
          width: `${percent(valueMax) - percent(valueMin)}%`,
          background: "linear-gradient(90deg, var(--royal-blue) 0%, var(--revenue-color) 100%)",
        }}
      />
      <div
        className="absolute top-3.5 w-5 h-5 bg-card rounded-full cursor-grab shadow-[0_2px_6px_rgb(0_0_0/0.2)] z-3 transition-all duration-200 border-[3px] border-royal-blue"
        style={{ left: minLeft }}
        onMouseDown={startDrag("min")}
        onTouchStart={startDrag("min")}
      />
      <div
        className="absolute top-3.5 w-5 h-5 bg-card rounded-full cursor-grab shadow-[0_2px_6px_rgb(0_0_0/0.2)] z-3 transition-all duration-200 border-[3px] border-revenue"
        style={{ left: maxLeft }}
        onMouseDown={startDrag("max")}
        onTouchStart={startDrag("max")}
      />
    </div>
  )
}

const TicketingForm: React.FC<TicketingFormProps> = ({
  formData,
  setFormData,
  addArrayItem,
  updateArrayField,
  removeArrayItem,
  openSections,
  toggleSection,
  formErrors,
}) => {
  const audienceCategory = formData.audienceCategory || []

  const handleAudienceSelection = useCallback(
    (audience: string) => {
      setFormData((prev) => ({
        ...prev,
        targetAudience: {
          ...prev.targetAudience,
          [audience]: !prev.targetAudience[audience],
        },
      }))
    },
    [setFormData]
  )

  return (
    <div className="w-full">
      <div className="w-full bg-card rounded-2xl border border-ring p-0 mb-8 shadow-none max-w-full">
        <div
          onClick={() => toggleSection("ticketing")}
          onKeyDown={(e) => e.key === "Enter" && toggleSection("ticketing")}
          className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Ticketing</h3>
          <ChevronDownIcon className="w-6 h-6" />
        </div>

        <div className="overflow-hidden transition-[max-height] duration-500 ease-in-out" style={{ maxHeight: openSections.ticketing ? "2400px" : "0" }}>
          <div className="px-8 pb-8">
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center justify-center mb-2 mt-1">
                <div className="flex relative w-55 h-11 bg-gray-100 rounded-full border border-gray-200 overflow-hidden mx-auto">
                  <div
                    className="absolute top-0 w-1/2 h-full bg-blue-soft rounded-full transition-[left] duration-300 ease-in-out z-1"
                    style={{ left: formData.ticketType === "paid" ? 0 : "50%" }}
                  />
                  <button
                    type="button"
                    className={`flex-1 p-3 border-none bg-transparent text-sm font-medium cursor-pointer z-2 transition-colors duration-200 ${formData.ticketType === "paid" ? "text-background" : "text-gray-700"}`}
                    onClick={() => setFormData((prev) => ({ ...prev, ticketType: "paid" }))}
                  >
                    Paid
                  </button>
                  <button
                    type="button"
                    className={`flex-1 p-3 border-none bg-transparent text-sm font-medium cursor-pointer z-2 transition-colors duration-200 ${formData.ticketType === "free" ? "text-background" : "text-gray-700"}`}
                    onClick={() => setFormData((prev) => ({ ...prev, ticketType: "free" }))}
                  >
                    Free
                  </button>
                </div>
              </div>
              {formErrors.ticketType ? <span className="text-danger-red text-xs">{formErrors.ticketType}</span> : null}

              {audienceCategory.map((tier, index) => (
                <div key={index} className="flex flex-col gap-4 relative pr-10 border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-foreground m-0">Category {index + 1}</h3>
                    {audienceCategory.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("audienceCategory", index)}
                        className="absolute top-3 right-3 p-2 text-destructive bg-none border-none cursor-pointer"
                        aria-label={`Remove audience category ${index + 1}`}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    ) : null}
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                      Audience Category *
                    </label>
                    <input
                      type="text"
                      value={tier.category || ""}
                      onChange={(e) => updateArrayField("audienceCategory", index, "category", e.target.value)}
                      className="w-full h-12 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background"
                      placeholder="Ex: Gold Pass"
                    />
                    {formErrors[`audienceCategory.${index}.category`] ? (
                      <span className="text-danger-red text-xs">{formErrors[`audienceCategory.${index}.category`]}</span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <span className="text-sm font-medium text-slate-700">Limited tickets</span>
                    <button
                      type="button"
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${tier.isLimited ? "bg-blue-soft" : "bg-gray-300"}`}
                      onClick={() => updateArrayField("audienceCategory", index, "isLimited", !tier.isLimited)}
                      aria-checked={tier.isLimited}
                      role="switch"
                    >
                      <div className={`w-4.5 h-4.5 rounded-full bg-card absolute top-0.75 transition-[left] duration-300 ${tier.isLimited ? "left-6.75" : "left-0.75"}`} />
                    </button>
                  </div>

                  <div className="flex gap-4 flex-wrap w-full">
                    {tier.isLimited ? (
                      <div className="relative flex-1 min-w-50">
                        <label className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                          Number of Tickets *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={tier.numberOfTickets || ""}
                          onChange={(e) => updateArrayField("audienceCategory", index, "numberOfTickets", e.target.value)}
                          className="w-full h-12 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background"
                          placeholder="Ex: 100"
                        />
                        {formErrors[`audienceCategory.${index}.numberOfTickets`] ? (
                          <span className="text-danger-red text-xs">{formErrors[`audienceCategory.${index}.numberOfTickets`]}</span>
                        ) : null}
                      </div>
                    ) : null}

                    {formData.ticketType === "paid" ? (
                      <div className="relative flex-1 min-w-50">
                        <label className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                          Price *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-sm text-gray-600">Rs.</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={tier.price || ""}
                            onChange={(e) => updateArrayField("audienceCategory", index, "price", e.target.value)}
                            className="w-full h-12 pl-11 pr-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background"
                            placeholder="0"
                          />
                        </div>
                        {formErrors[`audienceCategory.${index}.price`] ? (
                          <span className="text-danger-red text-xs">{formErrors[`audienceCategory.${index}.price`]}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="relative w-full">
                    <label className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                      Description *
                    </label>
                    <textarea
                      value={tier.description || ""}
                      onChange={(e) => updateArrayField("audienceCategory", index, "description", e.target.value)}
                      className="w-full min-h-20 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background resize-y"
                      placeholder="Describe this category"
                    />
                    {formErrors[`audienceCategory.${index}.description`] ? (
                      <span className="text-danger-red text-xs">{formErrors[`audienceCategory.${index}.description`]}</span>
                    ) : null}
                  </div>
                </div>
              ))}

              <button type="button" onClick={() => addArrayItem("audienceCategory")} className="flex items-center gap-1 bg-none border-none text-revenue text-sm font-medium cursor-pointer">
                <PlusIcon size={16} /> Add category
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-card rounded-2xl border border-ring p-0 mb-8 shadow-none max-w-full">
        <div
          onClick={() => toggleSection("guidelines")}
          onKeyDown={(e) => e.key === "Enter" && toggleSection("guidelines")}
          className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Guidelines / Rules (Optional)</h3>
          <ChevronDownIcon className="w-6 h-6" />
        </div>
        <div className="overflow-hidden transition-[max-height] duration-500 ease-in-out" style={{ maxHeight: openSections.guidelines ? "1000px" : "0" }}>
          <div className="px-8 pb-8">
            <div className="relative w-full mt-2">
              <textarea
                name="guidelines"
                value={formData.guidelines || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, guidelines: e.target.value }))}
                className="w-full min-h-28 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background resize-y"
                placeholder="Add entry rules, restrictions, age policy, etc."
              />
              {formErrors.guidelines ? <span className="text-danger-red text-xs">{formErrors.guidelines}</span> : null}
            </div>
          </div>
        </div>
      </div>

      {formData.ticketType === "paid" ? (
        <div className="w-full bg-card rounded-2xl border border-ring p-0 mb-8 shadow-none max-w-full">
          <div
            onClick={() => toggleSection("addOns")}
            onKeyDown={(e) => e.key === "Enter" && toggleSection("addOns")}
            className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
            role="button"
            tabIndex={0}
          >
            <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Add-ons (Optional)</h3>
            <ChevronDownIcon className="w-6 h-6" />
          </div>
          <div className="overflow-hidden transition-[max-height] duration-500 ease-in-out" style={{ maxHeight: openSections.addOns ? "1000px" : "0" }}>
            <div className="px-8 pb-8">
              <div className="flex gap-3 flex-wrap">
                {ADD_ON_OPTIONS.map((option) => {
                  const active = !!formData.addOns?.[option.id]
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          addOns: { ...prev.addOns, [option.id]: !active },
                        }))
                      }
                      className={`px-3 py-2 rounded-full border text-sm ${active ? "bg-blue-soft text-white border-blue-soft" : "bg-gray-100 border-gray-200 text-slate-700"}`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>

              {!!formData.addOns?.giftHampers ? (
                <div className="mt-4">
                  <textarea
                    value={(formData.addOns.giftHampersDescription as string) || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        addOns: { ...prev.addOns, giftHampersDescription: e.target.value },
                      }))
                    }
                    className="w-full min-h-20 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background resize-y"
                    placeholder="Describe gift hampers"
                  />
                  {formErrors["addOns.giftHampersDescription"] ? (
                    <span className="text-danger-red text-xs">{formErrors["addOns.giftHampersDescription"]}</span>
                  ) : null}
                </div>
              ) : null}

              {!!formData.addOns?.addOther ? (
                <div className="mt-4">
                  <textarea
                    value={(formData.addOns.addOtherDescription as string) || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        addOns: { ...prev.addOns, addOtherDescription: e.target.value },
                      }))
                    }
                    className="w-full min-h-20 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background resize-y"
                    placeholder="Describe other add-ons"
                  />
                  {formErrors["addOns.addOtherDescription"] ? (
                    <span className="text-danger-red text-xs">{formErrors["addOns.addOtherDescription"]}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="w-full bg-card rounded-2xl border border-ring p-0 mb-8 shadow-none max-w-full">
        <div
          onClick={() => toggleSection("audience")}
          onKeyDown={(e) => e.key === "Enter" && toggleSection("audience")}
          className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Audience</h3>
          <ChevronDownIcon className="w-6 h-6" />
        </div>
        <div className="overflow-hidden transition-[max-height] duration-500 ease-in-out" style={{ maxHeight: openSections.audience ? "1000px" : "0" }}>
          <div className="px-8 pb-8">
            <div className="flex flex-col gap-3 mt-4">
              <h3 className="text-base font-medium text-foreground m-0">Select Age Range</h3>
              <div className="w-[70%] mx-auto py-2" style={{ paddingBottom: 28 }}>
                <DualThumbSlider
                  min={0}
                  max={100}
                  valueMin={formData.audienceRange?.min ?? 0}
                  valueMax={formData.audienceRange?.max ?? 100}
                  onChange={({ min, max }) =>
                    setFormData((prev) => ({
                      ...prev,
                      audienceRange: { min, max },
                    }))
                  }
                />
              </div>
              <h3 className="text-base font-medium text-foreground m-0">Audience Category</h3>
              <div className="flex flex-wrap gap-3 w-full">
                {TARGET_AUDIENCE_OPTIONS.map((audience) => {
                  const active = !!formData.targetAudience?.[audience]
                  return (
                    <div
                      key={audience}
                      className={`px-3 py-2 rounded-full border border-gray-200 bg-gray-100 cursor-pointer transition-all duration-200 ${active ? "border-blue-soft! bg-blue-soft!" : ""}`}
                      onClick={() => handleAudienceSelection(audience)}
                      onKeyDown={(e) => e.key === "Enter" && handleAudienceSelection(audience)}
                      role="button"
                      tabIndex={0}
                    >
                      <span className={`text-sm font-medium ${active ? "text-background" : "text-foreground"}`}>{audience}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketingForm
