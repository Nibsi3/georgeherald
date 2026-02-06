"use client";

import { useState, useMemo } from "react";
import ArticleCard from "@/components/cards/ArticleCard";
import type { Article } from "@/lib/types";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

const ITEMS_PER_PAGE = 20;

type SortOption = "newest" | "oldest" | "most-read" | "a-z";

interface ArticleListPaginatedProps {
  articles: Article[];
  itemsPerPage?: number;
}

export default function ArticleListPaginated({
  articles,
  itemsPerPage = ITEMS_PER_PAGE,
}: ArticleListPaginatedProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const sortedArticles = useMemo(() => {
    const sorted = [...articles];
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
      case "oldest":
        return sorted.sort((a, b) => new Date(a.publishedDate).getTime() - new Date(b.publishedDate).getTime());
      case "most-read":
        return sorted.sort((a, b) => b.viewCount - a.viewCount);
      case "a-z":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  }, [articles, sortBy]);

  const totalPages = Math.ceil(sortedArticles.length / itemsPerPage);
  const pageArticles = useMemo(
    () => sortedArticles.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [sortedArticles, page, itemsPerPage]
  );

  // Generate page numbers to show
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  function goTo(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (articles.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center">
        No articles found.
      </p>
    );
  }

  return (
    <div>
      {/* Article count & sort controls */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * itemsPerPage + 1}–{Math.min(page * itemsPerPage, sortedArticles.length)} of{" "}
          <span className="font-semibold text-foreground">{sortedArticles.length.toLocaleString()}</span> articles
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortOption); setPage(1); }}
            className="text-sm border border-border rounded-lg px-2.5 py-1.5 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most-read">Most Read</option>
            <option value="a-z">A – Z</option>
          </select>
        </div>
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {pageArticles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1 mt-8 pt-6 border-t border-border">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-2 py-2 text-sm text-muted-foreground">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goTo(p)}
                className={`min-w-[36px] h-9 px-2 text-sm font-medium rounded-lg transition-colors ${
                  p === page
                    ? "bg-primary text-white"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
