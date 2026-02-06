import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, TrendingUp } from "lucide-react";
import type { Article } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface ArticleCardHeroProps {
  article: Article;
}

export default function ArticleCardHero({ article }: ArticleCardHeroProps) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedDate), { addSuffix: true });

  return (
    <Link href={`/news/${article.slug}`} className="group block relative">
      <div className="relative aspect-[16/9] lg:aspect-[16/10] rounded-xl overflow-hidden bg-muted">
        {article.featuredImage ? (
          <Image
            src={article.featuredImage.url}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
            quality={90}
            sizes="(max-width: 768px) 100vw, 66vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-herald-red/20 to-herald-black/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-3">
            {article.isBreaking && (
              <Badge className="bg-primary text-white border-none animate-pulse text-xs font-bold">
                BREAKING
              </Badge>
            )}
            <Badge variant="secondary" className="bg-white/20 text-white border-none backdrop-blur-sm text-xs">
              {article.category?.name || article.section}
            </Badge>
          </div>

          <h2 className="text-2xl lg:text-4xl font-black text-white leading-tight mb-3 group-hover:text-primary transition-colors">
            {article.title}
          </h2>

          <p className="text-white/80 text-sm lg:text-base line-clamp-2 mb-4 max-w-2xl">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-4 text-xs text-white/60">
            {article.author && (
              <span className="font-medium text-white/80">{article.author.name}</span>
            )}
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
      </div>
    </Link>
  );
}
