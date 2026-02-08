import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Eye, User, Camera, Play, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { getArticleBySlug, getArticleDetail, getArticlesBySection, getMostReadArticles, articles } from "@/lib/scraped-data";
import ArticleCard from "@/components/cards/ArticleCard";
import MostReadSidebar from "@/components/sections/MostReadSidebar";
import ViewTracker from "@/components/ViewTracker";
import SectionHeader from "@/components/sections/SectionHeader";
import ImageCarousel from "@/components/ui/image-carousel";
import ShareButtons from "@/components/ui/share-buttons";
import type { Metadata } from "next";
import type { ContentBlock } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Article Not Found" };
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.featuredImage ? [{ url: article.featuredImage.url }] : [],
    },
  };
}

function renderBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case "heading":
      if (block.level === "h2") {
        return (
          <h2
            key={index}
            className="text-2xl font-extrabold text-foreground mt-10 mb-4 pb-2 border-b-2 border-primary/20"
          >
            {block.text}
          </h2>
        );
      }
      return (
        <h3
          key={index}
          className="text-xl font-bold text-foreground mt-8 mb-3"
        >
          {block.text}
        </h3>
      );

    case "blockquote":
      return (
        <blockquote
          key={index}
          className="relative my-6 pl-5 pr-4 py-4 border-l-4 border-primary bg-red-50/50 rounded-r-lg"
        >
          <p className="text-base leading-relaxed italic text-foreground/80">
            {block.text}
          </p>
        </blockquote>
      );

    case "list":
      if (block.ordered) {
        return (
          <ol key={index} className="my-4 ml-6 space-y-2 list-decimal">
            {block.items?.map((item, li) => (
              <li key={li} className="text-base leading-relaxed text-foreground/90 pl-1">
                {item}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul key={index} className="my-4 ml-6 space-y-2 list-disc">
          {block.items?.map((item, li) => (
            <li key={li} className="text-base leading-relaxed text-foreground/90 pl-1">
              {item}
            </li>
          ))}
        </ul>
      );

    case "paragraph":
    default: {
      const text = block.text || "";
      // Video callout
      if (text.startsWith("WATCH:") || text.startsWith("VIDEO:") || text.startsWith("SUPPLIED VIDEO")) {
        return (
          <div key={index} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg p-3 my-5">
            <Play className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm font-semibold text-primary">{text}</p>
          </div>
        );
      }
      // Drop cap for the first paragraph (index 0)
      if (index === 0 && text.length > 80) {
        const firstChar = text.charAt(0);
        const rest = text.slice(1);
        return (
          <p key={index} className="text-[1.125rem] leading-[1.8] text-foreground/90 mb-5">
            <span className="float-left text-5xl font-black text-primary leading-[0.85] mr-2 mt-1">
              {firstChar}
            </span>
            {rest}
          </p>
        );
      }
      return (
        <p key={index} className="text-[1.0625rem] leading-[1.85] text-foreground/85 mb-5">
          {text}
        </p>
      );
    }
  }
}

function renderBodyBlocks(blocks: ContentBlock[]) {
  if (!blocks || blocks.length === 0) return null;
  return blocks.map((block, i) => renderBlock(block, i));
}

function renderBodyTextFallback(text: string) {
  if (!text) return null;
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return paragraphs.map((para, i) => {
    if (para.startsWith("## ")) {
      return (
        <h3 key={i} className="text-xl font-bold text-foreground mt-8 mb-3">
          {para.replace(/^## /, "")}
        </h3>
      );
    }
    if (para.startsWith("> ")) {
      return (
        <blockquote key={i} className="relative my-6 pl-5 pr-4 py-4 border-l-4 border-primary bg-red-50/50 rounded-r-lg">
          <p className="text-base leading-relaxed italic text-foreground/80">
            {para.replace(/^> /, "")}
          </p>
        </blockquote>
      );
    }
    if (i === 0 && para.length > 80) {
      const firstChar = para.charAt(0);
      const rest = para.slice(1);
      return (
        <p key={i} className="text-[1.125rem] leading-[1.8] text-foreground/90 mb-5">
          <span className="float-left text-5xl font-black text-primary leading-[0.85] mr-2 mt-1">
            {firstChar}
          </span>
          {rest}
        </p>
      );
    }
    return (
      <p key={i} className="text-[1.0625rem] leading-[1.85] text-foreground/85 mb-5">
        {para}
      </p>
    );
  });
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleDetail(slug);
  if (!article) notFound();

  const relatedArticles = getArticlesBySection(article.section, 4).filter(
    (a) => a.slug !== slug
  );
  const mostRead = getMostReadArticles(10);
  const timeAgo = formatDistanceToNow(new Date(article.publishedDate), { addSuffix: true });
  const publishDate = format(new Date(article.publishedDate), "dd MMMM yyyy, HH:mm");

  // Get content images (skip the featured image which is shown separately)
  const contentImages = (article.articleImages || []).filter(
    (img) => img.url !== article.featuredImage?.url
  );

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <ViewTracker slug={slug} />
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/news" className="hover:text-primary transition-colors">News</Link>
        {article.category && (
          <>
            <span>/</span>
            <Link
              href={`/news/category/${article.category.slug}`}
              className="hover:text-primary transition-colors"
            >
              {article.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-[300px]">{article.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Article Content */}
        <article className="lg:col-span-2">
          {/* Category & Breaking badge */}
          <div className="flex items-center gap-2 mb-3">
            {article.isBreaking && (
              <Badge className="bg-primary text-white border-none text-xs font-bold">BREAKING</Badge>
            )}
            <Badge variant="outline" className="text-primary border-primary/30">
              {article.category?.name || article.section}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-4">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            {article.author && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span className="font-medium text-foreground">{article.author.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{publishDate}</span>
              <span className="text-muted-foreground/50">({timeAgo})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>{article.viewCount.toLocaleString()} views</span>
            </div>
          </div>

          {/* Featured Image */}
          {article.featuredImage && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-6">
              <Image
                src={article.featuredImage.url}
                alt={article.featuredImage.alternativeText || article.title}
                fill
                className="object-cover"
                priority
                quality={100}
                sizes="(max-width: 768px) 100vw, 66vw"
              />
            </div>
          )}

          {/* Excerpt as lead paragraph */}
          <div className="text-base sm:text-lg font-medium text-foreground/80 leading-relaxed mb-6 border-l-4 border-primary pl-4">
            {article.excerpt}
          </div>

          {/* Share buttons */}
          <ShareButtons title={article.title} slug={slug} />

          <Separator className="mb-6" />

          {/* ── FULL ARTICLE BODY ── */}
          <div className="prose-george max-w-none">
            {article.bodyBlocks && article.bodyBlocks.length > 0
              ? renderBodyBlocks(article.bodyBlocks)
              : renderBodyTextFallback(article.bodyText || "")}
          </div>

          {/* ── EMBEDDED VIDEOS ── */}
          {article.videoUrls && article.videoUrls.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Video
              </h3>
              {article.videoUrls.map((url, i) => (
                <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={url}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={`Video ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── ARTICLE IMAGES CAROUSEL ── */}
          {contentImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Camera className="h-5 w-5 text-primary" />
                Photos ({contentImages.length})
              </h3>
              <ImageCarousel images={contentImages} title={article.title} />
            </div>
          )}

          {/* ── LINKED GALLERY ── */}
          {article.galleryLink && (
            <div className="mt-6">
              <Link
                href={article.galleryLink}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-primary font-semibold text-sm rounded-lg hover:bg-red-100 transition-colors"
              >
                <Camera className="h-4 w-4" />
                View Full Photo Gallery
              </Link>
            </div>
          )}

          <Separator className="my-8" />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className="text-sm font-semibold text-muted-foreground">Tags:</span>
              {article.tags.map((tag) => (
                <Badge key={typeof tag === "string" ? tag : tag.name} variant="secondary" className="text-xs">
                  {typeof tag === "string" ? tag : tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Source link */}
          {article.sourceUrl && (
            <div className="text-xs text-muted-foreground mb-8">
              Original article:{" "}
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                georgeherald.com
              </a>
            </div>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className="mt-8">
              <SectionHeader title="Related Articles" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {relatedArticles.slice(0, 3).map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
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

          <MostReadSidebar articles={mostRead} />

          {/* Sponsored: Eden Matchmaker */}
          <div className="border border-border rounded-xl overflow-hidden bg-white">
            <div className="bg-muted/50 text-center py-1.5">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Sponsored</span>
            </div>
            <div className="p-5">
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
              <div className="flex border-b border-border mb-4">
                <a href="https://www.edenmatchmaker.com/s/a/18918" target="_blank" rel="nofollow sponsored" className="flex-1 text-center py-2 text-sm font-bold text-primary border-b-2 border-primary">SEARCH</a>
                <span className="flex items-center px-2 text-xs text-muted-foreground font-medium">OR</span>
                <a href="https://www.edenmatchmaker.com/s/a/18918" target="_blank" rel="nofollow sponsored" className="flex-1 text-center py-2 text-sm font-bold text-foreground/60 hover:text-primary transition-colors">PROFILE</a>
              </div>
              <p className="text-sm text-center text-foreground/70 mb-4">Find your perfect match now!</p>
              <div className="space-y-3">
                {[{name:"SunshineGR",age:45,gender:"woman",seeking:"men",range:"38 and 55"},{name:"GardenRoute_Guy",age:52,gender:"man",seeking:"women",range:"40 and 58"},{name:"CoastalHeart",age:39,gender:"woman",seeking:"men",range:"35 and 50"}].map((p)=>(
                  <a key={p.name} href="https://www.edenmatchmaker.com/s/a/18918" target="_blank" rel="nofollow sponsored" className="flex items-start gap-3 group">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 text-lg">{p.gender==="woman"?"👩":"👨"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold leading-snug">{p.name}</p>
                      <p className="text-xs text-muted-foreground leading-snug">I&apos;m a {p.age} year old {p.gender} looking to meet {p.seeking} between the ages of {p.range}.</p>
                    </div>
                    <span className="text-[11px] font-semibold text-primary border border-primary rounded px-1.5 py-0.5 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">View</span>
                  </a>
                ))}
              </div>
              <a href="https://www.edenmatchmaker.com/s/a/18918" target="_blank" rel="nofollow sponsored" className="block mt-4 w-full text-center bg-primary hover:bg-primary/90 text-white font-bold text-sm py-2.5 rounded-lg transition-colors">View more profiles</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
