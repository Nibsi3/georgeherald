import SectionHeader from "@/components/sections/SectionHeader";
import MostReadSidebar from "@/components/sections/MostReadSidebar";
import ArticleListPaginated from "@/components/ui/article-list-paginated";
import { getSportArticles, getMostReadArticles } from "@/lib/scraped-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sport",
  description: "Latest sport news from the Garden Route - rugby, cricket, football, golf, tennis, athletics and more.",
};

export default function SportPage() {
  const sportArticles = getSportArticles(undefined, 5000);
  const mostRead = getMostReadArticles(10);

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <a href="/" className="hover:text-primary transition-colors">Home</a>
        <span>/</span>
        <span className="text-foreground font-medium">Sport</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SectionHeader title="Sport" />
          <ArticleListPaginated articles={sportArticles} />
        </div>

        <aside className="lg:col-span-1">
          <MostReadSidebar articles={mostRead} />
        </aside>
      </div>
    </div>
  );
}
