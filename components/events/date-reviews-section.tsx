"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api/client"

type HighlightedDate = { date: Date; count: number }

type DateRequestItem = {
  requestedDate: string
  count: number
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  )
}

function useDateRequests(eventId?: string) {
  return useQuery({
    queryKey: ["event-date-requests", eventId],
    queryFn: async () => {
      const response = await apiRequest<{ data: { dateRequests: DateRequestItem[] } }>(
        `/events/${eventId}/date-requests`
      )
      return response.data.dateRequests.map((item) => ({
        date: new Date(item.requestedDate + "T00:00:00"),
        count: item.count,
      })) as HighlightedDate[]
    },
    enabled: Boolean(eventId),
  })
}

export function DateReviewsSection({ eventId }: { eventId?: string }) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthStart = new Date(currentYear, now.getMonth(), 1)
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [month, setMonth] = React.useState<Date>(currentMonthStart)
  const [submitted, setSubmitted] = React.useState(false)

  const queryClient = useQueryClient()
  const { data: dateRequests = [] } = useDateRequests(eventId)

  const mutation = useMutation({
    mutationFn: async (selectedDate: Date) => {
      await apiRequest(`/events/${eventId}/date-requests`, {
        method: "POST",
        body: JSON.stringify({ requestedDate: format(selectedDate, "yyyy-MM-dd") }),
      })
    },
    onSuccess: () => {
      setSubmitted(true)
      queryClient.invalidateQueries({ queryKey: ["event-date-requests", eventId] })
    },
  })

  const handleSubmit = () => {
    if (!date || !eventId) return
    mutation.mutate(date)
  }

  // Can't go before the current month; cap at December of the current year.
  const isFirstMonth = month.getMonth() === now.getMonth() && month.getFullYear() === currentYear
  const isLastMonth = month.getMonth() === 11 && month.getFullYear() === currentYear

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-full justify-center items-center lg:items-stretch">
      {/* Calendar Card */}
      <div className="flex flex-col gap-6 w-full lg:w-auto">
        <div className="border border-border rounded-2xl p-6 md:p-8 bg-background shadow-sm flex flex-col overflow-hidden flex-1 min-w-70 lg:min-w-95">
          <h2 className="text-2xl font-bold text-blue-soft mb-6 px-2">Date Change</h2>
          <div className="flex items-center justify-between mb-6 px-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-transparent"
              disabled={isFirstMonth}
              onClick={() => {
                if (!isFirstMonth) setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }}
            >
              <ChevronLeft className={`h-5 w-5 ${isFirstMonth ? "text-gray-300" : "text-gray-600"}`} />
            </Button>

            <span className="text-lg text-gray-900 font-normal">
              {format(month, "MMMM yyyy")}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-transparent"
              disabled={isLastMonth}
              onClick={() => {
                if (!isLastMonth) setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }}
            >
              <ChevronRight className={`h-5 w-5 ${isLastMonth ? "text-gray-300" : "text-gray-600"}`} />
            </Button>
          </div>

          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={date}
            onSelect={setDate}
            weekStartsOn={1}
            disabled={(d) => d < today || d.getFullYear() !== currentYear}
            formatters={{
              formatWeekdayName: (d) => format(d, "EEE"),
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
                const data = dateRequests.find((d) => isSameDay(d.date, dateObj))

                let wrapperClass = "bg-gray-50 text-gray-900 hover:bg-gray-100"
                if (data) wrapperClass = "bg-[#dcfce7] text-gray-900 hover:bg-[#bbf7d0]"
                if (modifiers.selected && !data) wrapperClass = "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                if (modifiers.selected && data) wrapperClass = "border-2 border-emerald-500 bg-[#dcfce7] text-gray-900"
                if (modifiers.disabled) wrapperClass = "bg-gray-50 text-gray-300 cursor-not-allowed"

                return (
                  <button
                    {...buttonProps}
                    className={`w-full aspect-square flex flex-col items-center justify-center rounded-xl transition-all ${wrapperClass}`}
                  >
                    <span className="text-sm font-medium">{dateObj.getDate()}</span>
                    {data ? (
                      <span className="text-[10px] font-bold leading-none mt-0.5 text-emerald-600">
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

          <div className="mt-4 px-2">
            {submitted ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 text-center">
                Your date request has been submitted!
              </p>
            ) : (
              <Button
                className="w-full rounded-xl"
                disabled={!date || mutation.isPending || !eventId}
                onClick={handleSubmit}
              >
                {mutation.isPending
                  ? "Submitting..."
                  : date
                  ? `Request ${format(date, "dd/MM/yyyy")}`
                  : "Select a date to request"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
