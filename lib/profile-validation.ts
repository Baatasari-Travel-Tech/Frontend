export const OTHER_PROFESSION_VALUE = "Other"

export const PROFESSION_OPTIONS = [
  "Student (School / College)",
  "Job Seeker",
  "Working Professional - IT / Tech",
  "Working Professional - Non-Tech",
  "Entrepreneur / Founder",
  "Freelancer / Creator",
  "Business Owner (SME)",
  "Corporate Executive / Manager",
  "Developer / Engineer",
  "Designer / Creative Professional",
  "Marketing / Sales Professional",
  "Finance / Banking Professional",
  "Healthcare Professional",
  "Educator / Trainer",
  "Government / Public Sector",
  "Homemaker",
  "Retired",
  OTHER_PROFESSION_VALUE,
] as const

export const isPredefinedProfession = (value: string) =>
  PROFESSION_OPTIONS.includes(value as (typeof PROFESSION_OPTIONS)[number])

const pad = (value: number) => value.toString().padStart(2, "0")

const formatDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const getDobDateBounds = (today: Date = new Date()) => {
  const minDate = new Date(today)
  minDate.setFullYear(minDate.getFullYear() - 100)

  return {
    min: formatDateInputValue(minDate),
    max: formatDateInputValue(today),
  }
}

export const isDobWithinBounds = (dob: string, bounds: { min: string; max: string }) =>
  dob >= bounds.min && dob <= bounds.max
