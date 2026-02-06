"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";
import type { StrapiImage } from "@/lib/types";
import ImageLightbox from "@/components/ui/image-lightbox";

interface GalleryImageGridProps {
  images: StrapiImage[];
  title: string;
}

export default function GalleryImageGrid({ images, title }: GalleryImageGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative aspect-video rounded-lg overflow-hidden bg-muted group cursor-pointer"
            onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
          >
            <Image
              src={img.url}
              alt={img.alternativeText || `${title} - Photo ${i + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={85}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Expand className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
          </div>
        ))}
      </div>

      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
