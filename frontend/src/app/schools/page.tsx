import SectionHeader from "@/components/sections/SectionHeader";
import MostReadSidebar from "@/components/sections/MostReadSidebar";
import ArticleListPaginated from "@/components/ui/article-list-paginated";
import { getArticlesBySection, getArticlesByCategory, getMostReadArticles } from "@/lib/scraped-data";
import Link from "next/link";
import { GraduationCap, Trophy, Palette, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schools",
  description: "School news, sports and academic achievements from George and the Garden Route.",
};

const subcategories = [
  { label: "All", href: "/schools", icon: GraduationCap },
  { label: "Sport", href: "/schools/sport", icon: Trophy },
  { label: "Academic", href: "/schools/academic", icon: GraduationCap },
  { label: "Cultural", href: "/schools/cultural", icon: Palette },
  { label: "Social", href: "/schools/social", icon: Users },
];

export default function SchoolsPage() {
  const schoolsArticles = [
    ...getArticlesBySection("schools", 5000),
    ...getArticlesByCategory("schools", 5000),
    ...getArticlesByCategory("academic", 5000),
    ...getArticlesByCategory("culture", 5000),
  ];
  const seen = new Set<number>();
  const unique = schoolsArticles.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
  const mostRead = getMostReadArticles(10);

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Schools</span>
      </div>

      {/* Sub-category tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {subcategories.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors shrink-0 ${
              cat.label === "All"
                ? "bg-primary text-white"
                : "bg-muted text-foreground/70 hover:text-primary hover:bg-primary/10"
            }`}
          >
            <cat.icon className="h-4 w-4" />
            {cat.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SectionHeader title="Schools" />
          <ArticleListPaginated articles={unique} />
        </div>

        <aside className="lg:col-span-1">
          <MostReadSidebar articles={mostRead} />
        </aside>
      </div>
    </div>
  );
}
