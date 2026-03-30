"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EVENT_HIGHLIGHTS } from "./data/dashboard-data"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function UpcomingEventHighlights() {
  const router = useRouter()

  const {
    title,
    date,
    time,
    type,
    venue,
    aboutTitle,
    aboutDescription,
    highlightsTitle,
    highlights,
    stats,
  } = EVENT_HIGHLIGHTS

  return (
    <Card
      className="w-full cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => router.push("/analytics")}
    >
      <CardContent className="p-4 sm:p-6 pb-6 mt-4">
        <h2 className="text-xl font-semibold text-[(--upcoming-primary-700)] mb-6">
          Upcoming Event Highlights
        </h2>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="shrink-0">
            <Image
              src="/image 6.svg"
              alt="Music Concert Poster"
              width={234}
              height={363}
              className="object-contain mx-auto lg:mx-0"
              sizes="(max-width: 640px) 70vw, 234px"
              style={{ border: "none" }}
            />
          </div>

          {/* Details */}
          <div className="flex-1 text-sm space-y-2 lg:pl-4">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1 wrap-break-word">
              {title}
            </h3>
            <p className="font-semibold text-[(--upcoming-primary-800)] text-base">
              {date}
            </p>

            <p>
              <b>Time:</b> {time}
            </p>
            <p>
              <b>Type:</b> {type}
            </p>
            <p>
              <b>Venue:</b>{" "}
              <span className="font-medium text-[(--upcoming-blue-600)]">
                {venue}
              </span>
            </p>

            {/* About */}
            <div className="pt-3">
              <p className="font-semibold mb-1 text-[(--upcoming-primary-700)]">
                {aboutTitle}
              </p>
              <p className="text-sm leading-relaxed text-[(--upcoming-gray-600)]">
                {aboutDescription}
              </p>
            </div>

            {/* Highlights */}
            <div className="pt-2">
              <p className="font-semibold mb-1 text-[(--upcoming-primary-700)]">
                {highlightsTitle}
              </p>
              <ul className="list-disc ml-4 text-sm text-[(--upcoming-gray-600)]">
                <li>
                  {highlights[0]}
                  <br />
                  <span className="ml-0">
                    {highlights[1]}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Stats & Actions */}
          <div className="w-full lg:w-90 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-4">
              <Stat title="Event Registrations" value={stats.registrations} />
              <Stat title="Total Revenue" value={stats.revenue} />
              <Stat title="Ad Ons" value={stats.addOns} />
              <Stat title="Date Change" value={stats.dateChange} />
            </div>

            {/* Buttons */}
            <div className="flex flex-nowrap items-center gap-2 sm:gap-3 mt-10 w-full justify-between sm:justify-start pb-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full text-xs sm:text-sm px-2 sm:px-4 py-2 border-destructive text-destructive whitespace-nowrap flex-1 sm:flex-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel the event. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Keep Event</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => {
                      e.stopPropagation();
                      console.log("Event cancelled");
                    }}>
                      Cancel Event
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="outline"
                className="rounded-full text-xs sm:text-sm px-2 sm:px-4 py-2 border-foreground text-[(--upcoming-blue-600)] whitespace-nowrap flex-1 sm:flex-none"
                onClick={(e) => {
                  e.stopPropagation();
                  const formData = {
                    eventName: title,
                    category: type,
                    description: aboutDescription,
                    date,
                    time,
                    venue,
                    tagline: highlightsTitle,
                  };
                  localStorage.setItem("eventFormData", JSON.stringify(formData));
                  router.push("/create-event?startDirectly=true&action=reschedule");
                }}
              >
                Reschedule
              </Button>

              <Button
                className="rounded-full text-xs sm:text-sm px-4 sm:px-6 py-2 bg-foreground text-background whitespace-nowrap flex-1 sm:flex-none ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/analytics");
                }}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="border border-border rounded-xl px-4 sm:px-5 py-4 sm:py-5 bg-card min-w-0">
      <p className="text-xs sm:text-sm text-black font-medium mb-2 wrap-break-word">
        {title}
      </p>
      <p className="text-xl sm:text-2xl font-bold wrap-break-word">{value}</p>
    </div>
  )
}
