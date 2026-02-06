import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGalleryBySlug, getGalleriesBySection, galleries } from "@/lib/scraped-data";
import GalleryCard from "@/components/cards/GalleryCard";
import SectionHeader from "@/components/sections/SectionHeader";
import GalleryImageGrid from "./gallery-image-grid";
import type { Metadata } from "next";

const GALLERY_CATEGORIES: Record<string, { title: string; section: string }> = {
  general: { title: "General Galleries", section: "general" },
  news: { title: "News Galleries", section: "news" },
  schools: { title: "Schools Galleries", section: "schools" },
  "special-events": { title: "Special Events", section: "special-events" },
  sport: { title: "Sport Galleries", section: "sport" },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = GALLERY_CATEGORIES[slug];
  if (cat) return { title: cat.title, description: `Browse ${cat.title.toLowerCase()} from George Herald.` };
  const gallery = getGalleryBySlug(slug);
  if (!gallery) return { title: "Gallery Not Found" };
  return {
    title: gallery.title,
    description: gallery.description || `Photo gallery: ${gallery.title}`,
    openGraph: {
      title: gallery.title,
      images: gallery.coverImage ? [{ url: gallery.coverImage.url }] : [],
    },
  };
}

export function generateStaticParams() {
  const gallerySlugs = galleries.map((g) => ({ slug: g.slug }));
  const categorySlugs = Object.keys(GALLERY_CATEGORIES).map((s) => ({ slug: s }));
  return [...categorySlugs, ...gallerySlugs];
}

export default async function GallerySlugPage({ params }: PageProps) {
  const { slug } = await params;

  // Check if this is a category page
  const cat = GALLERY_CATEGORIES[slug];
  if (cat) {
    const categoryGalleries = getGalleriesBySection(cat.section, 40);
    return (
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/galleries" className="hover:text-primary transition-colors">Galleries</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{cat.title}</span>
        </div>
        <SectionHeader title={cat.title} />
        {categoryGalleries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {categoryGalleries.map((g) => (
              <GalleryCard key={g.id} gallery={g} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-12 text-center">No galleries found in this category.</p>
        )}
      </div>
    );
  }

  // Otherwise, render individual gallery detail
  const gallery = getGalleryBySlug(slug);
  if (!gallery) notFound();

  const imageCount = gallery.images?.length || 0;

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/galleries" className="hover:text-primary transition-colors">Galleries</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[300px]">{gallery.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-primary border-primary/30">
            <Camera className="h-3 w-3 mr-1" />
            Photo Gallery
          </Badge>
          {gallery.section && (
            <Badge variant="secondary" className="text-xs capitalize">
              {gallery.section}
            </Badge>
          )}
        </div>

        <h1 className="text-3xl lg:text-4xl font-black leading-tight mb-3">
          {gallery.title}
        </h1>

        {gallery.description && (
          <p className="text-muted-foreground max-w-2xl">{gallery.description}</p>
        )}

        <p className="text-sm text-muted-foreground mt-2">
          {imageCount} photo{imageCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Cover Image */}
      {gallery.coverImage && (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-8 max-w-4xl">
          <Image
            src={gallery.coverImage.url}
            alt={gallery.coverImage.alternativeText || gallery.title}
            fill
            className="object-cover"
            priority
            quality={85}
            sizes="(max-width: 768px) 100vw, 80vw"
          />
        </div>
      )}

      {/* Image Grid with lightbox */}
      {gallery.images && gallery.images.length > 0 && (
        <GalleryImageGrid images={gallery.images} title={gallery.title} />
      )}

      {imageCount === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No photos available for this gallery.</p>
        </div>
      )}

      <Separator className="my-8" />

      <Link href="/galleries">
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Galleries
        </Button>
      </Link>
    </div>
  );
}
