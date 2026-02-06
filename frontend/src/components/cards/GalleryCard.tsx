import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Images, Clock } from "lucide-react";
import type { Gallery } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface GalleryCardProps {
  gallery: Gallery;
}

export default function GalleryCard({ gallery }: GalleryCardProps) {
  const timeAgo = formatDistanceToNow(new Date(gallery.publishedDate), { addSuffix: true });
  const imageCount = gallery.images?.length || 0;

  return (
    <Link href={`/galleries/${gallery.slug}`} className="group block">
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted mb-3">
        {gallery.coverImage ? (
          <Image
            src={gallery.coverImage.url}
            alt={gallery.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <Images className="h-12 w-12 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
          <Images className="h-3 w-3" />
          <span>{imageCount > 0 ? imageCount : "Gallery"}</span>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
          {gallery.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {gallery.section && (
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30 capitalize">
              {gallery.section}
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
