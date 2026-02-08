import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSession } from "@/lib/admin-auth";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const ARTICLES_FILE = path.join(DATA_DIR, "articles.json");
const ARTICLES_DIR = path.join(DATA_DIR, "articles");
const VIEWS_FILE = path.join(DATA_DIR, "views.json");

function readViews(): Record<string, number> {
  try {
    return JSON.parse(fs.readFileSync(VIEWS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function readArticles() {
  const raw = fs.readFileSync(ARTICLES_FILE, "utf-8");
  return JSON.parse(raw) as Record<string, unknown>[];
}

function writeArticles(articles: Record<string, unknown>[]) {
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2), "utf-8");
}

function readArticleDetail(slug: string) {
  const file = path.join(ARTICLES_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function writeArticleDetail(slug: string, data: Record<string, unknown>) {
  const file = path.join(ARTICLES_DIR, `${slug}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

function normalizeFeaturedImageUrl(url: unknown, width: number): unknown {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cms.groupeditors.com")) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("w", String(width));
    if (!u.searchParams.has("quality")) u.searchParams.set("quality", "100");
    if (!u.searchParams.has("scale")) u.searchParams.set("scale", "both");
    return u.toString();
  } catch {
    return url;
  }
}

// Workspace content distribution:
// - George Herald (parent) articles are visible in ALL workspaces
// - Other workspace articles are ONLY visible in their own workspace
// - Non-GH workspace articles are automatically top stories for that workspace
const PARENT_WORKSPACE = "george-herald";

function canAccessArticle(session: { workspaces?: string[]; role?: string; activeWorkspace?: string }, article: Record<string, unknown>): boolean {
  // Super admins can access everything
  if (session.role === "super_admin") return true;
  // GH articles are accessible to everyone
  const articleWs = (article.workspace as string) || PARENT_WORKSPACE;
  if (articleWs === PARENT_WORKSPACE) return true;
  // Other workspace articles: only if user has access to that workspace
  if (!session.workspaces?.length) return true;
  return session.workspaces.includes(articleWs);
}

// GET: list articles with optional search/filter/pagination
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.toLowerCase() || "";
  const section = url.searchParams.get("section") || "";
  const category = url.searchParams.get("category") || "";
  const workspace = url.searchParams.get("workspace") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "25");
  const slug = url.searchParams.get("slug");

  // Single article detail
  if (slug) {
    const detail = readArticleDetail(slug);
    const listing = readArticles().find((a) => a.slug === slug);
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const article = { ...listing, ...(detail || {}) } as Record<string, unknown>;
    article.featuredImage = normalizeFeaturedImageUrl(article.featuredImage, 1200);
    return NextResponse.json({ article });
  }

  let articles = readArticles();

  if (search) {
    articles = articles.filter(
      (a) =>
        (a.title as string)?.toLowerCase().includes(search) ||
        (a.description as string)?.toLowerCase().includes(search) ||
        (a.slug as string)?.toLowerCase().includes(search)
    );
  }
  if (section) articles = articles.filter((a) => a.section === section);
  if (category) articles = articles.filter((a) => a.category === category);

  // Workspace content distribution (admin view):
  // Each workspace only sees its OWN articles — clean separation for management.
  // GH articles are shared on the PUBLIC side, but in admin each workspace manages independently.
  if (workspace) {
    articles = articles.filter((a) => {
      const ws = (a.workspace as string) || PARENT_WORKSPACE;
      return ws === workspace;
    });
  } else {
    // No workspace filter: only show articles user can access
    articles = articles.filter((a) => canAccessArticle(session, a));
  }

  // Sort by newest first
  articles.sort((a, b) => {
    const dateA = new Date(a.updated as string).getTime() || 0;
    const dateB = new Date(b.updated as string).getTime() || 0;
    return dateB - dateA;
  });

  const total = articles.length;
  const start = (page - 1) * limit;
  const paginated = articles.slice(start, start + limit);

  // Attach real click-based view counts
  const views = readViews();
  const withViews = paginated.map((a) => ({
    ...a,
    viewCount: views[(a.slug as string)] || (a.viewCount as number) || 0,
    featuredImage: normalizeFeaturedImageUrl(a.featuredImage, 1200),
  }));

  return NextResponse.json({
    articles: withViews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// PUT: update an article
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slug, ...updates } = body;
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const articles = readArticles();
  const idx = articles.findIndex((a) => a.slug === slug);
  if (idx === -1) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  // Permission check: members can only edit articles in their assigned workspaces
  const articleWs = (articles[idx].workspace as string) || PARENT_WORKSPACE;
  if (session.role !== "super_admin" && session.workspaces?.length) {
    // GH articles can be edited by anyone with GH access
    // Other workspace articles can only be edited by members of that workspace
    if (articleWs !== PARENT_WORKSPACE && !session.workspaces.includes(articleWs)) {
      return NextResponse.json({ error: "Not authorized to edit this article" }, { status: 403 });
    }
    if (articleWs === PARENT_WORKSPACE && !session.workspaces.includes(PARENT_WORKSPACE)) {
      return NextResponse.json({ error: "Not authorized to edit George Herald articles" }, { status: 403 });
    }
  }

  // Update listing fields
  const listingFields = [
    "title", "description", "section", "category", "isTopStory",
    "featuredImage", "author", "tags", "hasVideo", "hasGallery", "updated", "workspace",
  ];
  for (const field of listingFields) {
    if (updates[field] !== undefined) {
      articles[idx][field] = updates[field];
    }
  }
  writeArticles(articles);

  // Update detail file if detail fields present
  const detail = readArticleDetail(slug);
  if (detail) {
    const detailFields = [
      "title", "description", "bodyText", "images", "author",
      "tags", "videoUrls", "galleryLink", "ogImage",
    ];
    for (const field of detailFields) {
      if (updates[field] !== undefined) {
        detail[field] = updates[field];
      }
    }
    writeArticleDetail(slug, detail);
  }

  return NextResponse.json({ article: articles[idx] });
}

// POST: create a new article
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, section, category, tags, featuredImage, author, bodyText, isTopStory, workspace: articleWorkspace } = body;

  if (!title || !description || !section) {
    return NextResponse.json({ error: "title, description, section are required" }, { status: 400 });
  }

  // Generate slug from title + timestamp
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const slug = `${baseSlug}-${timestamp}`;

  const articles = readArticles();
  const maxGuid = articles.reduce((max, a) => Math.max(max, parseInt(a.guid as string) || 0), 0);

  // Determine workspace for this article
  const ws = articleWorkspace || session.activeWorkspace || PARENT_WORKSPACE;
  // Non-GH workspace articles are automatically top stories for that workspace
  const autoTopStory = ws !== PARENT_WORKSPACE ? true : (isTopStory || false);

  const newListing = {
    guid: String(maxGuid + 1),
    link: `https://www.georgeherald.com/${section}/${slug}`,
    title,
    description,
    updated: new Date().toISOString(),
    section: section || "news",
    category: category || "general-news",
    isTopStory: autoTopStory,
    slug,
    featuredImage: featuredImage || "",
    author: author || "",
    tags: tags || [],
    hasVideo: false,
    hasGallery: false,
    imageCount: 0,
    workspace: ws,
    createdBy: session.email,
  };

  articles.unshift(newListing);
  writeArticles(articles);

  // Create detail file
  const detail = {
    title,
    description,
    bodyText: bodyText || "",
    images: featuredImage ? [{ url: featuredImage, alt: title }] : [],
    author: author || "",
    tags: tags || [],
    videoUrls: [],
    galleryLink: "",
    ogImage: featuredImage || "",
  };
  writeArticleDetail(slug, detail);

  return NextResponse.json({ article: newListing }, { status: 201 });
}

// DELETE: delete an article
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const articles = readArticles();

  // Permission check: members can only delete articles in their assigned workspaces
  const article = articles.find((a) => a.slug === slug);
  if (article && session.role !== "super_admin" && session.workspaces?.length) {
    const articleWs = (article.workspace as string) || PARENT_WORKSPACE;
    if (articleWs !== PARENT_WORKSPACE && !session.workspaces.includes(articleWs)) {
      return NextResponse.json({ error: "Not authorized to delete this article" }, { status: 403 });
    }
    if (articleWs === PARENT_WORKSPACE && !session.workspaces.includes(PARENT_WORKSPACE)) {
      return NextResponse.json({ error: "Not authorized to delete George Herald articles" }, { status: 403 });
    }
  }

  const filtered = articles.filter((a) => a.slug !== slug);
  if (filtered.length === articles.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  writeArticles(filtered);

  // Delete detail file
  const detailFile = path.join(ARTICLES_DIR, `${slug}.json`);
  if (fs.existsSync(detailFile)) fs.unlinkSync(detailFile);

  return NextResponse.json({ ok: true });
}
