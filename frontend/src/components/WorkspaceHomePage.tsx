import { Separator } from "@/components/ui/separator";
import ArticleCard from "@/components/cards/ArticleCard";
import VideoCard from "@/components/cards/VideoCard";
import GalleryCard from "@/components/cards/GalleryCard";
import SectionHeader from "@/components/sections/SectionHeader";
import MostReadAdRotator from "@/components/sections/MostReadAdRotator";
import BreakingNewsBanner from "@/components/sections/BreakingNewsBanner";
import NewsTicker from "@/components/sections/NewsTicker";
import TopStoriesRotator from "@/components/sections/TopStoriesRotator";
import { FileText, Calendar, Camera, Mountain, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import {
  getTopStoriesForWorkspace,
  getLatestArticlesForWorkspace,
  getMostReadArticlesForWorkspace,
  getArticlesBySectionForWorkspace,
  getVideosBySection,
  getGalleriesBySection,
  WORKSPACE_NAMES,
  WORKSPACE_ROUTES,
} from "@/lib/scraped-data";

interface WorkspaceHomePageProps {
  workspaceId: string;
}

export default function WorkspaceHomePage({ workspaceId }: WorkspaceHomePageProps) {
  const wsName = WORKSPACE_NAMES[workspaceId] || workspaceId;
  const basePath = WORKSPACE_ROUTES[workspaceId] || "/";

  const topStories = getTopStoriesForWorkspace(workspaceId);
  const breakingArticles = topStories.filter((a) => a.isBreaking);
  const sportArticles = getArticlesBySectionForWorkspace(workspaceId, "sport", 6);
  const businessArticles = getArticlesBySectionForWorkspace(workspaceId, "business", 4);
  const lifestyleArticles = getArticlesBySectionForWorkspace(workspaceId, "lifestyle", 4);
  const latestArticles = getLatestArticlesForWorkspace(workspaceId, 8);
  const mostReadArticles = getMostReadArticlesForWorkspace(workspaceId, 10);
  const latestVideos = getVideosBySection(undefined, 4);
  const latestGalleries = getGalleriesBySection(undefined, 6);
  const tickerArticles = getLatestArticlesForWorkspace(workspaceId, 50);

  return (
    <>
      <BreakingNewsBanner articles={breakingArticles} />
      <NewsTicker articles={tickerArticles} />

      {/* ═══════ TOP STORIES + SIDEBAR ═══════ */}
      <div className="container mx-auto px-4 pt-8 pb-4">
        <SectionHeader title={`${wsName} — Top Stories`} href={`${basePath === "/" ? "" : basePath}/news/top-stories`} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main content */}
          <div className="lg:col-span-8">
            <TopStoriesRotator topStories={topStories} />
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-5">
            <div className="bg-gradient-to-br from-primary to-red-700 rounded-xl overflow-hidden">
              <div className="p-5 text-white text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1 text-white/70">Read the</p>
                <p className="text-xl font-black mb-3 leading-tight">{wsName}<br />E-Newspaper</p>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="bg-white/15 rounded-lg p-2.5">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
                <span className="inline-block bg-white text-primary font-bold text-sm px-5 py-2 rounded-lg">
                  Read Now →
                </span>
              </div>
            </div>

            <MostReadAdRotator articles={mostReadArticles} />
          </aside>
        </div>
      </div>

      {/* ═══════ TRENDING BAR ═══════ */}
      <div className="bg-muted/30 border-y border-border py-6 mt-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-black text-sm uppercase tracking-wider">Trending Now</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
            {latestArticles.slice(0, 4).map((article, i) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group flex items-start gap-3"
              >
                <span className="text-2xl font-black text-primary/20 group-hover:text-primary transition-colors leading-none mt-0.5 min-w-[30px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(article.publishedDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ LATEST NEWS ═══════ */}
      <div className="container mx-auto px-4 py-10">
        <section>
          <SectionHeader title="Latest News" href="/news" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestArticles.slice(0, 8).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      </div>

      {/* ═══════ VIDEOS ═══════ */}
      {latestVideos.length > 0 && (
        <div className="container mx-auto px-4 py-10">
          <section>
            <SectionHeader title="Latest Videos" href="/videos" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {latestVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ═══════ SPORT + GALLERIES ═══════ */}
      <div className="bg-muted/20 border-y border-border py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sport */}
            <section className="lg:col-span-7">
              <SectionHeader title="Sport" href="/sport" />
              {sportArticles[0] && (
                <div className="mb-5">
                  <ArticleCard article={sportArticles[0]} />
                </div>
              )}
              <div className="space-y-0 bg-white rounded-xl border border-border p-4">
                {sportArticles.slice(1, 5).map((article, index) => (
                  <div key={article.id}>
                    <ArticleCard article={article} variant="horizontal" />
                    {index < 3 && <Separator className="my-3" />}
                  </div>
                ))}
              </div>
            </section>

            {/* Galleries */}
            <section className="lg:col-span-5">
              <SectionHeader title="Photo Galleries" href="/galleries" />
              <div className="grid grid-cols-2 gap-4">
                {latestGalleries.slice(0, 6).map((gallery) => (
                  <GalleryCard key={gallery.id} gallery={gallery} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ═══════ BUSINESS + LIFESTYLE ═══════ */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Business */}
          <section>
            <SectionHeader title="Business" href="/news/business" />
            <div className="bg-white rounded-xl border border-border p-4 space-y-0">
              {businessArticles.slice(0, 3).map((article, index) => (
                <div key={article.id}>
                  <ArticleCard article={article} variant="horizontal" />
                  {index < 2 && <Separator className="my-3" />}
                </div>
              ))}
            </div>
          </section>

          {/* Lifestyle */}
          <section>
            <SectionHeader title="Lifestyle" href="/lifestyle" />
            <div className="bg-white rounded-xl border border-border p-4 space-y-0">
              {lifestyleArticles.slice(0, 3).map((article, index) => (
                <div key={article.id}>
                  <ArticleCard article={article} variant="horizontal" />
                  {index < 2 && <Separator className="my-3" />}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ═══════ COMMUNITY QUICK LINKS ═══════ */}
      <div className="bg-muted/20 border-t border-border py-10">
        <div className="container mx-auto px-4">
          <SectionHeader title="Community" href="/community" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "Municipal Notices", href: "/community", Icon: FileText, desc: "Official notices and public information", accent: "bg-primary/10 text-primary" },
              { title: "What's On", href: "/whats-on", Icon: Calendar, desc: "Local events and activities", accent: "bg-amber-50 text-amber-600" },
              { title: "Sports Gallery", href: "/galleries", Icon: Camera, desc: "Photos from local sporting events", accent: "bg-blue-50 text-blue-600" },
              { title: `About ${wsName.split(" ")[0]}`, href: "/community", Icon: Mountain, desc: `History and heritage`, accent: "bg-green-50 text-green-700" },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group p-5 bg-white border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${item.accent} mb-3`}>
                  <item.Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
