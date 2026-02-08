"use client";

import { useEffect, useMemo, useState } from "react";
import type { Article } from "@/lib/types";
import ArticleCardHero from "@/components/cards/ArticleCardHero";
import Link from "next/link";
import Image from "next/image";

function SmallTopStoryCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex items-center gap-2.5 p-2 rounded-xl border border-border bg-white hover:border-primary/30 hover:shadow-sm transition-all"
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
        {article.featuredImage ? (
          <Image
            src={article.featuredImage.url}
            alt={article.title}
            fill
            className="object-cover"
            quality={90}
            sizes="48px"
          />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </p>
      </div>
    </Link>
  );
}

export default function TopStoriesRotator({ topStories }: { topStories: Article[] }) {
  const stories = useMemo(() => topStories.slice(0, 6), [topStories]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [crossfadeTo, setCrossfadeTo] = useState<number | null>(null);

  useEffect(() => {
    if (stories.length <= 1) return;
    const id = window.setInterval(() => {
      const next = (heroIndex + 1) % stories.length;
      setCrossfadeTo(next);
      window.setTimeout(() => {
        setHeroIndex(next);
        setCrossfadeTo(null);
      }, 350);
    }, 10000);
    return () => window.clearInterval(id);
  }, [stories.length, heroIndex]);

  const heroArticle = stories[heroIndex];
  const nextHeroArticle = crossfadeTo !== null ? stories[crossfadeTo] : null;

  return (
    <>
      <div className="relative">
        <div className={`transition-opacity duration-350 ${crossfadeTo !== null ? "opacity-0" : "opacity-100"}`}>
          {heroArticle && <ArticleCardHero article={heroArticle} />}
        </div>
        {nextHeroArticle && (
          <div className="absolute inset-0 transition-opacity duration-350 opacity-100">
            <ArticleCardHero article={nextHeroArticle} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-4">
        {stories.map((article) => (
          <SmallTopStoryCard key={article.id} article={article} />
        ))}
      </div>
    </>
  );
}
