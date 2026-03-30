"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { ALL_EVENTS_DATA, type EventItem } from "./manage-events";
import { EventFormData } from "../data/create-event-data";
import { cn } from "@/lib/utils";

// shadcn Table components (make sure you installed: `npx shadcn-ui@latest add table`) [web:128]
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AllEventsSection() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const events = useMemo(() => {
    return currentPage === 1 ? ALL_EVENTS_DATA.page1 : ALL_EVENTS_DATA.page2;
  }, [currentPage]);

  const handleAction = (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();

    const formData: Partial<EventFormData> = {
      eventName: event.name,
      category: event.category,
      description: `Description for ${event.name}`,
      date: event.date,
      time: "",
      endTime: "",
      venue: "",
      googleMapsUrl: "",
      personnel: "",
      tagline: "",
      contactInfo: { mobile: "", email: "", website: "", additionalLinks: "" },
    };

    if (event.action === "Repeat") {
      formData.date = "";
      formData.time = "";
      formData.endTime = "";
    }

    localStorage.setItem("eventFormData", JSON.stringify(formData));
    const actionUrlParam = event.action.toLowerCase();
    router.push(`/create-event?startDirectly=true&action=${actionUrlParam}`);
  };

  const handleRowClick = (event: EventItem) => {
    const analyticsData = {
      eventName: event.name,
      date: event.date,
      category: event.category,
      status: event.status,
    };

    localStorage.setItem("analyticsEventData", JSON.stringify(analyticsData));
    router.push("/analytics");
  };

  return (
    <section className="rounded-xl border overflow-hidden bg-(--events-white)">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-(--upcoming-primary-700)">
        <h3 className="text-(--events-white) font-medium text-lg">
          All Events
        </h3>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative w-full sm:w-auto">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--events-white)/70"
            />
            <Input
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

      {/* Table (shadcn) */}
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
            {events.map((event, idx) => (
              <TableRow
                key={idx}
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
                      event.status !== "Ongoing" &&
                      event.status !== "Upcoming" &&
                      "text-(--events-gray-500)"
                    )}
                  >
                    {event.status}
                  </span>
                </TableCell>

                <TableCell className="px-6 py-4 text-sm">
                  <Button
                    size="sm"
                    onClick={(e) => handleAction(event, e)}
                    className={cn(
                      "text-(--events-white) px-6 rounded-full",
                      "bg-blue-soft"
                    )}
                  >
                    {event.action}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-(--events-gray-200)">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Previous
        </Button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            className={cn(
              "px-3 py-1 rounded border text-sm font-medium",
              currentPage === 1
                ? "border-(--events-gray-400) bg-(--events-gray-100)"
                : "border-(--bg-blue-soft) bg-(--events-white)"
            )}
          >
            1
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(2)}
            className={cn(
              "px-3 py-1 rounded border text-sm font-medium",
              currentPage === 2
                ? "border-(--events-gray-400) bg-(--events-gray-100)"
                : "border-(--events-gray-300) bg-(--events-white)"
            )}
          >
            2
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(2, currentPage + 1))}
          disabled={currentPage === 2

          }
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </section>
  );
}
