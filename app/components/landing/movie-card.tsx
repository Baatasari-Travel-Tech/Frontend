"use client";

import Image from "next/image";

interface MovieCardProps {
  title: string;
  rating: string;
  language: string;
  image: string;
}

export function MovieCard({ title, rating, language, image }: MovieCardProps) {
  return (
    <div className="group w-44 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg md:w-52">
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-100">
        <Image
          src={image || "/landing/card-placeholder.png"}
          alt={title}
          fill
          sizes="(min-width: 1024px) 220px, (min-width: 768px) 180px, 45vw"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white">
          {rating}
        </span>
      </div>

      <div className="p-3">
        <h3 className="mb-1 text-sm font-semibold text-slate-900 line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-slate-500">{language}</p>
      </div>
    </div>
  );
}
