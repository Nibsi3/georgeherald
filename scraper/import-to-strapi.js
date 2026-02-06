const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "";
const DATA_DIR = path.join(__dirname, "..", "scraped-data");

const api = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
  },
  timeout: 30000,
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractSlug(url) {
  if (!url) return "";
  const parts = url.split("/");
  const last = parts[parts.length - 1] || "";
  return decodeURIComponent(last).replace(/-\d{12}$/, "");
}

function formatCategoryName(slug) {
  const map = {
    "top-stories": "Top Stories",
    "local": "Local News",
    "national": "National & World",
    "business": "Business",
    "crime": "Crime",
    "general": "General",
    "environment": "Environment",
    "agriculture": "Agriculture",
    "politics": "Politics",
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
  };
  return map[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

function mapSection(section, category) {
  if (section === "sport") return "sport";
  const sectionMap = {
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
  };
  return sectionMap[category] || "general";
}

// ──────────────────────────────────────────────
// IMPORT CATEGORIES
// ──────────────────────────────────────────────
async function importCategories(articles) {
  console.log("\n📂 Importing categories...");
  const categorySet = new Map();

  for (const a of articles) {
    const catSlug = a.category;
    if (!categorySet.has(catSlug)) {
      categorySet.set(catSlug, {
        name: formatCategoryName(catSlug),
        slug: catSlug,
        parentSection: a.section === "sport" ? "sport" : "news",
        color: "#DC2626",
      });
    }
  }

  const categoryIdMap = {};
  for (const [slug, catData] of categorySet) {
    try {
      // Check if already exists
      const existing = await api.get(`/categories?filters[slug][$eq]=${slug}`);
      if (existing.data.data && existing.data.data.length > 0) {
        categoryIdMap[slug] = existing.data.data[0].documentId;
        console.log(`  ✓ Category "${catData.name}" already exists`);
        continue;
      }

      const res = await api.post("/categories", { data: catData });
      categoryIdMap[slug] = res.data.data.documentId;
      console.log(`  ✓ Created category: ${catData.name}`);
    } catch (err) {
      console.error(`  ✗ Failed to create category "${catData.name}": ${err.message}`);
    }
    await sleep(200);
  }

  return categoryIdMap;
}

// ──────────────────────────────────────────────
// IMPORT AUTHORS
// ──────────────────────────────────────────────
async function importAuthors(articles) {
  console.log("\n👤 Importing authors...");
  const authorSet = new Map();

  for (const a of articles) {
    let authorName = "George Herald";
    if (a.page?.author) {
      authorName = a.page.author;
    } else if (a.page?.bodyText) {
      const match = a.page.bodyText.match(/Journalist\s+([A-Za-zÀ-ÿ\s]+?)(?:\n|$)/);
      if (match) authorName = match[1].trim();
    }

    const authorSlug = authorName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!authorSet.has(authorSlug)) {
      authorSet.set(authorSlug, {
        name: authorName,
        slug: authorSlug,
        role: "Journalist",
      });
    }
  }

  const authorIdMap = {};
  for (const [slug, authorData] of authorSet) {
    try {
      const existing = await api.get(`/authors?filters[slug][$eq]=${slug}`);
      if (existing.data.data && existing.data.data.length > 0) {
        authorIdMap[slug] = existing.data.data[0].documentId;
        console.log(`  ✓ Author "${authorData.name}" already exists`);
        continue;
      }

      const res = await api.post("/authors", { data: authorData });
      authorIdMap[slug] = res.data.data.documentId;
      console.log(`  ✓ Created author: ${authorData.name}`);
    } catch (err) {
      console.error(`  ✗ Failed to create author "${authorData.name}": ${err.message}`);
    }
    await sleep(200);
  }

  return authorIdMap;
}

// ──────────────────────────────────────────────
// IMPORT TAGS
// ──────────────────────────────────────────────
async function importTags(articles) {
  console.log("\n🏷️  Importing tags...");
  const tagSet = new Set();

  for (const a of articles) {
    if (a.page?.tags) {
      for (const t of a.page.tags) {
        if (t && t.length < 50) tagSet.add(t);
      }
    }
  }

  const tagIdMap = {};
  for (const tagName of tagSet) {
    const tagSlug = tagName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      const existing = await api.get(`/tags?filters[slug][$eq]=${tagSlug}`);
      if (existing.data.data && existing.data.data.length > 0) {
        tagIdMap[tagName] = existing.data.data[0].documentId;
        continue;
      }

      const res = await api.post("/tags", { data: { name: tagName, slug: tagSlug } });
      tagIdMap[tagName] = res.data.data.documentId;
    } catch (err) {
      // Silently skip duplicate tags
    }
    await sleep(100);
  }

  console.log(`  ✓ Imported ${Object.keys(tagIdMap).length} tags`);
  return tagIdMap;
}

