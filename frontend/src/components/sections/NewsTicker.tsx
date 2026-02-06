"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";

interface NewsTickerProps {
  articles: Article[];
}

export default function NewsTicker({ articles }: NewsTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationId: number;

    function tick() {
      if (!el) return;
      if (!isPausedRef.current) {
        scrollPosRef.current += 0.8;
        if (scrollPosRef.current >= el.scrollWidth / 2) {
          scrollPosRef.current = 0;
        }
        el.scrollLeft = scrollPosRef.current;
      }
      animationId = requestAnimationFrame(tick);
    }

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, []);

  if (!articles || articles.length === 0) return null;

  // Duplicate the list for seamless loop
  const items = [...articles, ...articles];

  return (
    <div className="bg-white border-b border-border relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-10">
          {/* Label */}
          <div className="flex-shrink-0 flex items-center gap-2 pr-4 border-r border-border mr-4 z-10 bg-white">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Latest</span>
          </div>

          {/* Scrolling content */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-hidden whitespace-nowrap"
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; }}
          >
            <div className="inline-flex items-center gap-0">
              {items.map((article, i) => (
                <Link
                  key={`${article.id}-${i}`}
                  href={`/news/${article.slug}`}
                  className="inline-flex items-center gap-2 px-4 hover:text-primary transition-colors group"
                >
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors whitespace-nowrap">
                    {article.category?.name || article.section}
                  </span>
                  <span className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors whitespace-nowrap">
                    {article.title}
                  </span>
                  <span className="text-muted-foreground/30 mx-2">|</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
