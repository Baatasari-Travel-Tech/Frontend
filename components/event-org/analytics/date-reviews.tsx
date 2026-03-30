"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import { addMonths, subMonths, format } from "date-fns"

type HighlightColor = "pink" | "green" | "yellow"

type HighlightedDate = {
  date: Date
  count: number
  color: HighlightColor
}

type Review = {
  id: number
  name: string
  avatar: string
  rating: number
  text: string
  time: string
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

const reviews: Review[] = [
  {
    id: 1,
    name: "Riya Mehta",
    avatar: "/avatars/01.png",
    rating: 5,
    text: "Amazing experience!",
    time: "18 minutes ago",
  },
  {
    id: 2,
    name: "Rahul Deshmukh",
    avatar: "/avatars/02.png",
    rating: 5,
    text: "Fantastic event",
    time: "18 minutes ago",
  },
  {
    id: 3,
    name: "Sanya Kapoor",
    avatar: "/avatars/03.png",
    rating: 4,
    text: "Loved it",
    time: "2 hours ago",
  },
  {
    id: 4,
    name: "Amit Patel",
    avatar: "/avatars/04.png",
    rating: 5,
    text: "Superb!",
    time: "1 day ago",
  },
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

  const totalReviews = reviews.length
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0
  const averageRatingText = averageRating.toFixed(1)
  const filledAverageStars = Math.floor(averageRating)

  const ratingCounts = [5, 4, 3, 2, 1].reduce<Record<number, number>>(
    (acc, star) => {
      acc[star] = reviews.filter((r) => r.rating === star).length
      return acc
    },
    {}
  )

  const STAR_ON = "fill-yellow-400 text-yellow-400"
  const STAR_OFF = "fill-yellow-200/40 text-yellow-300/60"

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[520px_1fr] lg:grid-cols-[480px_1fr] w-full">
      {/* Left Card */}
      <div className="flex flex-col gap-6 h-full">
        <div className="border border-border rounded-2xl p-6 md:p-8 bg-background shadow-sm flex flex-col overflow-hidden flex-1">
          {/* Header */}
          <h2 className="text-2xl font-bold text-blue-soft mb-6 px-2">Date Change</h2>
          <div className="flex items-center justify-between mb-6 px-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
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
              className="h-8 w-8"
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
                let wrapperClass = "bg-gray-50 text-gray-900"
                const countColor = "text-[#10b981]" // Small numbers are always green in the image

                if (data) {
                  if (data.color === "pink") {
                    wrapperClass = "bg-[#fee2e2] text-gray-900"
                  } else if (data.color === "green") {
                    wrapperClass = "bg-[#dcfce7] text-gray-900"
                  } else if (data.color === "yellow") {
                    wrapperClass = "bg-[#fef9c3] text-gray-900"
                  }
                }

                // Selected day (e.g. Day 3) has white background and border
                if (modifiers.selected && !data) {
                  wrapperClass = "border border-gray-300 bg-white text-gray-900"
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

      {/* Reviews */}
      <div className="relative w-full mt-6 lg:mt-0 lg:h-full">
        <div className="lg:absolute lg:inset-x-0 lg:bottom-0 lg:top-0 flex flex-col w-full h-120 lg:h-auto">
          <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-blue-soft">
                Customer Reviews
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col h-full overflow-hidden gap-6">
              {/* Ratings */}
              <div className="flex items-center gap-6">
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingCounts[star] ?? 0
                    const value = totalReviews > 0 ? (count / totalReviews) * 100 : 0

                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs w-6 text-muted-foreground">
                          {star}.0
                        </span>
                        <Progress value={value} className="h-2 [&>div]:bg-yellow-400" />
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col items-center justify-center min-w-25">
                  <span className="text-5xl font-bold text-foreground">
                    {averageRatingText}
                  </span>

                  <div className="flex gap-0.5 my-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < filledAverageStars ? STAR_ON : STAR_OFF
                          }`}
                      />
                    ))}
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {totalReviews} reviews
                  </span>
                </div>
              </div>

              {/* Review List */}
              <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border border-border p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.avatar} />
                          <AvatarFallback>
                            {review.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <span className="font-semibold text-sm text-foreground">
                          {review.name}
                        </span>
                      </div>

                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? STAR_ON : STAR_OFF
                              }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {review.text}
                    </p>

                    <p className="text-xs text-muted-foreground">{review.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
