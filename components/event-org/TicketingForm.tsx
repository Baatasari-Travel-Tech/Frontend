"use client"

import React, { useCallback, useRef } from "react"
import { ChevronDownIcon, PlusIcon, TrashIcon } from "lucide-react"
import {
  EventFormData,
  ADD_ON_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  AGE_GROUP_PRESETS,
} from "./data/create-event-data"

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

const minGap = 5

const DualThumbSlider: React.FC<{
  min: number
  max: number
  valueMin: number
  valueMax: number
  onChange: (values: { min: number; max: number }) => void
  disabled?: boolean
}> = ({ min = 0, max = 100, valueMin, valueMax, onChange, disabled = false }) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const percent = (v: number) => ((v - min) / (max - min)) * 100

  const startDrag = (thumb: "min" | "max") => () => {
    if (disabled) return
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
    <div className={`relative h-10 my-5 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
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

function PriceSummaryTable({ price, gatewayBearer, onGatewayBearerToggle }: {
  price: number
  gatewayBearer: "customer" | "organizer"
  onGatewayBearerToggle: () => void
}) {
  const PLATFORM_FEE = 10
  const RAZORPAY_RATE = 0.02 * 1.18
  const net = price + PLATFORM_FEE
  const gatewayFee = price > 0 ? Number((net * RAZORPAY_RATE / (1 - RAZORPAY_RATE)).toFixed(2)) : 0

  const customerPays = net + (gatewayBearer === "customer" ? gatewayFee : 0)
  const organizerGets = price - (gatewayBearer === "organizer" ? Number((net * RAZORPAY_RATE).toFixed(2)) : 0)
  const totalCharges = PLATFORM_FEE + gatewayFee

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
      <p className="font-semibold text-slate-700 mb-3">Fee Summary</p>
      <table className="w-full text-xs">
        <tbody>
          <tr className="border-b border-slate-200">
            <td className="py-2 text-slate-600">Platform Fee</td>
            <td className="py-2 text-center font-medium">₹10/-</td>
            <td className="py-2 text-right text-slate-500">Organizer</td>
          </tr>
          <tr className="border-b border-slate-200">
            <td className="py-2 text-slate-600">Payment Gateway Fee <span className="text-slate-400">(2% + 18% GST)</span></td>
            <td className="py-2 text-center font-medium">
              {price > 0 ? `₹${gatewayFee.toFixed(2)}` : "—"}
            </td>
            <td className="py-2 text-right">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => gatewayBearer !== "organizer" && onGatewayBearerToggle()}
                  className={`rounded-full px-2 py-0.5 transition-colors duration-150 ${gatewayBearer === "organizer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  Organizer
                </button>
                <button
                  type="button"
                  onClick={() => gatewayBearer !== "customer" && onGatewayBearerToggle()}
                  className={`rounded-full px-2 py-0.5 transition-colors duration-150 ${gatewayBearer === "customer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  Customer
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-3 pt-3 border-t border-slate-300 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">Customer pays</span>
          <span className="font-semibold text-slate-800">{price > 0 ? `₹${customerPays.toFixed(2)}` : "Free"}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">Organizer gets</span>
          <span className="font-semibold text-green-700">{price > 0 ? `₹${Math.max(0, organizerGets).toFixed(2)}` : "—"}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">Charges (Platform + Gateway)</span>
          <span className="font-medium text-slate-600">{price > 0 ? `₹${totalCharges.toFixed(2)}` : "₹10.00 (on organizer)"}</span>
        </div>
        <div className="flex justify-between text-xs border-t border-slate-200 pt-1.5 mt-1">
          <span className="font-semibold text-slate-800">Total</span>
          <span className="font-bold text-slate-900">{price > 0 ? `₹${customerPays.toFixed(2)}` : "Free"}</span>
        </div>
      </div>
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
  const gatewayBearer = formData.gatewayBearer ?? "customer"

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

  const handleTierFreeToggle = (index: number, isFree: boolean) => {
    updateArrayField("audienceCategory", index, "isFree", isFree)
    const updatedTiers = audienceCategory.map((tier, i) =>
      i === index ? { ...tier, isFree } : tier
    )
    const allFree = updatedTiers.every((t) => t.isFree)
    setFormData((prev) => ({ ...prev, ticketType: allFree ? "free" : "paid" }))
  }

  const handleAgePreset = (preset: { label: string; min: number; max: number } | null) => {
    if (preset === null) {
      setFormData((prev) => ({ ...prev, ageGroupPreset: "" }))
    } else {
      setFormData((prev) => ({
        ...prev,
        ageGroupPreset: preset.label,
        audienceRange: { min: preset.min, max: preset.max },
      }))
    }
  }

  const selectedPreset = formData.ageGroupPreset ?? ""

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

        <div className="overflow-hidden transition-[max-height] duration-500 ease-in-out" style={{ maxHeight: openSections.ticketing ? "4000px" : "0" }}>
          <div className="px-8 pb-8">
            {formErrors.ticketType ? <span className="text-danger-red text-xs">{formErrors.ticketType}</span> : null}

            <div className="flex flex-col gap-4 mt-4">
              {audienceCategory.map((tier, index) => (
                <div key={index} className="flex flex-col gap-4 relative border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-foreground m-0">Category {index + 1}</h3>
                    {audienceCategory.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("audienceCategory", index)}
                        className="p-2 text-destructive bg-none border-none cursor-pointer"
                        aria-label={`Remove audience category ${index + 1}`}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    ) : null}
                  </div>

                  {/* Ticket name */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                      Ticket Name *
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

                  {/* Limited tickets row: toggle on left, if limited — number input on right (half width) */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 w-1/2">
                      <span className="text-sm font-medium text-slate-700">Limited tickets</span>
                      <button
                        type="button"
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ml-3 ${tier.isLimited ? "bg-blue-soft" : "bg-gray-300"}`}
                        onClick={() => updateArrayField("audienceCategory", index, "isLimited", !tier.isLimited)}
                        aria-checked={tier.isLimited}
                        role="switch"
                      >
                        <div className={`w-4.5 h-4.5 rounded-full bg-card absolute top-0.75 transition-[left] duration-300 ${tier.isLimited ? "left-6.75" : "left-0.75"}`} />
                      </button>
                    </div>

                    {tier.isLimited ? (
                      <div className="relative w-1/2">
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
                  </div>

                  {/* Price row: input + Free toggle */}
                  <div className="flex items-start gap-3">
                    {!tier.isFree ? (
                      <div className="relative flex-1">
                        <label className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute z-10">
                          Price *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-600">₹</span>
                          <input
                            type="number"
                            min="10"
                            max="15000"
                            step="1"
                            value={tier.price || ""}
                            onChange={(e) => updateArrayField("audienceCategory", index, "price", e.target.value)}
                            className="w-full h-12 pl-8 pr-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background"
                            placeholder="Min ₹10"
                          />
                        </div>
                        {formErrors[`audienceCategory.${index}.price`] ? (
                          <span className="text-danger-red text-xs">{formErrors[`audienceCategory.${index}.price`]}</span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex-1 h-12 flex items-center px-4 rounded-md border border-dashed border-gray-300 bg-gray-50">
                        <span className="text-sm text-gray-400 italic">Free ticket — no charge to attendee</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 h-12 mt-0">
                      <button
                        type="button"
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${tier.isFree ? "bg-blue-soft" : "bg-gray-300"}`}
                        onClick={() => handleTierFreeToggle(index, !tier.isFree)}
                        aria-checked={tier.isFree}
                        role="switch"
                      >
                        <div className={`w-4.5 h-4.5 rounded-full bg-card absolute top-0.75 transition-[left] duration-300 ${tier.isFree ? "left-6.75" : "left-0.75"}`} />
                      </button>
                      <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Free</span>
                    </div>
                  </div>

                  {/* Note + price range */}
                  {!tier.isFree && (
                    <p className="text-xs text-slate-500 -mt-2">
                      Price range: ₹10 – ₹15,000 &nbsp;·&nbsp;
                      <span className="text-slate-600 font-medium">
                        Note: A platform fee of ₹10 will be included in the ticket price.
                      </span>
                    </p>
                  )}

                  {/* Fee summary table */}
                  {!tier.isFree && (
                    <PriceSummaryTable
                      price={Number(tier.price) || 0}
                      gatewayBearer={gatewayBearer}
                      onGatewayBearerToggle={() =>
                        setFormData((prev) => ({
                          ...prev,
                          gatewayBearer: prev.gatewayBearer === "customer" ? "organizer" : "customer",
                        }))
                      }
                    />
                  )}

                  {/* Description */}
                  <div className="relative w-full">
                    <label className="block text-xs font-medium text-gray-700 bg-card -mt-2.5 ml-3 px-1 absolute">
                      Description *
                    </label>
                    <textarea
                      value={tier.description || ""}
                      onChange={(e) => updateArrayField("audienceCategory", index, "description", e.target.value)}
                      className="w-full min-h-20 px-4 py-3 border border-gray-400 rounded-md text-sm text-gray-800 bg-background resize-y"
                      placeholder="Describe this ticket category"
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
        <div className="overflow-hidden transition-[max-height] duration-500 ease-in-out" style={{ maxHeight: openSections.audience ? "1200px" : "0" }}>
          <div className="px-8 pb-8">
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-foreground m-0">Age Range</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-soft">{formData.audienceRange?.min ?? 18}</span>
                  <span className="text-xs text-muted-foreground">–</span>
                  <span className="text-sm font-semibold text-revenue">{formData.audienceRange?.max ?? 60}</span>
                  <span className="text-xs text-muted-foreground">years</span>
                </div>
              </div>

              <div className="w-[80%] mx-auto py-2" style={{ paddingBottom: 28 }}>
                <DualThumbSlider
                  min={0}
                  max={100}
                  valueMin={formData.audienceRange?.min ?? 18}
                  valueMax={formData.audienceRange?.max ?? 60}
                  onChange={({ min, max }) => {
                    setFormData((prev) => ({
                      ...prev,
                      audienceRange: { min, max },
                      ageGroupPreset: "",
                    }))
                  }}
                  disabled={!!selectedPreset}
                />
              </div>

              <p className="text-xs text-muted-foreground -mt-4 mb-1">Or select a preset — disables the slider</p>

              <div className="flex flex-wrap gap-2">
                {AGE_GROUP_PRESETS.map((preset) => {
                  const isActive = selectedPreset === preset.label
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleAgePreset(isActive ? null : preset)}
                      className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? "bg-blue-soft text-white border-blue-soft"
                          : "bg-gray-100 border-gray-200 text-slate-700 hover:bg-gray-200"
                      }`}
                    >
                      {preset.label}
                      <span className="ml-1 text-[10px] opacity-70">({preset.min}–{preset.max})</span>
                    </button>
                  )
                })}
              </div>

              <h3 className="text-base font-medium text-foreground mt-4 mb-0">Audience Category</h3>
              <div className="flex flex-wrap gap-2 w-full">
                {TARGET_AUDIENCE_OPTIONS.map((audience) => {
                  const active = !!formData.targetAudience?.[audience]
                  return (
                    <div
                      key={audience}
                      className={`px-3 py-1.5 rounded-full border cursor-pointer transition-all duration-200 text-sm font-medium ${
                        active
                          ? "border-blue-soft bg-blue-soft text-white"
                          : "border-gray-200 bg-gray-100 text-slate-700 hover:bg-gray-200"
                      }`}
                      onClick={() => handleAudienceSelection(audience)}
                      onKeyDown={(e) => e.key === "Enter" && handleAudienceSelection(audience)}
                      role="button"
                      tabIndex={0}
                    >
                      {audience}
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