// ──────────────────────────────────────────────
// IMPORT ARTICLES
// ──────────────────────────────────────────────
async function importArticles(articles, categoryIdMap, authorIdMap, tagIdMap) {
  console.log("\n📰 Importing articles...");
  let count = 0;
  let success = 0;

  for (const raw of articles) {
    count++;
    const slug = extractSlug(raw.link);

    // Extract author
    let authorName = "George Herald";
    if (raw.page?.author) authorName = raw.page.author;
    else if (raw.page?.bodyText) {
      const match = raw.page.bodyText.match(/Journalist\s+([A-Za-zÀ-ÿ\s]+?)(?:\n|$)/);
      if (match) authorName = match[1].trim();
    }
    const authorSlug = authorName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const articleData = {
      title: raw.title,
      slug,
      excerpt: raw.description || raw.page?.ogDescription || "",
      section: mapSection(raw.section, raw.category),
      isTopStory: raw.category === "top-stories",
      isBreaking: false,
      isFeatured: count <= 3,
      viewCount: 0,
      publishedDate: raw.updated || new Date().toISOString(),
      ...(categoryIdMap[raw.category] ? { category: categoryIdMap[raw.category] } : {}),
      ...(authorIdMap[authorSlug] ? { author: authorIdMap[authorSlug] } : {}),
    };

    // Connect tags
    if (raw.page?.tags && raw.page.tags.length > 0) {
      const tagIds = raw.page.tags
        .map((t) => tagIdMap[t])
        .filter(Boolean);
      if (tagIds.length > 0) {
        articleData.tags = tagIds;
      }
    }

    try {
      // Check if already exists
      const existing = await api.get(`/articles?filters[slug][$eq]=${slug}`);
      if (existing.data.data && existing.data.data.length > 0) {
        console.log(`  [${count}/${articles.length}] Skipped (exists): ${raw.title.slice(0, 50)}...`);
        continue;
      }

      await api.post("/articles", { data: articleData });
      success++;
      console.log(`  [${count}/${articles.length}] ✓ ${raw.title.slice(0, 50)}...`);
    } catch (err) {
      console.error(`  [${count}/${articles.length}] ✗ ${raw.title.slice(0, 50)}: ${err.response?.data?.error?.message || err.message}`);
    }

    await sleep(200);
  }

  console.log(`\n  ✅ Imported ${success}/${articles.length} articles`);
}

// ──────────────────────────────────────────────
// IMPORT VIDEOS
// ──────────────────────────────────────────────
async function importVideos(videos) {
  console.log("\n🎬 Importing videos...");
  let count = 0;
  let success = 0;

  for (const raw of videos) {
    count++;
    const slug = raw.slug || extractSlug(raw.url);

    const videoData = {
      title: raw.title,
      slug,
      description: raw.page?.description || "",
      videoUrl: raw.page?.videoUrl || raw.url || "",
      section: raw.section || "news",
      publishedDate: new Date().toISOString(),
      viewCount: 0,
    };

    try {
      const existing = await api.get(`/videos?filters[slug][$eq]=${slug}`);
      if (existing.data.data && existing.data.data.length > 0) {
        console.log(`  [${count}/${videos.length}] Skipped (exists): ${raw.title.slice(0, 50)}...`);
        continue;
      }

      await api.post("/videos", { data: videoData });
      success++;
      console.log(`  [${count}/${videos.length}] ✓ ${raw.title.slice(0, 50)}...`);
    } catch (err) {
      console.error(`  [${count}/${videos.length}] ✗ ${raw.title.slice(0, 50)}: ${err.response?.data?.error?.message || err.message}`);
    }

    await sleep(200);
  }

  console.log(`\n  ✅ Imported ${success}/${videos.length} videos`);
}

