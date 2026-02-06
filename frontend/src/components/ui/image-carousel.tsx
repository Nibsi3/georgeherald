"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { StrapiImage } from "@/lib/types";
import ImageLightbox from "./image-lightbox";

interface ImageCarouselProps {
  images: StrapiImage[];
  title?: string;
  autoPlayInterval?: number;
}

export default function ImageCarousel({
  images,
  title = "Photos",
  autoPlayInterval = 3000,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const totalImages = images.length;
  if (totalImages === 0) return null;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  }, [totalImages]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }, [totalImages]);

  useEffect(() => {
    if (isHovered || lightboxOpen || totalImages <= 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(goToNext, autoPlayInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, lightboxOpen, goToNext, autoPlayInterval, totalImages]);

  return (
    <>
      <div
        className="relative group rounded-xl overflow-hidden bg-muted"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Track */}
        <div className="relative aspect-video overflow-hidden">
          <div
            ref={trackRef}
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {images.map((img, i) => (
              <div
                key={i}
                className="relative w-full h-full shrink-0 cursor-pointer"
                onClick={() => { setLightboxOpen(true); }}
              >
                <Image
                  src={img.url}
                  alt={img.alternativeText || `${title} - Photo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 66vw"
                  quality={85}
                  priority={i === 0}
                />
              </div>
            ))}
          </div>

          {/* Gradient overlays for nav buttons */}
          {totalImages > 1 && (
            <>
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}

          {/* Navigation Arrows */}
          {totalImages > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            </>
          )}

          {/* Expand button */}
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-10 opacity-0 group-hover:opacity-100 transition-all"
            aria-label="View full size"
          >
            <Expand className="h-4 w-4" />
          </button>

          {/* Counter badge */}
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full z-10">
            {currentIndex + 1} / {totalImages}
          </div>

          {/* Pause indicator */}
          {isHovered && totalImages > 1 && (
            <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full z-10">
              PAUSED
            </div>
          )}
        </div>

        {/* Dot indicators */}
        {totalImages > 1 && totalImages <= 20 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i === currentIndex
                    ? "bg-white w-4"
                    : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Caption */}
        {images[currentIndex]?.alternativeText && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-8 pb-8 px-4 z-10">
            <p className="text-white text-xs leading-relaxed">
              {images[currentIndex].alternativeText}
            </p>
          </div>
        )}
      </div>

      {/* Full-screen lightbox */}
      <ImageLightbox
        images={images}
        initialIndex={currentIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
