"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import {
  LOCATIONS,
  CATEGORIES,
  MONTHS,
  type ComboboxItem as ComboboxItemType,
} from "@/lib/suggestions-data"

export default function SuggestionsForm() {
  const router = useRouter()
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("")
  const [month, setMonth] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/onboarding")
  }

  const inputClass =
    "w-full px-5 py-1 md:py-3 h-8 md:h-auto rounded-lg bg-(--white) dark:bg-(--white) text-(--gray-800) placeholder-(--gray-500) focus:outline-none focus:ring-2 focus:ring-(--white)/40 text-sm md:text-base border-0"

  const comboboxWrapperClass =
    "w-full h-8 md:h-auto rounded-lg border-0 bg-(--white) dark:bg-(--white) shadow-none"

  const comboboxInputClass =
    "h-8 md:h-auto rounded-lg border-0 bg-(--white) dark:bg-(--white) px-5 py-1 md:py-3 text-(--gray-800) placeholder-(--gray-500) focus:outline-none focus:ring-0 text-sm md:text-base"

  const labelClass =
    "font-albert font-medium text-[16px] leading-[24px] tracking-[0] text-(--white) mb-[14px] block"

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
    <section className="py-10 bg-(--brand-blue)">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
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
              />
            </div>

            <div>
              <label className={labelClass}>Location</label>
              <ComboboxField
                items={LOCATIONS}
                value={location}
                onValueChange={setLocation}
                placeholder="Select Location"
              />
            </div>

            <div>
              <label className={labelClass}>Category</label>
              <ComboboxField
                items={CATEGORIES}
                value={category}
                onValueChange={setCategory}
                placeholder="Select Category"
              />
            </div>

            <div>
              <label className={labelClass}>Month</label>
              <ComboboxField
                items={MONTHS}
                value={month}
                onValueChange={setMonth}
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
            />
          </div>

          {/* Submit */}
          <div className="pt-6 flex justify-center">
            <Button
              type="submit"
              className="w-full max-w-120 h-15 px-5 py-4.5 rounded-full bg-(--brand-navy) border border-(--brand-navy) text-(--white) font-inter font-semibold text-[16px] leading-6 tracking-[0] flex items-center justify-center transition hover:bg-(--brand-navy)/90"
            >
              Let&apos;s Create
            </Button>
          </div>
        </form>
      </div>
    </section >
  );
}