// ──────────────────────────────────────────────
// IMPORT GALLERIES
// ──────────────────────────────────────────────
async function importGalleries(galleries) {
  console.log("\n🖼️  Importing galleries...");
  let count = 0;
  let success = 0;

  for (const raw of galleries) {
    count++;
    const slug = raw.slug || extractSlug(raw.url);

    const galleryData = {
      title: (raw.title || "").trim() || "Untitled Gallery",
      slug,
      description: raw.page?.description || "",
      section: (raw.section || "general").toLowerCase().replace(/\s+/g, "-"),
      publishedDate: new Date().toISOString(),
    };

    try {
      const existing = await api.get(`/galleries?filters[slug][$eq]=${slug}`);
      if (existing.data.data && existing.data.data.length > 0) {
        console.log(`  [${count}/${galleries.length}] Skipped (exists): ${(raw.title || "").slice(0, 50)}...`);
        continue;
      }

      await api.post("/galleries", { data: galleryData });
      success++;
      console.log(`  [${count}/${galleries.length}] ✓ ${(raw.title || "").slice(0, 50)}...`);
    } catch (err) {
      console.error(`  [${count}/${galleries.length}] ✗ ${(raw.title || "").slice(0, 50)}: ${err.response?.data?.error?.message || err.message}`);
    }

    await sleep(200);
  }

  console.log(`\n  ✅ Imported ${success}/${galleries.length} galleries`);
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
  console.log("=== George Herald Strapi Importer ===");
  console.log(`  Strapi URL: ${STRAPI_URL}`);
  console.log(`  Data dir: ${DATA_DIR}\n`);

  // Check Strapi connection
  try {
    await axios.get(`${STRAPI_URL}/api/articles`, {
      headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
    });
    console.log("  ✓ Connected to Strapi\n");
  } catch (err) {
    console.error("  ✗ Cannot connect to Strapi. Make sure it's running and permissions are set.");
    console.error(`    Error: ${err.message}`);
    console.error("\n  Instructions:");
    console.error("  1. Start Strapi: cd backend && npm run develop");
    console.error("  2. Create admin user at http://localhost:1337/admin");
    console.error("  3. Go to Settings > API Tokens, create a Full Access token");
    console.error("  4. Set STRAPI_API_TOKEN environment variable");
    console.error("  5. Go to Settings > Users & Permissions > Roles > Public");
    console.error("     Enable find/findOne for all content types");
    console.error("  6. Re-run this script\n");
    process.exit(1);
  }

  // Load scraped data
  const articles = await fs.readJson(path.join(DATA_DIR, "articles.json"));
  const videos = await fs.readJson(path.join(DATA_DIR, "videos.json"));
  const galleries = await fs.readJson(path.join(DATA_DIR, "galleries.json"));

  console.log(`  Loaded: ${articles.length} articles, ${videos.length} videos, ${galleries.length} galleries\n`);

  // Import in order: categories, authors, tags, then articles, videos, galleries
  const categoryIdMap = await importCategories(articles);
  const authorIdMap = await importAuthors(articles);
  const tagIdMap = await importTags(articles);
  await importArticles(articles, categoryIdMap, authorIdMap, tagIdMap);
  await importVideos(videos);
  await importGalleries(galleries);

  console.log("\n=== IMPORT COMPLETE ===");
}

main().catch(console.error);
