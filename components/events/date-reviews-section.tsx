"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { addMonths, subMonths, format } from "date-fns"

type HighlightColor = "pink" | "green" | "yellow"

type HighlightedDate = {
  date: Date
  count: number
  color: HighlightColor
}

// Helper to get a date in the current month
function currentMonthDate(day: number): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), day)
}

// --- Mock Data ---
const highlightedDates: HighlightedDate[] = [
  { date: currentMonthDate(10), count: 20, color: "pink" },
  { date: currentMonthDate(13), count: 100, color: "green" },
  { date: currentMonthDate(14), count: 52, color: "yellow" },
  { date: currentMonthDate(15), count: 17, color: "pink" },
  { date: currentMonthDate(19), count: 31, color: "pink" },
  { date: currentMonthDate(20), count: 83, color: "yellow" },
  { date: currentMonthDate(27), count: 145, color: "green" },
]

function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  )
}

export function DateReviewsSection() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [month, setMonth] = React.useState<Date>(new Date())

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-full justify-center items-center lg:items-stretch">
      {/* Calendar Card */}
      <div className="flex flex-col gap-6 w-full lg:w-auto">
        <div className="border border-border rounded-2xl p-6 md:p-8 bg-background shadow-sm flex flex-col overflow-hidden flex-1 min-w-70 lg:min-w-95">
          {/* Header */}
          <h2 className="text-2xl font-bold text-blue-soft mb-6 px-2">Date Change</h2>
          <div className="flex items-center justify-between mb-6 px-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-transparent"
              onClick={() => setMonth((prev) => subMonths(prev, 1))}
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </Button>

            <span className="text-lg text-gray-900 font-normal">
              {format(month, "MMMM yyyy")}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-transparent"
              onClick={() => setMonth((prev) => addMonths(prev, 1))}
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </Button>
          </div>

          {/* Calendar */}
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={date}
            onSelect={setDate}
            weekStartsOn={1}
            formatters={{
              formatWeekdayName: (date) => format(date, "EEE"),
            }}
            className="p-0 w-full max-w-full"
            classNames={{
              months: "w-full",
              month: "flex flex-col w-full gap-4",
              month_caption: "hidden",
              nav: "hidden",
              table: "w-full border-collapse",
              weekdays: "flex w-full",
              weekday: "text-gray-600 font-normal text-sm flex-1 text-center p-2",
              week: "flex w-full mt-2",
              day: "flex-1 p-1 text-center relative aspect-square",
              today: "bg-transparent",
              outside: "text-muted-foreground opacity-50",
              disabled: "text-muted-foreground opacity-50",
            }}
            components={{
              DayButton: (props) => {
                const { day, modifiers, ...buttonProps } = props
                const dateObj = day.date
                const data = highlightedDates.find((d) => isSameDay(d.date, dateObj))

                // Default styles (light gray box, black text) like Day 1, 2, 4 etc.
                let wrapperClass = "bg-gray-50 text-gray-900 hover:bg-gray-100"
                const countColor = "text-[#10b981]" // Small numbers are always green in the image

                if (data) {
                  if (data.color === "pink") {
                    wrapperClass = "bg-[#fee2e2] text-gray-900 hover:bg-[#ffcfcf]"
                  } else if (data.color === "green") {
                    wrapperClass = "bg-[#dcfce7] text-gray-900 hover:bg-[#bbf7d0]"
                  } else if (data.color === "yellow") {
                    wrapperClass = "bg-[#fef9c3] text-gray-900 hover:bg-[#fef08a]"
                  }
                }

                // Selected day (e.g. Day 3) has white background and border
                if (modifiers.selected && !data) {
                  wrapperClass = "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                }

                return (
                  <button
                    {...buttonProps}
                    className={`w-full aspect-square flex flex-col items-center justify-center rounded-xl transition-all ${wrapperClass}`}
                  >
                    <span className="text-sm font-medium">{dateObj.getDate()}</span>
                    {data ? (
                      <span className={`text-[10px] font-bold leading-none mt-0.5 ${countColor}`}>
                        {data.count}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold opacity-0 leading-none mt-0.5" aria-hidden="true">
                        00
                      </span>
                    )}
                  </button>
                )
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
