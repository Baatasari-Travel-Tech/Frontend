'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'

/**
 * Watercolor illustration slot. Renders the image at its intrinsic aspect
 * ratio (w-full h-auto) so the artwork is never cropped, whatever the file's
 * proportions. `width`/`height` are pre-load size hints to avoid layout shift.
 * Until the file exists in /public/for-organizers/, a soft cream placeholder
 * renders instead of a broken image.
 */
export function Illustration({
  src,
  alt,
  width,
  height,
  className = '',
}: {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 overflow-hidden bg-linear-to-br from-[#faf6ec] via-[#f5ead3] to-[#efe0c0] p-6 text-center ${className}`}
      >
        <ImageIcon className="h-8 w-8 text-(--gold-icon)" aria-hidden />
        <p className="text-xs font-medium text-(--gold-text)">{alt}</p>
        <p className="text-[10px] text-(--gold-icon)">
          Add <code className="font-mono">{src}</code> to /public
        </p>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-auto w-full"
        sizes="(max-width: 768px) 100vw, 50vw"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
