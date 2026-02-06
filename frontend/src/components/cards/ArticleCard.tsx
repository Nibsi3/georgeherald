import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye } from "lucide-react";
import type { Article } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "horizontal" | "compact";
}

export default function ArticleCard({ article, variant = "default" }: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedDate), { addSuffix: true });

  if (variant === "compact") {
    return (
      <Link href={`/news/${article.slug}`} className="group flex items-start gap-3 py-3">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage.url}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link href={`/news/${article.slug}`} className="group flex gap-4">
        <div className="relative w-32 sm:w-40 aspect-[4/3] rounded-lg overflow-hidden bg-muted shrink-0">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage.url}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          {article.isBreaking && (
            <Badge className="absolute top-2 left-2 bg-primary text-white border-none text-[10px] px-1.5 py-0.5">
              BREAKING
            </Badge>
          )}
        </div>
        <div className="flex-1 min-w-0 py-1">
          <Badge variant="outline" className="text-[10px] mb-1.5 text-primary border-primary/30">
            {article.category?.name || article.section}
          </Badge>
          <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
            {article.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.viewCount.toLocaleString()}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/news/${article.slug}`} className="group block">
      <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-muted mb-3">
        {article.featuredImage ? (
          <Image
            src={article.featuredImage.url}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        {article.isBreaking && (
          <Badge className="absolute top-3 left-3 bg-primary text-white border-none text-xs">
            BREAKING
          </Badge>
        )}
      </div>
      <div>
        <Badge variant="outline" className="text-[10px] mb-2 text-primary border-primary/30">
          {article.category?.name || article.section}
        </Badge>
        <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {article.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {article.author && (
            <span className="font-medium">{article.author.name}</span>
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
