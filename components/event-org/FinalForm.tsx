"use client"

import React, { useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import type { EventFormData } from "./validateEventform"

interface FinalFormProps {
  formData: EventFormData
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  formErrors: { [key: string]: string }
}

const FinalForm: React.FC<FinalFormProps> = ({
  formData,
  setFormData,
  formErrors,
}) => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    contactInfo: true,
    postEvent: true,
  })

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="w-full bg-card rounded-2xl border border-ring p-0 shadow-none max-w-full">
        <div onClick={() => toggleSection("contactInfo")} className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer">
          <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Contact Information</h3>
          <ChevronDownIcon className={`w-6 h-6 transition-transform duration-300 ${openSections.contactInfo ? "rotate-180" : ""}`} />
        </div>
        {openSections.contactInfo ? (
          <div className="px-8 pb-8 max-[768px]:px-4 max-[768px]:pb-4">
            <div className="grid gap-6 mt-4">
              <div className="flex gap-6 flex-wrap w-full">
                <div className="flex-[1_1_250px] relative min-w-62.5">
                  <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs font-medium text-gray-700 z-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.contactInfo.mobile || "+91 "}
                    onChange={(e) => {
                      const value = e.target.value
                      let inputWithoutPrefix = value.startsWith("+91 ") ? value.slice(4) : value
                      if (!value.startsWith("+91 ")) {
                        inputWithoutPrefix = value.replace(/^\+91\s?/, "").replace(/[^0-9]/g, "")
                      }
                      if (/^\d*$/.test(inputWithoutPrefix) && inputWithoutPrefix.length <= 10) {
                        setFormData((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, mobile: `+91 ${inputWithoutPrefix}` },
                        }))
                      }
                    }}
                    name="contactInfo.mobile"
                    className={`w-full px-4 py-3 border rounded text-sm outline-none text-gray-800 bg-background box-border ${formErrors["contactInfo.mobile"] ? "border-red-400" : "border-gray-400"}`}
                    placeholder="Enter mobile number"
                  />
                  {formErrors["contactInfo.mobile"] ? <span className="text-danger-red text-xs">{formErrors["contactInfo.mobile"]}</span> : null}
                </div>

                <div className="flex-[1_1_250px] relative min-w-62.5">
                  <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs font-medium text-gray-700 z-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.contactInfo.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, email: e.target.value },
                      }))
                    }
                    name="contactInfo.email"
                    className={`w-full px-4 py-3 border rounded text-sm outline-none text-gray-800 bg-background box-border ${formErrors["contactInfo.email"] ? "border-red-400" : "border-gray-400"}`}
                    placeholder="example@email.com"
                  />
                  {formErrors["contactInfo.email"] ? <span className="text-danger-red text-xs">{formErrors["contactInfo.email"]}</span> : null}
                </div>
              </div>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs font-medium text-gray-700 z-1">Website (Optional)</label>
                <input
                  type="url"
                  value={formData.contactInfo.website}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, website: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-400 rounded text-sm outline-none text-gray-800 bg-background box-border"
                  placeholder="https://www.example.com"
                />
                {formErrors["contactInfo.website"] ? <span className="text-danger-red text-xs">{formErrors["contactInfo.website"]}</span> : null}
              </div>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs font-medium text-gray-700 z-1">Additional Links (Optional)</label>
                <input
                  type="text"
                  value={formData.contactInfo.additionalLinks}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, additionalLinks: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-400 rounded text-sm outline-none text-gray-800 bg-background box-border"
                  placeholder="Social media, portfolio, etc."
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="w-full bg-card rounded-2xl border border-ring p-0 shadow-none max-w-full">
        <div onClick={() => toggleSection("postEvent")} className="px-8 py-7.5 flex items-start justify-between w-full cursor-pointer">
          <h3 className="text-2xl font-medium text-upcoming-primary-700 m-0">Post-Event Follow Up</h3>
          <ChevronDownIcon className={`w-6 h-6 transition-transform duration-300 ${openSections.postEvent ? "rotate-180" : ""}`} />
        </div>
        {openSections.postEvent ? (
          <div className="px-8 pb-8 max-[768px]:px-4 max-[768px]:pb-4">
            <div className="mt-4 relative">
              <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs font-medium text-gray-700 z-1">Follow-up Message *</label>
              <textarea
                className={`w-full h-30 px-4 py-3 border rounded text-sm outline-none resize-y text-gray-800 bg-background box-border ${formErrors["postEventFollowUp.thankYouNote"] ? "border-red-400" : "border-gray-400"}`}
                name="postEventFollowUp.thankYouNote"
                value={formData.postEventFollowUp?.thankYouNote || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    postEventFollowUp: { ...prev.postEventFollowUp, thankYouNote: e.target.value },
                  }))
                }
                placeholder="Write the message attendees should receive after the event..."
              />
              {formErrors["postEventFollowUp.thankYouNote"] ? (
                <span className="text-danger-red text-xs">{formErrors["postEventFollowUp.thankYouNote"]}</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default FinalForm
