"use client";

import Image from "next/image";

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
    <div className="group shrink-0 w-40 md:w-50 overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-xl">
      
      <div className="relative aspect-2/3 overflow-hidden bg-gray-100">
        <Image
          src={image || "/landing/card-placeholder.png"}
          alt={title}
          fill
          sizes="(min-width: 1024px) 200px, (min-width: 768px) 160px, 45vw"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />

        {/* Badge replacement */}
        <span className="absolute top-3 left-3 px-2 py-1 text-xs rounded-full bg-black text-white">
          {rating}
        </span>
      </div>

      <div className="p-3">
        <h3 className="mb-1 font-semibold leading-tight line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-gray-500">{language}</p>
      </div>
    </div>
  );
}
