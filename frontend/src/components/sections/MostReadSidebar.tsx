import Link from "next/link";
import { TrendingUp } from "lucide-react";
import type { Article } from "@/lib/types";

interface MostReadSidebarProps {
  articles: Article[];
}

export default function MostReadSidebar({ articles }: MostReadSidebarProps) {
  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-black text-lg">Most Read</h3>
      </div>
      <div className="space-y-0">
        {articles.slice(0, 10).map((article, index) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="group flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
          >
            <span className="text-2xl font-black text-primary/20 group-hover:text-primary transition-colors leading-none mt-0.5 min-w-[28px]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {article.title}
              </h4>
              <span className="text-xs text-muted-foreground mt-1 block">
                {article.viewCount.toLocaleString()} views
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
