"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
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
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { UPCOMING_EVENTS_LIST } from "@/lib/manage-events";

export function UpcomingEventsSection() {
  const router = useRouter();
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    // Initialize current slide state when api is ready
    // Schedule state update to avoid synchronous cascading renders warning
    setTimeout(() => {
      setCurrentSlide(api.selectedScrollSnap());
    }, 0);

    // Update current slide when the user swipes
    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  const handleEventClick = (event: typeof UPCOMING_EVENTS_LIST[0]) => {
    localStorage.setItem(
      "analyticsEventData",
      JSON.stringify(event.analyticsData)
    );
    router.push("/analytics");
  };

  const handleReschedule = (event: typeof UPCOMING_EVENTS_LIST[0], e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(
      "eventFormData",
      JSON.stringify(event.formData)
    );
    router.push("/create-event?startDirectly=true&action=reschedule");
  };

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    api?.scrollPrev();
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    api?.scrollNext();
  };

  return (
    <Card
      className="mb-8 transition-shadow cursor-pointer bg-[(--upcoming-white)]"
      onClick={() => handleEventClick(UPCOMING_EVENTS_LIST[currentSlide])}
    >
      <CardHeader className="p-4 sm:p-6 pb-0 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-(--upcoming-primary-700)">
          Upcoming Events
        </CardTitle>

        {/* Slide navigation */}
        <div className="flex items-center gap-3" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-slate-300"
            onClick={goToPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            {UPCOMING_EVENTS_LIST.map((_, index) => (
              <button
                key={index}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  api?.scrollTo(index);
                }}
                className={`rounded-full transition-all duration-300 ${index === currentSlide
                  ? "w-6 h-2.5 bg-slate-800"
                  : "w-2.5 h-2.5 bg-slate-300"
                  }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-slate-300"
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pb-6!">
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{ loop: true }}
        >
          <CarouselContent className="ml-0">
            {UPCOMING_EVENTS_LIST.map((event, index) => (
              <CarouselItem key={index} className="pl-0">
                <div
                  className="flex flex-col lg:flex-row gap-6"
                  onClick={() => handleEventClick(event)}
                >
                  {/* Poster */}
                  <div className="shrink-0">
                    <Image
                      src={event.posterImage}
                      alt="Event poster"
                      width={180}
                      height={260}
                      className="rounded-lg object-cover mx-auto lg:mx-0"
                    />
                    <p className="text-center text-sm font-medium mt-3 text-[(--upcoming-gray-700)]">
                      {event.title}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 text-sm space-y-2">
                    <p className="font-semibold text-[(--upcoming-primary-800)]">
                      {event.date}
                    </p>

                    <p>
                      <b>Time:</b> {event.timeRange}
                    </p>
                    <p>
                      <b>Type:</b> {event.type}
                    </p>
                    <p>
                      <b>Venue:</b>{" "}
                      <span className="font-medium text-[(--upcoming-blue-600)]">
                        {event.venue}
                      </span>
                    </p>

                    {/* About */}
                    <div className="pt-3">
                      <p className="font-semibold mb-1 text-[(--upcoming-primary-700)]">
                        {event.aboutTitle}
                      </p>
                      <p className="text-sm leading-relaxed text-[(--upcoming-gray-600)]">
                        {event.aboutDescription}
                      </p>
                    </div>

                    {/* Highlights */}
                    <div className="pt-2">
                      <p className="font-semibold mb-1 text-[(--upcoming-primary-700)]">
                        {event.highlightsTitle}
                      </p>
                      <ul className="list-disc ml-4 text-sm text-[(--upcoming-gray-600)]">
                        <li>
                          {event.highlights[0]}
                          <br />
                          <span className="ml-0">
                            {event.highlights[1]}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="w-full lg:w-90 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-4">
                      <Stat
                        title="Event Registrations"
                        value={event.stats.registrations}
                      />
                      <Stat
                        title="Total Revenue"
                        value={event.stats.revenue}
                      />
                      <Stat title="Ad Ons" value={event.stats.addOns} />
                      <Stat
                        title="Date Change"
                        value={event.stats.dateChange}
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-nowrap items-center gap-2 sm:gap-3 mt-10 w-full justify-between sm:justify-start pb-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="rounded-full text-xs sm:text-sm px-2 sm:px-4 py-2 border-destructive text-destructive whitespace-nowrap flex-1 sm:flex-none"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
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
                            }}>Cancel Event</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button
                        variant="outline"
                        className="rounded-full text-xs sm:text-sm px-2 sm:px-4 py-2 border-foreground text-blue-soft whitespace-nowrap flex-1 sm:flex-none"
                        onClick={(e) => handleReschedule(event, e)}
                      >
                        Reschedule
                      </Button>

                      <Button
                        className="rounded-full text-xs sm:text-sm px-2 sm:px-4 py-2 bg-foreground text-background whitespace-nowrap flex-1 sm:flex-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </CardContent>
    </Card>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="border rounded-lg p-3 text-center">
      <p className="text-xs text-[(--upcoming-gray-500)]">{title}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
