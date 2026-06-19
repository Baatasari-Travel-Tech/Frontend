"use client"

import React from "react"
import { ChevronDownIcon, PlusIcon, TrashIcon } from "lucide-react"
import type { EventFormData } from "./validateEventform"

interface SponsorshipFormProps {
  formData: EventFormData
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  openSections: { [key: string]: boolean }
  toggleSection: (section: string) => void
  formErrors: { [key: string]: string }
}

type SponsorItem = { name: string; website: string }
type SponsorsState = {
  titleSponsors: SponsorItem[]
  coPartners: SponsorItem[]
  mediaPartners: SponsorItem[]
  [key: string]: SponsorItem[]
}

const SponsorshipForm: React.FC<SponsorshipFormProps> = ({
  formData,
  setFormData,
  openSections,
  toggleSection,
}) => {
  const sponsors = (formData.sponsors as SponsorsState) || {
    titleSponsors: [],
    coPartners: [],
    mediaPartners: [],
  }

  const handleAddSponsor = (typeId: string) => {
    setFormData((prev) => {
      const currentSponsors = (prev.sponsors as SponsorsState) || {
        titleSponsors: [],
        coPartners: [],
        mediaPartners: [],
      }
      return {
        ...prev,
        sponsors: {
          ...currentSponsors,
          [typeId]: [...(currentSponsors[typeId] || []), { name: "", website: "" }],
        },
      }
    })
  }

  const handleRemoveSponsor = (typeId: string, index: number) => {
    setFormData((prev) => {
      const currentSponsors = prev.sponsors as SponsorsState
      return {
        ...prev,
        sponsors: {
          ...currentSponsors,
          [typeId]: (currentSponsors[typeId] || []).filter((_, i) => i !== index),
        },
      }
    })
  }

  const handleSponsorChange = (typeId: string, index: number, field: string, value: string) => {
    setFormData((prev) => {
      const currentSponsors = prev.sponsors as SponsorsState
      const updatedList = [...(currentSponsors[typeId] || [])]
      if (updatedList[index]) updatedList[index] = { ...updatedList[index], [field]: value }
      return {
        ...prev,
        sponsors: {
          ...currentSponsors,
          [typeId]: updatedList,
        },
      }
    })
  }

  const renderSponsorSection = (title: string, key: "titleSponsors" | "coPartners" | "mediaPartners") => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <label className="text-base font-medium text-foreground">{title}</label>
        <button type="button" onClick={() => handleAddSponsor(key)} className="flex items-center gap-1 bg-none border-none text-revenue text-sm font-medium cursor-pointer">
          <PlusIcon size={16} /> Add
        </button>
      </div>

      {sponsors[key]?.map((sponsor, index) => (
        <div key={index} className="relative flex gap-4 mb-3 items-start flex-wrap pr-10">
          <div className="flex-1 min-w-50">
            <input
              type="text"
              placeholder="Sponsor Name"
              value={sponsor.name}
              onChange={(e) => handleSponsorChange(key, index, "name", e.target.value)}
              className="w-full p-3 rounded-lg border border-border text-sm outline-none box-border text-gray-800 bg-white"
            />
          </div>

          <div className="flex-1 min-w-50">
            <input
              type="text"
              placeholder="Website (Optional)"
              value={sponsor.website}
              onChange={(e) => handleSponsorChange(key, index, "website", e.target.value)}
              className="w-full p-3 rounded-lg border border-border text-sm outline-none box-border text-gray-800 bg-white"
            />
          </div>

          <button
            type="button"
            onClick={() => handleRemoveSponsor(key, index)}
            className="absolute top-0 right-0 p-2 text-destructive bg-none border-none cursor-pointer flex items-center justify-center h-10 w-10"
            aria-label={`Remove ${title} sponsor`}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ))}

      {sponsors[key]?.length === 0 ? <p className="text-sm text-gray-500 italic m-0">No entries yet.</p> : null}
    </div>
  )

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="w-full bg-card rounded-2xl border border-ring p-0 shadow-none max-w-full">
        <div onClick={() => toggleSection("sponsorship")} className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer">
          <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Sponsorship (Optional)</h3>
          <ChevronDownIcon className={`w-6 h-6 transition-transform duration-300 ${openSections.sponsorship ? "rotate-180" : ""}`} />
        </div>
        {openSections.sponsorship ? (
          <div className="px-8 pb-8 max-[768px]:px-4 max-[768px]:pb-4">
            {renderSponsorSection("Title Sponsors", "titleSponsors")}
            {renderSponsorSection("Co-Partners", "coPartners")}
            {renderSponsorSection("Media Partners", "mediaPartners")}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default SponsorshipForm
