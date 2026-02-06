import Link from "next/link";
import SectionHeader from "@/components/sections/SectionHeader";
import MostReadSidebar from "@/components/sections/MostReadSidebar";
import ArticleListPaginated from "@/components/ui/article-list-paginated";
import { getMostReadArticles, getArticlesByCategory, getArticlesBySection } from "@/lib/scraped-data";
import { FileText, Calendar, Mountain } from "lucide-react";
import type { Metadata } from "next";

const SUBCATEGORIES: Record<string, { title: string; description: string; icon: string }> = {
  "municipal-notices": {
    title: "Municipal Notices",
    description: "Official notices and public information from George Municipality.",
    icon: "file",
  },
  "whats-on": {
    title: "What's On",
    description: "Events, markets, shows and activities in George and the Garden Route.",
    icon: "calendar",
  },
  "about-george": {
    title: "About George",
    description: "History, heritage and information about George and the Garden Route.",
    icon: "mountain",
  },
};

interface PageProps {
  params: Promise<{ subcategory: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subcategory } = await params;
  const meta = SUBCATEGORIES[subcategory];
  return {
    title: meta?.title || "Community",
    description: meta?.description || "Community news from George Herald.",
  };
}

export function generateStaticParams() {
  return Object.keys(SUBCATEGORIES).map((subcategory) => ({ subcategory }));
}

export default async function CommunitySubcategoryPage({ params }: PageProps) {
  const { subcategory } = await params;
  const meta = SUBCATEGORIES[subcategory] || { title: subcategory, description: "", icon: "file" };

  // Get articles relevant to each subcategory
  let articles;
  if (subcategory === "municipal-notices") {
    articles = [
      ...getArticlesBySection("community", 100),
      ...getArticlesByCategory("we-care", 100),
      ...getArticlesByCategory("heritage", 100),
      ...getArticlesByCategory("general", 50),
    ];
  } else if (subcategory === "whats-on") {
    articles = [
      ...getArticlesBySection("entertainment", 100),
      ...getArticlesByCategory("lifestyle", 100),
    ];
  } else {
    // about-george - local news about George
    articles = [
      ...getArticlesByCategory("local", 100),
      ...getArticlesByCategory("heritage", 100),
      ...getArticlesByCategory("tourism", 100),
      ...getArticlesByCategory("environment", 100),
    ];
  }
  const seen = new Set<number>();
  const unique = articles.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  const mostRead = getMostReadArticles(10);

  const IconComponent = meta.icon === "calendar" ? Calendar : meta.icon === "mountain" ? Mountain : FileText;

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/community" className="hover:text-primary transition-colors">Community</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{meta.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <IconComponent className="h-6 w-6 text-primary" />
            <SectionHeader title={meta.title} />
          </div>
          {meta.description && (
            <p className="text-muted-foreground mb-6">{meta.description}</p>
          )}

          <ArticleListPaginated articles={unique} />
        </div>
        <aside className="lg:col-span-1">
          <MostReadSidebar articles={mostRead} />
        </aside>
      </div>
    </div>
  );
}
