"use client"

import { MovieCard } from "@/components/landing/movie-card"
import { MOVIES_DATA } from "@/lib/landing-data"

interface MovieSectionProps {
  title: string
  // Optional: you could also pass movies as prop instead of importing directly
  // movies?: typeof MOVIES_DATA
}

export function MovieSection({ title }: MovieSectionProps) {
  const movies = MOVIES_DATA // or use props.movies if you pass it from parent

  return (
    <section className="bg-muted/30 py-4 md:py-6">
      <div className="w-full px-4 text-left">
        <h2 className="mb-4 text-balance text-2xl font-bold md:text-3xl text-(--brand-blue-heading)">
          {title}
        </h2>
      </div>

      {movies.length === 0 ? (
        <div className="px-4 py-10 text-center text-muted-foreground">
          <p className="text-lg font-medium">No movies available right now</p>
          <p className="mt-2 text-sm">
            Check back later or explore other categories
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto pb-6 px-4 hide-scrollbar">
          <div className="flex gap-4 min-w-max px-4">
            {movies.map((movie, index) => (
              <MovieCard key={index} {...movie} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}