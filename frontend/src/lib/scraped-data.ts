import type { Article, Video, Gallery, ContentBlock } from "./types";
import articlesRaw from "@/data/articles.json";
import videosRaw from "@/data/videos.json";
import galleriesRaw from "@/data/galleries.json";
import fs from "fs";
import path from "path";

// Load real click-based view counts
const VIEWS_FILE = path.join(process.cwd(), "src", "data", "views.json");
function loadViewCounts(): Record<string, number> {
  try {
    return JSON.parse(fs.readFileSync(VIEWS_FILE, "utf-8"));
  } catch {
    return {};
  }
}
const viewCounts = loadViewCounts();

export const PARENT_WORKSPACE = "george-herald";

// Workspace slug → route path mapping
export const WORKSPACE_ROUTES: Record<string, string> = {
  "george-herald": "/",
  "knysna-plett-herald": "/knysna-plett",
  "mossel-bay-advertiser": "/mossel-bay",
  "oudtshoorn-courant": "/oudtshoorn",
  "graaff-reinet-advertiser": "/graaff-reinet",
};

// Route path → workspace slug mapping
export const ROUTE_TO_WORKSPACE: Record<string, string> = {
  "knysna-plett": "knysna-plett-herald",
  "mossel-bay": "mossel-bay-advertiser",
  "oudtshoorn": "oudtshoorn-courant",
  "graaff-reinet": "graaff-reinet-advertiser",
};

export const WORKSPACE_NAMES: Record<string, string> = {
  "george-herald": "George Herald",
  "knysna-plett-herald": "Knysna-Plett Herald",
  "mossel-bay-advertiser": "Mossel Bay Advertiser",
  "oudtshoorn-courant": "Oudtshoorn Courant",
  "graaff-reinet-advertiser": "Graaff-Reinet Advertiser",
};

function hashViewCount(slug: string, index: number): number {
  let hash = 0;
  const str = slug + String(index);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  const base = Math.abs(hash) % 8000 + 1200;
  const recency = Math.max(0, 10000 - index * 3);
  return base + Math.floor(recency / 10);
}

function parseBodyBlocks(bodyHtmlJson: string | undefined): ContentBlock[] {
  if (!bodyHtmlJson) return [];
  try {
    const blocks = JSON.parse(bodyHtmlJson);
    if (Array.isArray(blocks)) return blocks as ContentBlock[];
  } catch {
    // If it's not valid JSON, return empty
  }
  return [];
}

function cleanBodyText(raw: string): string {
  let bodyText = raw || "";
  // Strip CSS rules and blocks
  bodyText = bodyText.replace(/\.[\w-]+\s*\{[^}]*\}/g, "");
  bodyText = bodyText.replace(/@[\w-]+\s*\{[^}]*\}/g, "");
  bodyText = bodyText.replace(/@[\w-]+\s*[^{]+\{[\s\S]*?\}\s*\}/g, "");
  bodyText = bodyText.replace(/\/\*[\s\S]*?\*\//g, "");
  // Strip JS
  bodyText = bodyText.replace(/\$\([^)]*\)\.[^;]+;/g, "");
  bodyText = bodyText.replace(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\}/g, "");
  bodyText = bodyText.replace(/var\s+\w+\s*=[\s\S]*?;/g, "");
  bodyText = bodyText.replace(/googletag[\s\S]*?;/g, "");
  // Strip nav/menu text that leaked in
  bodyText = bodyText.replace(/Toggle navigation[\s\S]*?(?=LATEST NEWS|$)/i, "");
  bodyText = bodyText.replace(/LATEST NEWS[\s\S]*?(?=Weather \d+°C|$)/i, "");
  bodyText = bodyText.replace(/Weather \d+°C[\s\S]*?(?=\n\n)/i, "");
  // Remove "Journalist\n  Name" prefix
  bodyText = bodyText.replace(/^Journalist\s+[A-Za-zÀ-ÿ\s]+?\n/, "").trim();
  // Remove "Read more about:..." suffix and anything after
  bodyText = bodyText.replace(/Read more about:[\s\S]*$/, "").trim();
  // Clean excessive whitespace
  bodyText = bodyText.replace(/\n{3,}/g, "\n\n").trim();
  return bodyText;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filterContentImages(images: any[], title: string) {
  const badPatterns = [
    "logo", "weather", "sidebar", "winnersbanners", "press%20reader",
    "press reader", "paper-logo", "online-platforms", "edenmatchmaker",
    "google", "favicon", "loader", "arrow-fb", "placeholder",
    "sidebar-news", "sidebar-emergy", "laptop", "local%20events",
    "local%20sport", "george.jpg", "copyrightbar",
    "georgeherald.com/images/", "digitalplatforms", "localnewsnetwork",
    "twitterx.png", "facebook.png", "youtube.png", "instagram.png",
    "tiktok.png", "whatsapp.png", "rss.png",
  ];
  return images
    .filter((img) => {
      const url = (img.url || "").toLowerCase();
      const alt = (img.alt || "").toLowerCase();
      if (!url.includes("cms.groupeditors.com")) return false;
      return !badPatterns.some((p) => url.includes(p) || alt.includes(p));
    })
    .map((img) => ({
      url: img.url,
      alternativeText: img.alt || title,
    }));
}

