import GalleryCard from "@/components/cards/GalleryCard";
import SectionHeader from "@/components/sections/SectionHeader";
import { galleries } from "@/lib/scraped-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photo Galleries",
  description: "Browse photo galleries from George and the Garden Route - news, sport, schools, events and more.",
};

export default function GalleriesPage() {
  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <a href="/" className="hover:text-primary transition-colors">Home</a>
        <span>/</span>
        <span className="text-foreground font-medium">Galleries</span>
      </div>

      <SectionHeader title="Photo Galleries" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {galleries.map((gallery) => (
          <GalleryCard key={gallery.id} gallery={gallery} />
        ))}
      </div>
    </div>
  );
}
