import Link from "next/link";
import SectionHeader from "@/components/sections/SectionHeader";
import MostReadSidebar from "@/components/sections/MostReadSidebar";
import ArticleListPaginated from "@/components/ui/article-list-paginated";
import { getMostReadArticles, getArticlesByCategory, getArticlesBySection } from "@/lib/scraped-data";
import { Mountain } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tourism",
  description: "Tourism news, attractions and travel guides for George and the Garden Route.",
};

export default function TourismPage() {
  const mostRead = getMostReadArticles(10);
  const articles = [
    ...getArticlesBySection("tourism", 5000),
    ...getArticlesByCategory("tourism", 5000),
    ...getArticlesByCategory("environment", 5000),
  ];
  const seen = new Set<number>();
  const unique = articles.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <a href="/" className="hover:text-primary transition-colors">Home</a>
        <span>/</span>
        <span className="text-foreground font-medium">Tourism</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SectionHeader title="Tourism & Travel" />
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Mountain className="h-6 w-6 text-green-700" />
              <h2 className="text-lg font-bold text-green-900">Explore the Garden Route</h2>
            </div>
            <p className="text-sm text-green-800/70 mb-4">
              Discover the natural beauty, attractions and experiences that make George and the Garden Route a world-class destination.
            </p>
            <Link
              href="https://www.georgeherald.com/Community/Heritage"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-green-700 hover:underline"
            >
              Learn more about George&apos;s heritage →
            </Link>
          </div>

          <ArticleListPaginated articles={unique} />
        </div>
        <aside className="lg:col-span-1">
          <MostReadSidebar articles={mostRead} />
        </aside>
      </div>
    </div>
  );
}
