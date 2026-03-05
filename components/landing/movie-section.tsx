"use client"

import { MovieCard } from "@/components/landing/movie-card"
import { MOVIES_DATA } from "@/lib/landing-data"

interface MovieSectionProps {
  title: string
}

export function MovieSection({ title }: MovieSectionProps) {
  return (
    <section className="bg-muted/30 py-4 md:py-6">
      <div className="w-full px-4 text-left">
        <h2 className="mb-4 text-balance text-2xl font-bold md:text-3xl text-(--brand-blue-heading)">{title}</h2>
      </div>

      <div className="w-full overflow-x-auto pb-6 px-4 hide-scrollbar">
        <div className="flex gap-4 min-w-max px-4">
          {MOVIES_DATA.map((movie, index) => (
            <MovieCard key={index} {...movie} />
          ))}
        </div>
      </div>
    </section>
  )
}
