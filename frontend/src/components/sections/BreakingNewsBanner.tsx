"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { Article } from "@/lib/types";

interface BreakingNewsBannerProps {
  articles: Article[];
}

export default function BreakingNewsBanner({ articles }: BreakingNewsBannerProps) {
  if (articles.length === 0) return null;

  return (
    <div className="bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 h-10 overflow-hidden">
          <div className="flex items-center gap-1.5 shrink-0">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Breaking</span>
          </div>
          <div className="h-4 w-px bg-white/30" />
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap">
              {articles.map((article, i) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="inline-block text-sm hover:underline"
                >
                  {article.title}
                  {i < articles.length - 1 && (
                    <span className="mx-6 text-white/40">|</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
