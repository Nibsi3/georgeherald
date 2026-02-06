import SectionHeader from "@/components/sections/SectionHeader";
import MostReadSidebar from "@/components/sections/MostReadSidebar";
import ArticleListPaginated from "@/components/ui/article-list-paginated";
import { getSportArticles, getMostReadArticles } from "@/lib/scraped-data";
import Link from "next/link";
import type { Metadata } from "next";

const sportMeta: Record<string, { title: string; description: string }> = {
  "rugby": { title: "Rugby", description: "Rugby news from the Garden Route and beyond." },
  "cricket": { title: "Cricket", description: "Cricket news, results and coverage." },
  "football": { title: "Football", description: "Football news and match reports." },
  "golf": { title: "Golf", description: "Golf news and tournament coverage." },
  "tennis": { title: "Tennis", description: "Tennis news from local and national courts." },
  "athletics": { title: "Athletics", description: "Athletics news, events and results." },
  "other": { title: "Other Sport", description: "Other sporting news from the Garden Route." },
};

interface PageProps {
  params: Promise<{ subcategory: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subcategory } = await params;
  const meta = sportMeta[subcategory];
  return {
    title: meta?.title || subcategory,
    description: meta?.description || `${subcategory} sport news from George Herald.`,
  };
}

export function generateStaticParams() {
  return Object.keys(sportMeta).map((subcategory) => ({ subcategory }));
}

export default async function SportSubcategoryPage({ params }: PageProps) {
  const { subcategory } = await params;
  const meta = sportMeta[subcategory] || { title: subcategory, description: "" };
  const articles = getSportArticles(subcategory, 5000);
  const mostRead = getMostReadArticles(10);

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/sport" className="hover:text-primary transition-colors">Sport</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{meta.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SectionHeader title={meta.title} />
          <ArticleListPaginated articles={articles} />
        </div>

        <aside className="lg:col-span-1">
          <MostReadSidebar articles={mostRead} />
        </aside>
      </div>
    </div>
  );
}
