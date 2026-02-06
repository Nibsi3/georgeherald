import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/sections/SectionHeader";
import ArticleListPaginated from "@/components/ui/article-list-paginated";
import { searchArticles } from "@/lib/scraped-data";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : "Search Articles",
    description: "Search all George Herald articles",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const results = query.length >= 2 ? searchArticles(query, 5000) : [];

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <a href="/" className="hover:text-primary transition-colors">Home</a>
        <span>/</span>
        <span className="text-foreground font-medium">Search</span>
      </div>

      <SectionHeader title="Search Articles" />

      <form action="/search" method="GET" className="flex gap-3 max-w-xl mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            name="q"
            placeholder="Search 10,000+ articles..."
            defaultValue={query}
            className="pl-10"
            autoFocus
          />
        </div>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          Search
        </Button>
      </form>

      {query.length >= 2 && (
        <div>
          <p className="text-sm text-muted-foreground mb-6">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
          {results.length > 0 ? (
            <ArticleListPaginated articles={results} />
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">
                No articles found matching your search.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try different keywords or browse our categories.
              </p>
            </div>
          )}
        </div>
      )}

      {!query && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            Enter a search term to find articles
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Search across 10,000+ articles from 2024-2026
          </p>
        </div>
      )}
    </div>
  );
}
