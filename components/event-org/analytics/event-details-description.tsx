"use client"

import * as React from "react"
import { Calendar, MapPin, Users, Tag } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function EventDetailsDescription() {

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardContent className="px-6 py-6 md:px-10 md:py-10 flex flex-col md:flex-row gap-10">
          <div className="w-full md:w-1/3 flex flex-col gap-8">
            <h2 className="text-2xl font-bold text-blue-soft">Event Details</h2>

            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="mt-1">
                  <Calendar className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-lg text-foreground">
                    Date & Time
                  </h3>
                  <p className="text-muted-foreground">
                    March 22, 2025; 7:00 PM onwards
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <MapPin className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-lg text-foreground">
                    Location
                  </h3>
                  <p className="text-muted-foreground">
                    VMRDA Grounds, Visakhapatnam
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-lg text-foreground">
                    Organized By
                  </h3>
                  <p className="text-muted-foreground">Moonlight Events</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <Tag className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-lg text-foreground">
                    Category
                  </h3>
                  <p className="text-muted-foreground">Music Concert</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3 flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-blue-soft">Description</h2>

            <div className="flex flex-col gap-4 text-muted-foreground leading-relaxed">
              <p>
                A sensational live performance by Maritza Correa, bringing Latin
                pop and soul to the heart of Vizag. Enjoy an electrifying
                evening filled with vibrant music, food stalls, light shows, and
                crowd interaction. This open-air concert is a must-attend for
                music lovers and cultural enthusiasts.
              </p>
              <p>
                Entry starts at 6:00 PM.
                <br />
                All age groups welcome.
                <br />
                Food & beverage stalls available.
                <br />
                Security and medical assistance will be on-site.
              </p>
            </div>

            <div className="pt-4">
              <Button
                variant="outline"
                className="bg-(--white) text-(--upcoming-blue-600) rounded-full px-4 py-1 font-poppins font-medium text-sm md:text-base transition-colors"
              >
                Read More 
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
