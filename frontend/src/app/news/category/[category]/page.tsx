import SectionHeader from "@/components/sections/SectionHeader";
import MostReadSidebar from "@/components/sections/MostReadSidebar";
import ArticleListPaginated from "@/components/ui/article-list-paginated";
import { getArticlesByCategory, getArticlesBySection, getMostReadArticles, getTopStories } from "@/lib/scraped-data";
import type { Metadata } from "next";

const categoryMeta: Record<string, { title: string; description: string; section?: string }> = {
  "top-stories": { title: "Top Stories", description: "The most important news from George and the Garden Route." },
  "local": { title: "Local News", description: "Local news from George and surrounding areas.", section: "local" },
  "national": { title: "National & World", description: "National and international news.", section: "national" },
  "business": { title: "Business", description: "Business news and market updates.", section: "business" },
  "crime": { title: "Crime", description: "Crime news from the Garden Route.", section: "crime" },
  "general": { title: "General News", description: "General news stories.", section: "general" },
  "environment": { title: "Environment", description: "Environmental news from the Garden Route.", section: "environment" },
  "agriculture": { title: "Agriculture", description: "Agricultural news and farming updates.", section: "agriculture" },
  "politics": { title: "Politics", description: "Political news and election coverage.", section: "politics" },
  "lifestyle": { title: "Lifestyle", description: "Lifestyle, health and wellness.", section: "lifestyle" },
  "entertainment": { title: "Entertainment", description: "Entertainment news and reviews.", section: "entertainment" },
  "property": { title: "Property", description: "Property market news and trends.", section: "lifestyle" },
  "schools": { title: "Schools", description: "School news, sports and academic achievements.", section: "schools" },
};

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const meta = categoryMeta[category];
  return {
    title: meta?.title || category,
    description: meta?.description || `${category} news from George Herald.`,
  };
}

export function generateStaticParams() {
  return Object.keys(categoryMeta).map((category) => ({ category }));
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const meta = categoryMeta[category] || { title: category, description: "" };

  // Top stories use isTopStory flag, not category slug
  let articles = category === "top-stories"
    ? getTopStories()
    : [
        ...getArticlesByCategory(category, 5000),
        ...(meta.section ? getArticlesBySection(meta.section, 5000) : []),
      ];
  // Deduplicate
  const seen = new Set<number>();
  articles = articles.filter((a) => {
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
        <a href="/news" className="hover:text-primary transition-colors">News</a>
        <span>/</span>
        <span className="text-foreground font-medium">{meta.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SectionHeader title={meta.title} />
          {meta.description && (
            <p className="text-muted-foreground mb-6">{meta.description}</p>
          )}
          <ArticleListPaginated articles={articles} />
        </div>

        <aside className="lg:col-span-1">
          <MostReadSidebar articles={mostRead} />
        </aside>
      </div>
    </div>
  );
}
