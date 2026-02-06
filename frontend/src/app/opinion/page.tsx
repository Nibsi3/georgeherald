import SectionHeader from "@/components/sections/SectionHeader";
import MostReadSidebar from "@/components/sections/MostReadSidebar";
import ArticleListPaginated from "@/components/ui/article-list-paginated";
import { getArticlesByCategory, getArticlesBySection, getMostReadArticles } from "@/lib/scraped-data";
import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opinion",
  description: "Opinion pieces, editorials and columns from George Herald.",
};

export default function OpinionPage() {
  const articles = [
    ...getArticlesBySection("opinion", 5000),
    ...getArticlesByCategory("comment", 5000),
    ...getArticlesByCategory("blogs", 5000),
    ...getArticlesByCategory("politics", 5000),
  ];
  const seen = new Set<number>();
  const unique = articles.filter((a) => {
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
        <span className="text-foreground font-medium">Opinion</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-6 w-6 text-primary" />
            <SectionHeader title="Opinion & Editorial" />
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
