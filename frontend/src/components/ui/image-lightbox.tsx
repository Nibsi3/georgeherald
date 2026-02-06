"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import type { StrapiImage } from "@/lib/types";

interface ImageLightboxProps {
  images: StrapiImage[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export default function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomed(false);
  }, [initialIndex, open]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoomed(false);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoomed(false);
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose, goNext, goPrev]);

  if (!open || images.length === 0) return null;

  const current = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[110] bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-[110] text-white/70 text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Zoom toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-[110] bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
        aria-label={zoomed ? "Zoom out" : "Zoom in"}
      >
        {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
      </button>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Image */}
      <div
        className={`relative w-full h-full flex items-center justify-center p-4 md:p-12 ${
          zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
        }`}
        onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }}
      >
        <div
          className={`relative transition-all duration-300 ${
            zoomed
              ? "w-full h-full"
              : "max-w-[90vw] max-h-[85vh] w-full h-full"
          }`}
        >
          <Image
            src={current.url}
            alt={current.alternativeText || `Image ${currentIndex + 1}`}
            fill
            className={`transition-all duration-300 ${
              zoomed ? "object-contain" : "object-contain"
            }`}
            sizes="100vw"
            quality={95}
            priority
          />
        </div>
      </div>

      {/* Caption */}
      {current.alternativeText && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[110] bg-black/60 text-white text-sm px-4 py-2 rounded-full max-w-lg text-center truncate">
          {current.alternativeText}
        </div>
      )}
    </div>
  );
}
