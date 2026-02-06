import VideoCard from "@/components/cards/VideoCard";
import SectionHeader from "@/components/sections/SectionHeader";
import { getVideosBySection, videos } from "@/lib/scraped-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Videos",
  description: "Watch the latest videos from George Herald - news, sport, business, entertainment and lifestyle.",
};

export default function VideosPage() {
  const allVideos = videos.slice(0, 40);

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <a href="/" className="hover:text-primary transition-colors">Home</a>
        <span>/</span>
        <span className="text-foreground font-medium">Videos</span>
      </div>

      <SectionHeader title="Latest Videos" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {allVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
