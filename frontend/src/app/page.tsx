import { Separator } from "@/components/ui/separator";
import ArticleCard from "@/components/cards/ArticleCard";
import VideoCard from "@/components/cards/VideoCard";
import GalleryCard from "@/components/cards/GalleryCard";
import SectionHeader from "@/components/sections/SectionHeader";
import MostReadAdRotator from "@/components/sections/MostReadAdRotator";
import BreakingNewsBanner from "@/components/sections/BreakingNewsBanner";
import NewsTicker from "@/components/sections/NewsTicker";
import TopStoriesRotator from "@/components/sections/TopStoriesRotator";
import { FileText, Calendar, Camera, Mountain, TrendingUp, Clock, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  getTopStoriesForWorkspace,
  getLatestArticlesForWorkspace,
  getMostReadArticlesForWorkspace,
  getArticlesBySectionForWorkspace,
  getVideosBySection,
  getGalleriesBySection,
  PARENT_WORKSPACE,
} from "@/lib/scraped-data";

export default function Home() {
  const ws = PARENT_WORKSPACE;
  const topStories = getTopStoriesForWorkspace(ws);
  const breakingArticles = topStories.filter((a) => a.isBreaking);
  const sportArticles = getArticlesBySectionForWorkspace(ws, "sport", 6);
  const businessArticles = getArticlesBySectionForWorkspace(ws, "business", 4);
  const lifestyleArticles = getArticlesBySectionForWorkspace(ws, "lifestyle", 4);
  const latestArticles = getLatestArticlesForWorkspace(ws, 8);
  const mostReadArticles = getMostReadArticlesForWorkspace(ws, 10);
  const latestVideos = getVideosBySection(undefined, 4);
  const latestGalleries = getGalleriesBySection(undefined, 6);
  const tickerArticles = getLatestArticlesForWorkspace(ws, 50);

  return (
    <>
      <BreakingNewsBanner articles={breakingArticles} />
      <NewsTicker articles={tickerArticles} />

      {/* ═══════ TOP STORIES + SIDEBAR ═══════ */}
      <div className="container mx-auto px-4 pt-8 pb-4">
        <SectionHeader title="Top Stories" href="/news/top-stories" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main content */}
          <div className="lg:col-span-8">
            <TopStoriesRotator topStories={topStories} />
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-5">
            <a
              href="https://www.magzter.com/ZA/Caxton-Newspapers/George-Herald/Newspaper/"
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-gradient-to-br from-primary to-red-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-5 text-white text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1 text-white/70">Buy the</p>
                <p className="text-xl font-black mb-3 leading-tight">George Herald<br />E-Newspaper</p>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="bg-white/15 rounded-lg p-2.5">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
                <span className="inline-block bg-white text-primary font-bold text-sm px-5 py-2 rounded-lg group-hover:bg-white/90 transition-colors">
                  Read Now →
                </span>
              </div>
            </a>

            <MostReadAdRotator articles={mostReadArticles} />

            <a
              href="https://whatsapp.com/channel/0029VaNwpHsFcovzVDNsRk2X"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-4 bg-primary rounded-xl text-white hover:bg-primary/90 transition-colors shadow-sm"
            >
              <svg className="h-8 w-8 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div>
                <p className="font-bold text-sm">Follow us on WhatsApp</p>
                <p className="text-xs text-white/80">Get breaking news alerts</p>
              </div>
            </a>
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

      {/* ═══════ AWARD FEATURE ═══════ */}
      <div className="bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 border-y border-amber-200/40 py-10">
        <div className="container mx-auto px-4">
          <Link
            href="/news/george-herald-named-best-paid-community-newspaper-in-sa-avbob-fcj-excellence-awards-202508250122"
            className="group grid grid-cols-1 lg:grid-cols-2 gap-6 items-center"
          >
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden">
              <Image
                src="https://cms.groupeditors.com/img/3c63f67c-14ca-4ee9-9f25-4d991056a6db.jpg?w=1200&scale=both&quality=100"
                alt="George Herald AVBOB FCJ Excellence Awards - Team photo"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={90}
              />
              <div className="absolute top-4 left-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500 text-white px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-md">
                  <Award className="h-4 w-4" />
                  #1 in South Africa
                </div>
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                  AVBOB FCJ Excellence Awards
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground/50 bg-muted px-3 py-1 rounded-full">
                  2024 / 2025
                </span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black leading-tight mb-4 group-hover:text-primary transition-colors">
                George Herald named best paid community newspaper in South Africa
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed mb-5">
                What a weekend! Group Editors returned home from the Avbob FCJ Excellence Awards with the most sought-after prizes for news coverage in 2024.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-white border border-amber-200/60 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-xl font-black text-amber-600 mb-0.5">#1</div>
                  <div className="text-[10px] font-semibold text-amber-800">Best Paid Newspaper</div>
                </div>
                <div className="bg-white border border-amber-200/60 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-xl font-black text-amber-600 mb-0.5">5/10</div>
                  <div className="text-[10px] font-semibold text-amber-800">Top 10 Spots</div>
                </div>
                <div className="bg-white border border-amber-200/60 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-xl font-black text-amber-600 mb-0.5">JOTY</div>
                  <div className="text-[10px] font-semibold text-amber-800">Journalist of the Year</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">By Michelle Pienaar &middot; 25 August 2025</span>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all">
                  Read the full story →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ═══════ VIDEOS ═══════ */}
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

      {/* ═══════ SPORT + GALLERIES (alternating bg) ═══════ */}
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
              { title: "Municipal Notices", href: "https://www.georgeherald.com/Municipal-Notices", Icon: FileText, desc: "Official notices and public information", accent: "bg-primary/10 text-primary" },
              { title: "What's On", href: "https://www.georgeherald.com/WhatsOn", Icon: Calendar, desc: "Local events and activities", accent: "bg-amber-50 text-amber-600" },
              { title: "Sports Gallery", href: "/galleries", Icon: Camera, desc: "Photos from local sporting events", accent: "bg-blue-50 text-blue-600" },
              { title: "About George", href: "https://www.georgeherald.com/Community/Heritage", Icon: Mountain, desc: "History and heritage of George", accent: "bg-green-50 text-green-700" },
            ].map((item) => (
              <a
                key={item.title}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group p-5 bg-white border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${item.accent} mb-3`}>
                  <item.Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
