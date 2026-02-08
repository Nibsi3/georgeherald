"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { Article } from "@/lib/types";
import ArticleCardHero from "@/components/cards/ArticleCardHero";
import ArticleCard from "@/components/cards/ArticleCard";

export default function TopStoriesRotator({ topStories }: { topStories: Article[] }) {
  const stories = useMemo(() => topStories.slice(0, 6), [topStories]);
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % stories.length);
  }, [stories.length]);

  useEffect(() => {
    if (stories.length <= 1) return;
    const id = window.setInterval(goNext, 10000);
    return () => window.clearInterval(id);
  }, [stories.length, goNext]);

  return (
    <div className="flex flex-col flex-1">
      {/* Hero — all cards rendered, only active one visible via opacity */}
      <div className="relative">
        {stories.map((article, i) => (
          <div
            key={article.id}
            className={`transition-opacity duration-700 ease-in-out ${
              i === activeIndex ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 z-0"
            }`}
            aria-hidden={i !== activeIndex}
          >
            <ArticleCardHero article={article} />
          </div>
        ))}
      </div>

      {/* 6 sub-story cards — flex-1 stretches to align with sidebar bottom */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 mt-4 bg-white rounded-xl border border-border p-5 content-start">
        {stories.map((article, i) => (
          <div key={article.id} className={i < stories.length - 2 ? "border-b border-border/40 pb-3 mb-3 sm:pb-3 sm:mb-3" : i < stories.length - 1 ? "border-b border-border/40 pb-3 mb-3 sm:border-b-0 sm:pb-0 sm:mb-0" : ""}>
            <ArticleCard article={article} variant="horizontal" />
          </div>
        ))}
      </div>
    </div>
  );
}
