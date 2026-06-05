"use client"

import React, { useMemo, useState } from "react"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShareEventButton } from "@/components/event-org/share-event-button"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { EventDetail } from "@/types/api"
import { toAllManageEvents, type AllManageEvent } from "./manage-events"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type AllEventsSectionProps = {
  events?: EventDetail[]
  isLoading?: boolean
  errorMessage?: string | null
}

const PAGE_SIZE = 5

export function AllEventsSection({
  events = [],
  isLoading = false,
  errorMessage = null,
}: AllEventsSectionProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const rows = useMemo(() => toAllManageEvents(events), [events])

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows

    const q = searchQuery.trim().toLowerCase()
    return rows.filter((event) =>
      [event.name, event.category, event.date, event.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [rows, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const pagedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, safeCurrentPage])

  const handleAction = (event: AllManageEvent, clickEvent: React.MouseEvent) => {
    clickEvent.stopPropagation()
    localStorage.setItem("eventFormData", JSON.stringify(event.formData))
    const actionUrlParam = event.action.toLowerCase()
    router.push(
      `/organizer/create-event?startDirectly=true&action=${actionUrlParam}&eventId=${encodeURIComponent(
        event.id
      )}`
    )
  }

  const handleRowClick = (event: AllManageEvent) => {
    localStorage.setItem("analyticsEventData", JSON.stringify(event.analyticsData))
    router.push(`/organizer/analytics?eventId=${encodeURIComponent(event.id)}`)
  }

  return (
    <section className="rounded-xl border overflow-hidden bg-(--events-white)">
      <div className="px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-(--upcoming-primary-700)">
        <h3 className="text-(--events-white) font-medium text-lg">All Events</h3>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative w-full sm:w-auto">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--events-white)/70"
            />
            <Input
              value={searchQuery}
              onChange={(inputEvent) => {
                setSearchQuery(inputEvent.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search Events"
              className="pl-9 h-10 w-full sm:w-56 bg-(--upcoming-primary-700) text-(--events-white) placeholder:text-(--events-white)/70 border border-(--events-white)/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button className="h-10 bg-(--events-white) text-(--upcoming-primary-700)">
              <Calendar size={16} className="mr-2" />
              Calendar
            </Button>

            <button
              type="button"
              className="h-10 w-10 bg-(--events-white) rounded flex items-center justify-center"
              aria-label="Filter"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b bg-(--events-gray-50) border-(--events-gray-200)">
              <TableHead className="px-6 py-4 text-left text-sm font-semibold text-(--events-gray-700)">
                <div className="flex items-center gap-2">
                  Date <ChevronDown size={16} />
                </div>
              </TableHead>

              <TableHead className="px-6 py-4 text-left text-sm font-semibold text-(--events-gray-700)">
                Event name
              </TableHead>

              <TableHead className="px-6 py-4 text-left text-sm font-semibold text-(--events-gray-700)">
                <div className="flex items-center gap-2">
                  Category <ChevronDown size={16} />
                </div>
              </TableHead>

              <TableHead className="px-6 py-4 text-left text-sm font-semibold text-(--events-gray-700)">
                Status
              </TableHead>

              <TableHead className="px-6 py-4 text-left text-sm font-semibold text-(--events-gray-700)">
                Action required
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                  Loading events...
                </TableCell>
              </TableRow>
            ) : errorMessage ? (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-8 text-center text-sm text-red-600">
                  {errorMessage}
                </TableCell>
              </TableRow>
            ) : pagedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                  {searchQuery.trim()
                    ? "No events match your search."
                    : "No events found. Create your first event to populate this table."}
                </TableCell>
              </TableRow>
            ) : (
              pagedRows.map((event) => (
                <TableRow
                  key={event.id}
                  className="border-b border-(--events-gray-200) cursor-pointer transition-colors"
                  onClick={() => handleRowClick(event)}
                >
                  <TableCell className="px-6 py-4 text-sm text-(--events-gray-700)">
                    {event.date}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-(--events-gray-700)">
                    {event.name}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-(--events-gray-700)">
                    {event.category}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm">
                    <span
                      className={cn(
                        event.status === "Ongoing" && "text-(--events-green-600)",
                        event.status === "Upcoming" && "text-(--events-blue-600)",
                        event.status === "Past" && "text-(--events-gray-500)"
                      )}
                    >
                      {event.status}
                    </span>
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2" onClick={(clickEvent) => clickEvent.stopPropagation()}>
                      <Button
                        size="sm"
                        onClick={(clickEvent) => handleAction(event, clickEvent)}
                        className={cn(
                          "text-(--events-white) px-6 rounded-full",
                          "bg-blue-soft"
                        )}
                      >
                        {event.action}
                      </Button>
                      <ShareEventButton
                        eventId={event.id}
                        slug={event.slug}
                        title={event.name}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--events-gray-300) text-(--events-gray-700) transition hover:bg-(--events-gray-100)"
                        iconOnly
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="px-6 py-4 flex items-center justify-between border-t border-(--events-gray-200)">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Previous
        </Button>

        <div className="flex gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={cn(
                "px-3 py-1 rounded border text-sm font-medium",
                safeCurrentPage === page
                  ? "border-(--events-gray-400) bg-(--events-gray-100)"
                  : "border-(--events-gray-300) bg-(--events-white)"
              )}
            >
              {page}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage === totalPages}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </section>
  )
}
