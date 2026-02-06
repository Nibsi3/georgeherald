import { Separator } from "@/components/ui/separator";
import ArticleCardHero from "@/components/cards/ArticleCardHero";
import ArticleCard from "@/components/cards/ArticleCard";
import VideoCard from "@/components/cards/VideoCard";
import GalleryCard from "@/components/cards/GalleryCard";
import SectionHeader from "@/components/sections/SectionHeader";
import MostReadSidebar from "@/components/sections/MostReadSidebar";
import BreakingNewsBanner from "@/components/sections/BreakingNewsBanner";
import NewsTicker from "@/components/sections/NewsTicker";
import { FileText, Calendar, Camera, Mountain, TrendingUp, Clock, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  getTopStories,
  getLatestArticles,
  getMostReadArticles,
  getArticlesBySection,
  getVideosBySection,
  getGalleriesBySection,
} from "@/lib/scraped-data";

export default function Home() {
  const topStories = getTopStories();
  const breakingArticles = topStories.filter((a) => a.isBreaking);
  const heroArticle = topStories[0];
  const sideArticles = topStories.slice(1, 4);
  const sportArticles = getArticlesBySection("sport", 6);
  const businessArticles = getArticlesBySection("business", 4);
  const lifestyleArticles = getArticlesBySection("lifestyle", 4);
  const latestArticles = getLatestArticles(6);
  const mostReadArticles = getMostReadArticles(10);
  const latestVideos = getVideosBySection(undefined, 4);
  const latestGalleries = getGalleriesBySection(undefined, 4);
  const tickerArticles = getLatestArticles(50);

  return (
    <>
      <BreakingNewsBanner articles={breakingArticles} />
      <NewsTicker articles={tickerArticles} />

      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Hero + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Hero section */}
          <div className="lg:col-span-2">
            <SectionHeader title="Top Stories" href="/news/top-stories" />
            {heroArticle && <ArticleCardHero article={heroArticle} />}

            {/* Secondary stories grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
              {sideArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Award Feature - Large Showcase */}
            <div className="mt-10">
              <Link
                href="/news/george-herald-named-best-paid-community-newspaper-in-sa-avbob-fcj-excellence-awards-202508250122"
                className="group block overflow-hidden rounded-2xl border-2 border-amber-300/50 bg-gradient-to-br from-amber-50 via-white to-amber-50 shadow-lg hover:shadow-xl transition-shadow"
              >
                {/* Large hero image */}
                <div className="relative w-full min-h-[260px] md:min-h-[360px]">
                  <Image
                    src="https://cms.groupeditors.com/img/3c63f67c-14ca-4ee9-9f25-4d991056a6db.jpg?w=800&scale=both&quality=100"
                    alt="George Herald AVBOB FCJ Excellence Awards - Team photo"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 66vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  {/* Award badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-500 text-white px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-md">
                      <Award className="h-4 w-4" />
                      #1 in South Africa
                    </div>
                  </div>
                  {/* Title overlay on image */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300 bg-black/40 px-3 py-1 rounded-full">
                        AVBOB FCJ Excellence Awards
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-white bg-white/20 px-3 py-1 rounded-full">
                        2024 / 2025
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-black leading-tight text-white drop-shadow-lg">
                      George Herald named best paid community newspaper in South Africa
                    </h3>
                  </div>
                </div>

                {/* Content area below image */}
                <div className="p-6 md:p-8">
                  <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-4">
                    What a weekend! Group Editors returned home from the Avbob FCJ Excellence Awards with the most sought-after prizes for news coverage in 2024. George Herald came out tops, with all five Group Editors newspapers ranked among the top 10 nationwide.
                  </p>

                  {/* Key achievements grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-center">
                      <div className="text-2xl font-black text-amber-600 mb-1">#1</div>
                      <div className="text-xs font-semibold text-amber-800">Best Paid Newspaper</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-center">
                      <div className="text-2xl font-black text-amber-600 mb-1">5/10</div>
                      <div className="text-xs font-semibold text-amber-800">Top 10 Spots</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-center">
                      <div className="text-2xl font-black text-amber-600 mb-1">Journalist</div>
                      <div className="text-xs font-semibold text-amber-800">of the Year</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">By Michelle Pienaar &middot; 25 August 2025</span>
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all">
                      Read the full story
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            </div>

          </div>

          {/* Sidebar: Promo + Most Read + Ads */}
          <div className="lg:col-span-1 space-y-6">
            {/* E-Newspaper Promo */}
            <a
              href="https://www.magzter.com/ZA/Caxton-Newspapers/George-Herald/Newspaper/"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-primary rounded-xl overflow-hidden hover:opacity-95 transition-opacity"
            >
              <div className="p-5 text-white text-center">
                <p className="text-xs font-medium uppercase tracking-wider mb-1">Buy the</p>
                <p className="text-xl font-black mb-2">George Herald<br />E-Newspaper</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="bg-white/20 rounded-lg p-2">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
                <span className="inline-block bg-white text-primary font-bold text-sm px-4 py-1.5 rounded-lg">
                  Read Now →
                </span>
              </div>
            </a>

            <MostReadSidebar articles={mostReadArticles} />

            {/* WhatsApp Follow */}
            <a
              href="https://whatsapp.com/channel/0029VaNwpHsFcovzVDNsRk2X"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-primary rounded-xl text-white hover:bg-primary/90 transition-colors"
            >
              <svg className="h-8 w-8 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div>
                <p className="font-bold text-sm">Follow us on WhatsApp</p>
                <p className="text-xs text-white/80">Get breaking news alerts</p>
              </div>
            </a>

            {/* Sponsored: Eden Matchmaker */}
            <div className="border border-border rounded-xl overflow-hidden bg-white">
              <div className="bg-muted/50 text-center py-1.5">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Sponsored</span>
              </div>
              <div className="p-5">
                {/* Logo / Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <div className="ml-1">
                      <span className="text-lg font-black text-[#8B0000] leading-none">EDEN</span>
                      <span className="text-lg font-light text-foreground/70 leading-none ml-0.5">Matchmaker</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">in association with DatingBuzz</p>

                {/* Tabs */}
                <div className="flex border-b border-border mb-4">
                  <a
                    href="https://www.edenmatchmaker.com/s/a/18918"
                    target="_blank"
                    rel="nofollow sponsored"
                    className="flex-1 text-center py-2 text-sm font-bold text-primary border-b-2 border-primary"
                  >
                    SEARCH
                  </a>
                  <span className="flex items-center px-2 text-xs text-muted-foreground font-medium">OR</span>
                  <a
                    href="https://www.edenmatchmaker.com/s/a/18918"
                    target="_blank"
                    rel="nofollow sponsored"
                    className="flex-1 text-center py-2 text-sm font-bold text-foreground/60 hover:text-primary transition-colors"
                  >
                    PROFILE
                  </a>
                </div>

                <p className="text-sm text-center text-foreground/70 mb-4">Find your perfect match now!</p>

                {/* Sample Profiles */}
                <div className="space-y-3">
                  {[
                    { name: "SunshineGR", age: 45, gender: "woman", seeking: "men", range: "38 and 55" },
                    { name: "GardenRoute_Guy", age: 52, gender: "man", seeking: "women", range: "40 and 58" },
                    { name: "CoastalHeart", age: 39, gender: "woman", seeking: "men", range: "35 and 50" },
                  ].map((profile) => (
                    <a
                      key={profile.name}
                      href="https://www.edenmatchmaker.com/s/a/18918"
                      target="_blank"
                      rel="nofollow sponsored"
                      className="flex items-start gap-3 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 text-lg">
                        {profile.gender === "woman" ? "👩" : "👨"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-snug">{profile.name}</p>
                        <p className="text-xs text-muted-foreground leading-snug">
                          I&apos;m a {profile.age} year old {profile.gender} looking to meet {profile.seeking} between the ages of {profile.range}.
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-primary border border-primary rounded px-1.5 py-0.5 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        View
                      </span>
                    </a>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href="https://www.edenmatchmaker.com/s/a/18918"
                  target="_blank"
                  rel="nofollow sponsored"
                  className="block mt-4 w-full text-center bg-primary hover:bg-primary/90 text-white font-bold text-sm py-2.5 rounded-lg transition-colors"
                >
                  View more profiles
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 lg:mt-16 mb-8 lg:mb-10 bg-muted/40 border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Trending Now</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {latestArticles.slice(0, 4).map((article, i) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group flex items-start gap-2"
              >
                <span className="text-lg font-black text-primary/30 group-hover:text-primary transition-colors leading-none mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
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

        {/* Latest News Grid */}
        <section>
          <SectionHeader title="Latest News" href="/news" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>

        <Separator className="my-8 lg:my-10" />

        {/* Videos Section */}
        <section>
          <SectionHeader title="Latest Videos" href="/videos" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {latestVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>

        <Separator className="my-8 lg:my-10" />

        {/* Sport + Galleries Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sport */}
          <section>
            <SectionHeader title="Sport" href="/sport" />
            <div className="space-y-0">
              {sportArticles.slice(0, 4).map((article, index) => (
                <div key={article.id}>
                  <ArticleCard article={article} variant={index === 0 ? "default" : "horizontal"} />
                  {index < Math.min(sportArticles.length, 4) - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Galleries */}
          <section>
            <SectionHeader title="Photo Galleries" href="/galleries" />
            <div className="grid grid-cols-2 gap-4">
              {latestGalleries.map((gallery) => (
                <GalleryCard key={gallery.id} gallery={gallery} />
              ))}
            </div>
          </section>
        </div>

        <Separator className="my-8 lg:my-10" />

        {/* Business + Lifestyle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Business */}
          <section>
            <SectionHeader title="Business" href="/news/business" />
            <div className="space-y-0">
              {businessArticles.slice(0, 3).map((article, index) => (
                <div key={article.id}>
                  <ArticleCard article={article} variant="horizontal" />
                  {index < Math.min(businessArticles.length, 3) - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Lifestyle */}
          <section>
            <SectionHeader title="Lifestyle" href="/lifestyle" />
            <div className="space-y-0">
              {lifestyleArticles.slice(0, 3).map((article, index) => (
                <div key={article.id}>
                  <ArticleCard article={article} variant="horizontal" />
                  {index < Math.min(lifestyleArticles.length, 3) - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <Separator className="my-8 lg:my-10" />

        {/* Community Quick Links */}
        <section className="mb-8">
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
        </section>
      </div>
    </>
  );
}
