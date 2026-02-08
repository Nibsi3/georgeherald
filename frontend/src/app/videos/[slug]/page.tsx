import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play, ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVideoBySlug, getVideosBySection, videos } from "@/lib/scraped-data";
import VideoCard from "@/components/cards/VideoCard";
import SectionHeader from "@/components/sections/SectionHeader";
import type { Metadata } from "next";

const VIDEO_CATEGORIES: Record<string, { title: string; section: string }> = {
  news: { title: "News Videos", section: "news" },
  sport: { title: "Sport Videos", section: "sport" },
  business: { title: "Business Videos", section: "business" },
  entertainment: { title: "Entertainment Videos", section: "entertainment" },
  lifestyle: { title: "Lifestyle Videos", section: "lifestyle" },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = VIDEO_CATEGORIES[slug];
  if (cat) return { title: cat.title, description: `Watch ${cat.title.toLowerCase()} from George Herald.` };
  const video = getVideoBySlug(slug);
  if (!video) return { title: "Video Not Found" };
  return {
    title: video.title,
    description: video.description || `Watch: ${video.title}`,
    openGraph: {
      title: video.title,
      images: video.thumbnail ? [{ url: video.thumbnail.url }] : [],
    },
  };
}

export default async function VideoSlugPage({ params }: PageProps) {
  const { slug } = await params;

  // Check if this is a category page
  const cat = VIDEO_CATEGORIES[slug];
  if (cat) {
    const categoryVideos = getVideosBySection(cat.section, 40);
    return (
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/videos" className="hover:text-primary transition-colors">Videos</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{cat.title}</span>
        </div>
        <SectionHeader title={cat.title} />
        {categoryVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {categoryVideos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-12 text-center">No videos found in this category.</p>
        )}
      </div>
    );
  }

  // Otherwise, render individual video detail
  const video = getVideoBySlug(slug);
  if (!video) notFound();

  const relatedVideos = getVideosBySection(video.section, 5).filter(
    (v) => v.slug !== slug
  );

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/videos" className="hover:text-primary transition-colors">Videos</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[300px]">{video.title}</span>
      </div>

      <div className="max-w-4xl">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-primary border-primary/30">
            <Play className="h-3 w-3 mr-1" />
            Video
          </Badge>
          {video.section && (
            <Badge variant="secondary" className="text-xs capitalize">
              {video.section}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl lg:text-4xl font-black leading-tight mb-4">
          {video.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          {video.duration && <span>{video.duration}</span>}
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{video.viewCount.toLocaleString()} views</span>
          </div>
        </div>

        {/* Video Player */}
        {video.videoUrl ? (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-6">
            {video.videoUrl.includes("youtube") || video.videoUrl.includes("vimeo") || video.videoUrl.includes("facebook") ? (
              <iframe
                src={video.videoUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={video.title}
              />
            ) : (
              <video
                controls
                className="absolute inset-0 w-full h-full"
                poster={video.thumbnail?.url}
              >
                <source src={video.videoUrl} />
              </video>
            )}
          </div>
        ) : video.thumbnail ? (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-6">
            <Image
              src={video.thumbnail.url}
              alt={video.title}
              fill
              className="object-cover"
              priority
              quality={90}
              sizes="(max-width: 768px) 100vw, 80vw"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="bg-white/90 rounded-full p-4">
                <Play className="h-10 w-10 text-primary" />
              </div>
            </div>
          </div>
        ) : null}

        {/* Description */}
        {video.description && (
          <div className="prose-george max-w-none mb-6">
            {video.description.split("\n\n").map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-foreground/90 mb-4">
                {p}
              </p>
            ))}
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {/* Related Videos */}
      {relatedVideos.length > 0 && (
        <section>
          <SectionHeader title="More Videos" href="/videos" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedVideos.slice(0, 4).map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8">
        <Link href="/videos">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Videos
          </Button>
        </Link>
      </div>
    </div>
  );
}
