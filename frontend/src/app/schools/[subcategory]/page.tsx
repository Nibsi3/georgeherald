import SectionHeader from "@/components/sections/SectionHeader";
import MostReadSidebar from "@/components/sections/MostReadSidebar";
import ArticleListPaginated from "@/components/ui/article-list-paginated";
import { getArticlesByCategory, getArticlesBySection, getMostReadArticles } from "@/lib/scraped-data";
import Link from "next/link";
import { GraduationCap, Trophy, Palette, Users } from "lucide-react";
import type { Article } from "@/lib/types";
import type { Metadata } from "next";

const SUBCATEGORIES: Record<string, { title: string; description: string }> = {
  sport: { title: "Schools Sport", description: "School sporting events, results and achievements from the Garden Route." },
  academic: { title: "Schools Academic", description: "Academic news, results and achievements from schools in George and the Garden Route." },
  cultural: { title: "Schools Cultural", description: "Cultural events, arts and performances from local schools." },
  social: { title: "Schools Social", description: "Social events, community projects and school life." },
};

const SPORT_KEYWORDS = ["rugby", "cricket", "netball", "hockey", "athletics", "swimming", "tennis", "sport", "match", "tournament", "team", "player", "coach", "final", "trophy", "league", "inter-schools", "interschools"];
const ACADEMIC_KEYWORDS = ["academic", "matric", "exam", "results", "top achiever", "science", "maths", "math", "olympiad", "quiz", "dux", "degree", "university", "bursary", "scholarship", "study", "graduate", "education"];
const CULTURAL_KEYWORDS = ["culture", "cultural", "arts", "drama", "music", "dance", "choir", "eisteddfod", "concert", "performance", "art", "theatre", "theater", "singing", "band", "orchestra", "exhibition", "talent"];
const SOCIAL_KEYWORDS = ["social", "community", "charity", "fundrais", "volunteer", "outreach", "project", "event", "celebration", "prize-giving", "farewell", "prom", "matric dance", "open day"];

function matchesKeywords(article: Article, keywords: string[]): boolean {
  const text = (article.title + " " + article.excerpt + " " + (article.category?.name || "")).toLowerCase();
  return keywords.some((kw) => text.includes(kw));
}

const tabs = [
  { label: "All", href: "/schools", icon: GraduationCap, key: "all" },
  { label: "Sport", href: "/schools/sport", icon: Trophy, key: "sport" },
  { label: "Academic", href: "/schools/academic", icon: GraduationCap, key: "academic" },
  { label: "Cultural", href: "/schools/cultural", icon: Palette, key: "cultural" },
  { label: "Social", href: "/schools/social", icon: Users, key: "social" },
];

interface PageProps {
  params: Promise<{ subcategory: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subcategory } = await params;
  const meta = SUBCATEGORIES[subcategory];
  return {
    title: meta?.title || "Schools",
    description: meta?.description || "School news from George Herald.",
  };
}

export function generateStaticParams() {
  return Object.keys(SUBCATEGORIES).map((subcategory) => ({ subcategory }));
}

export default async function SchoolsSubcategoryPage({ params }: PageProps) {
  const { subcategory } = await params;
  const meta = SUBCATEGORIES[subcategory] || { title: subcategory, description: "" };

  // Get all schools articles first
  const all = [
    ...getArticlesBySection("schools", 5000),
    ...getArticlesByCategory("schools", 5000),
    ...getArticlesByCategory("academic", 5000),
    ...getArticlesByCategory("culture", 5000),
  ];
  const seen = new Set<number>();
  const unique = all.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  // Filter by subcategory keywords
  let filtered: Article[];
  switch (subcategory) {
    case "sport":
      filtered = unique.filter((a) => matchesKeywords(a, SPORT_KEYWORDS));
      break;
    case "academic":
      filtered = unique.filter((a) => matchesKeywords(a, ACADEMIC_KEYWORDS));
      break;
    case "cultural":
      filtered = unique.filter((a) => matchesKeywords(a, CULTURAL_KEYWORDS));
      break;
    case "social":
      filtered = unique.filter((a) => matchesKeywords(a, SOCIAL_KEYWORDS));
      break;
    default:
      filtered = unique;
  }

  const mostRead = getMostReadArticles(10);

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/schools" className="hover:text-primary transition-colors">Schools</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{meta.title}</span>
      </div>

      {/* Sub-category tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors shrink-0 ${
              tab.key === subcategory
                ? "bg-primary text-white"
                : "bg-muted text-foreground/70 hover:text-primary hover:bg-primary/10"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SectionHeader title={meta.title} />
          <ArticleListPaginated articles={filtered} />
        </div>
        <aside className="lg:col-span-1">
          <MostReadSidebar articles={mostRead} />
        </aside>
      </div>
    </div>
  );
}
