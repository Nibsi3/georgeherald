import SectionHeader from "@/components/sections/SectionHeader";
import MostReadSidebar from "@/components/sections/MostReadSidebar";
import ArticleListPaginated from "@/components/ui/article-list-paginated";
import { getArticlesBySection, getArticlesByCategory, getMostReadArticles } from "@/lib/scraped-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lifestyle",
  description: "Lifestyle, health, wellness and entertainment news from George and the Garden Route.",
};

export default function LifestylePage() {
  const lifestyleArticles = [
    ...getArticlesBySection("lifestyle", 5000),
    ...getArticlesByCategory("lifestyle", 5000),
    ...getArticlesByCategory("property", 5000),
    ...getArticlesByCategory("motoring", 5000),
  ];
  const seen = new Set<number>();
  const unique = lifestyleArticles.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
  const mostRead = getMostReadArticles(10);

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <a href="/" className="hover:text-primary transition-colors">Home</a>
        <span>/</span>
        <span className="text-foreground font-medium">Lifestyle</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SectionHeader title="Life & Arts" />
          <ArticleListPaginated articles={unique} />
        </div>

        <aside className="lg:col-span-1">
          <MostReadSidebar articles={mostRead} />
        </aside>
      </div>
    </div>
  );
}
