"use client";

interface MovieCardProps {
  title: string;
  rating: string;
  language: string;
  image: string;
}

export function MovieCard({
  title,
  rating,
  language,
  image,
}: MovieCardProps) {
  return (
    <div className="movie-card group shrink-0 w-[160px] md:w-[200px] overflow-hidden rounded-xl transition-all">

      <div className="movie-image-wrapper relative aspect-2/3 overflow-hidden">
        <img
          src={image || "/landing/card-placeholder.png"}
          alt={title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />

        <span className="movie-badge absolute top-3 left-3 px-2 py-1 text-xs rounded-full">
          {rating}
        </span>
      </div>

      <div className="p-3">
        <h3 className="mb-1 font-semibold leading-tight line-clamp-2">
          {title}
        </h3>
        <p className="movie-language text-xs">
          {language}
        </p>
      </div>
    </div>
  );
}