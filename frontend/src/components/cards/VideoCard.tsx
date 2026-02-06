import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Play, Clock } from "lucide-react";
import type { Video } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  const timeAgo = formatDistanceToNow(new Date(video.publishedDate), { addSuffix: true });

  return (
    <Link href={`/videos/${video.slug}`} className="group block">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-3">
        {video.thumbnail ? (
          <Image
            src={video.thumbnail.url}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-herald-black/60 to-herald-black/90" />
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
          </div>
        </div>
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">
            {video.duration}
          </div>
        )}
      </div>
      <div>
        <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
          {video.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {video.section && (
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
              {video.section}
            </Badge>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
        </div>
      </div>
    </Link>
  );
}