function normalizeFeaturedImageUrl(url: string, width: number): string {
  try {
    if (!url) return url;
    if (!url.includes("cms.groupeditors.com")) return url;
    const u = new URL(url);
    u.searchParams.set("w", String(width));
    if (!u.searchParams.has("quality")) u.searchParams.set("quality", "100");
    if (!u.searchParams.has("scale")) u.searchParams.set("scale", "both");
    return u.toString();
  } catch {
    return url;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformArticle(raw: any, index: number): Article {
  const slug = raw.slug || extractSlug(raw.link || "");
  const featuredImage = raw.featuredImage
    ? { url: normalizeFeaturedImageUrl(raw.featuredImage, 1200), alternativeText: raw.title }
    : undefined;

  const authorName =
    typeof raw.author === "string"
      ? raw.author
      : raw.author && typeof raw.author === "object" && typeof raw.author.name === "string"
        ? raw.author.name
        : "George Herald";
  const categoryName = formatCategoryName(raw.category);
  const sectionName = mapSection(raw.section, raw.category);

  return {
    id: index + 1,
    documentId: raw.slug || raw.guid || `a-${index}`,
    title: raw.title,
    slug,
    excerpt: raw.description || "",
    content: undefined,
    bodyText: undefined,
    bodyBlocks: undefined,
    articleImages: undefined,
    sourceUrl: raw.link || "",
    galleryLink: raw.hasGallery ? "gallery" : "",
    videoUrls: raw.hasVideo ? ["video"] : [],
    featuredImage,
    category: {
      id: index + 1,
      name: categoryName,
      slug: normalizeCategory(raw.category),
      color: "#DC2626",
      parentSection: raw.section,
    },
    author: {
      id: 1,
      name: authorName,
      slug: String(authorName).toLowerCase().replace(/\s+/g, "-"),
      role: "Journalist",
    },
    tags: raw.tags || [],
    isTopStory: raw.isTopStory === true || raw.category === "top-stories",
    isBreaking: false,
    isFeatured: index < 3,
    viewCount: viewCounts[slug] || hashViewCount(slug, index),
    publishedDate: raw.updated || new Date().toISOString(),
    section: sectionName,
    workspace: raw.workspace || PARENT_WORKSPACE,
    createdAt: raw.updated || new Date().toISOString(),
    updatedAt: raw.updated || new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformVideo(raw: any, index: number): Video {
  const slug = raw.slug || extractSlug(raw.url);
  return {
    id: index + 1,
    documentId: `v-${index}`,
    title: raw.title,
    slug,
    description: raw.page?.description || "",
    videoUrl: raw.page?.videoUrl || raw.url || "",
    thumbnail: raw.page?.thumbnail
      ? { url: raw.page.thumbnail, alternativeText: raw.title }
      : raw.thumbnail
        ? { url: raw.thumbnail, alternativeText: raw.title }
        : undefined,
    duration: undefined,
    section: raw.section || "news",
    publishedDate: new Date().toISOString(),
    viewCount: hashViewCount(slug, index),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformGallery(raw: any, index: number): Gallery {
  const slug = raw.slug || extractSlug(raw.url);
  const images = (raw.page?.images || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((img: any) => {
      const url = img.url || "";
      return (
        url.includes("cms.groupeditors.com") &&
        !url.includes("logo") &&
        !url.includes("weather") &&
        !url.includes("SideBar") &&
        !url.includes("WinnersBanners")
      );
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((img: any) => ({
      url: img.url,
      alternativeText: img.alt || raw.title,
    }));

  return {
    id: index + 1,
    documentId: `g-${index}`,
    title: raw.title?.trim() || "Untitled Gallery",
    slug,
    description: raw.page?.description || "",
    coverImage: raw.coverImage
      ? { url: raw.coverImage, alternativeText: raw.title }
      : images[0] || undefined,
    images,
    section: (raw.section || "general").toLowerCase().replace(/\s+/g, "-"),
    publishedDate: new Date().toISOString(),
  };
}

function extractSlug(url: string): string {
  if (!url) return "";
  const parts = url.split("/");
  const last = parts[parts.length - 1] || "";
  // Remove date suffix pattern like -202602060855
  return decodeURIComponent(last).replace(/-\d{12}$/, "");
}

// Normalize raw category slugs from scraped data to consistent short form
function normalizeCategory(raw: string): string {
  const map: Record<string, string> = {
    "local-news": "local",
    "general-news": "general",
    "national-news": "national",
    "elections": "politics",
    "social": "lifestyle",
    "local-motoring": "motoring",
    "general-notices": "general",
    "dam-level-updates": "environment",
    "planned-power-outages": "general",
    "other-sport": "other",
  };
  return map[raw] || raw;
}

function formatCategoryName(slug: string): string {
  const map: Record<string, string> = {
    "top-stories": "Top Stories",
    "local": "Local News",
    "local-news": "Local News",
    "national": "National & World",
    "national-news": "National & World",
    "business": "Business",
    "crime": "Crime",
    "general": "General",
    "general-news": "General",
    "environment": "Environment",
    "agriculture": "Agriculture",
    "politics": "Politics",
    "elections": "Politics",
    "lifestyle": "Lifestyle",
    "entertainment": "Entertainment",
    "property": "Property",
    "schools": "Schools",
    "latest": "Latest Sport",
    "rugby": "Rugby",
    "cricket": "Cricket",
    "football": "Football",
    "golf": "Golf",
    "tennis": "Tennis",
    "athletics": "Athletics",
    "other": "Other Sport",
    "other-sport": "Other Sport",
    "academic": "Academic",
    "culture": "Culture",
    "tourism": "Tourism",
    "we-care": "We Care",
    "heritage": "Heritage",
    "comment": "Comment",
    "loadshedding": "Loadshedding",
    "motoring": "Motoring",
    "local-motoring": "Motoring",
    "blogs": "Blogs",
    "dam-level-updates": "Dam Level Updates",
    "general-notices": "Municipal Notices",
    "planned-power-outages": "Power Outages",
    "sport": "Sport",
  };
  return map[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
}

function mapSection(section: string, category: string): string {
  if (section === "sport") return "sport";
  if (section === "opinion") return "opinion";
  if (section === "schools") return "schools";
  if (section === "community") return "community";
  if (section === "tourism") return "tourism";
  if (section === "entertainment") return "entertainment";

  // Use the normalized category
  const norm = normalizeCategory(category);
  const sectionMap: Record<string, string> = {
    "local": "local",
    "national": "national",
    "business": "business",
    "crime": "crime",
    "general": "general",
    "environment": "environment",
    "agriculture": "agriculture",
    "politics": "politics",
    "lifestyle": "lifestyle",
    "entertainment": "entertainment",
    "property": "lifestyle",
    "schools": "schools",
    "top-stories": "local",
    "academic": "schools",
    "culture": "schools",
    "tourism": "tourism",
    "we-care": "community",
    "heritage": "community",
    "comment": "opinion",
    "loadshedding": "general",
    "motoring": "lifestyle",
    "blogs": "opinion",
    "other": "sport",
    "other-sport": "sport",
  };
  return sectionMap[norm] || "general";
}

// Transform all data
export const articles: Article[] = (articlesRaw as unknown[]).map(transformArticle);
export const videos: Video[] = (videosRaw as unknown[]).map(transformVideo);
export const galleries: Gallery[] = (galleriesRaw as unknown[]).map(transformGallery);

// Helper getters
export function getTopStories(): Article[] {
  return articles.filter((a) => a.isTopStory).slice(0, 20);
}

export function getArticlesBySection(section: string, limit = 10): Article[] {
  return articles.filter((a) => a.section === section).slice(0, limit);
}

export function getArticlesByCategory(category: string, limit = 10): Article[] {
  return articles.filter((a) => a.category?.slug === category).slice(0, limit);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticleDetail(slug: string): Article | undefined {
  const article = articles.find((a) => a.slug === slug);
  if (!article) return undefined;

  // Load full content from individual article file using documentId (full slug with date)
  const fullSlug = article.documentId;
  try {
    const filePath = path.join(process.cwd(), "src", "data", "articles", `${fullSlug}.json`);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const bodyText = cleanBodyText(raw.bodyText || "");
    const bodyBlocks =
      Array.isArray(raw.bodyBlocks) && raw.bodyBlocks.length > 0
        ? (raw.bodyBlocks as ContentBlock[])
        : parseBodyBlocks(raw.bodyHtml);
    const articleImages = filterContentImages(raw.images || [], article.title);

    const authorNameRaw = raw.author || article.author?.name || "George Herald";
    let authorName =
      typeof authorNameRaw === "string"
        ? authorNameRaw
        : authorNameRaw && typeof authorNameRaw === "object" && typeof authorNameRaw.name === "string"
          ? authorNameRaw.name
          : "George Herald";
    if (!authorName && bodyText) {
      const match = bodyText.match(/Journalist\s+([A-Za-zÀ-ÿ\s]+?)(?:\n|$)/);
      if (match) authorName = match[1].trim();
    }

    return {
      ...article,
      bodyText,
      bodyBlocks,
      articleImages,
      sourceUrl: raw.link || article.sourceUrl,
      galleryLink: raw.galleryLink || "",
      videoUrls: raw.videoUrls || [],
      featuredImage: raw.ogImage
        ? { url: raw.ogImage, alternativeText: article.title }
        : article.featuredImage,
      author: {
        id: 1,
        name: authorName,
        slug: String(authorName).toLowerCase().replace(/\s+/g, "-"),
        role: "Journalist",
      },
    };
  } catch {
    // File not found or parse error - return listing article as-is
    return article;
  }
}

export function getLatestArticles(limit = 12): Article[] {
  return [...articles]
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, limit);
}

export function getMostReadArticles(limit = 10): Article[] {
  return [...articles]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit);
}

export function getSportArticles(subcategory?: string, limit = 10): Article[] {
  let filtered = articles.filter((a) => a.category?.parentSection === "sport");
  if (subcategory) {
    filtered = filtered.filter((a) => a.category?.slug === subcategory);
  }
  return filtered.slice(0, limit);
}

export function getVideosBySection(section?: string, limit = 8): Video[] {
  if (!section) return videos.slice(0, limit);
  return videos.filter((v) => v.section === section).slice(0, limit);
}

export function getVideoBySlug(slug: string): Video | undefined {
  return videos.find((v) => v.slug === slug);
}

export function getGalleriesBySection(section?: string, limit = 8): Gallery[] {
  if (!section) return galleries.slice(0, limit);
  return galleries
    .filter((g) => g.section === section)
    .slice(0, limit);
}

export function getGalleryBySlug(slug: string): Gallery | undefined {
  return galleries.find((g) => g.slug === slug);
}

export function searchArticles(query: string, limit = 20): Article[] {
  const q = query.toLowerCase();
  return articles
    .filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

// ═══════ WORKSPACE-FILTERED GETTERS ═══════
// These filter articles based on workspace content distribution rules:
// - GH workspace: only GH articles
// - Other workspace: GH articles + that workspace's own local articles (local first)

function isGHArticle(a: Article): boolean {
  return !a.workspace || a.workspace === PARENT_WORKSPACE;
}

function filterByWorkspace(list: Article[], workspaceId: string): Article[] {
  if (workspaceId === PARENT_WORKSPACE) {
    // GH: only GH articles
    return list.filter(isGHArticle);
  }
  // Other workspace: local articles first, then GH articles
  const local = list.filter((a) => a.workspace === workspaceId);
  const gh = list.filter(isGHArticle);
  return [...local, ...gh];
}

export function getTopStoriesForWorkspace(workspaceId: string): Article[] {
  const filtered = filterByWorkspace(articles, workspaceId);
  return filtered.filter((a) => a.isTopStory).slice(0, 20);
}

export function getLatestArticlesForWorkspace(workspaceId: string, limit = 12): Article[] {
  const filtered = filterByWorkspace(articles, workspaceId);
  return [...filtered]
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, limit);
}

export function getMostReadArticlesForWorkspace(workspaceId: string, limit = 10): Article[] {
  const filtered = filterByWorkspace(articles, workspaceId);
  return [...filtered]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit);
}

export function getArticlesBySectionForWorkspace(workspaceId: string, section: string, limit = 10): Article[] {
  const filtered = filterByWorkspace(articles, workspaceId);
  return filtered.filter((a) => a.section === section).slice(0, limit);
}
