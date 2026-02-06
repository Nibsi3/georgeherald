const fs = require("fs-extra");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "scraped-data");

// Normalize category slugs - handles spaces, hyphens, and aliases
function normalizeCategory(raw) {
  if (!raw) return "general";
  let cat = raw.toLowerCase().trim().replace(/\s+/g, "-");
  
  const map = {
    "local-news": "local-news",
    "national-news": "national-news",
    "general-news": "general-news",
    "entertainment-news": "entertainment",
    "business": "business",
    "crime": "crime",
    "environment": "environment",
    "agriculture": "agriculture",
    "politics": "politics",
    "lifestyle": "lifestyle",
    "property": "property",
    "schools": "schools",
    "motoring": "motoring",
    "local-motoring": "motoring",
    "elections": "elections",
    "rugby": "rugby",
    "cricket": "cricket",
    "football": "football",
    "golf": "golf",
    "tennis": "tennis",
    "athletics": "athletics",
    "other": "other-sport",
    "academic": "academic",
    "culture": "culture",
    "social": "schools",
    "sport": "sport",
    "tourism": "tourism",
    "we-care": "we-care",
    "heritage": "heritage",
    "general-notices": "general-notices",
    "dam-level-updates": "dam-level-updates",
    "planned-power-outages": "planned-power-outages",
    "loadshedding": "loadshedding",
    "comment": "comment",
    "blogs": "blogs",
    "general": "general",
  };
  
  return map[cat] || cat;
}

// Determine the section from URL and normalized category
function getSection(url, category) {
  // URL-based section detection is most reliable
  if (url.includes("/Sport/")) return "sport";
  if (url.includes("/Opinion/") || url.includes("/Letters/")) return "opinion";
  if (url.includes("/Schools/")) return "schools";
  if (url.includes("/Community/") || url.includes("/Municipal")) return "community";
  if (url.includes("/Tourism/")) return "tourism";
  if (url.includes("/Entertainment/")) return "entertainment";
  
  // Category-based fallback
  const sportCats = ["rugby", "cricket", "football", "golf", "tennis", "athletics", "other-sport", "sport"];
  if (sportCats.includes(category)) return "sport";
  
  const schoolCats = ["academic", "culture", "schools", "social"];
  if (schoolCats.includes(category)) return "schools";
  
  const communityCats = ["we-care", "heritage", "general-notices", "dam-level-updates", "planned-power-outages"];
  if (communityCats.includes(category)) return "community";
  
  const opinionCats = ["comment", "blogs"];
  if (opinionCats.includes(category)) return "opinion";
  
  if (category === "entertainment") return "entertainment";
  if (category === "tourism") return "tourism";
  
  return "news";
}

// Extract the unique article slug from URL (the last path segment)
function getSlug(url) {
  // e.g., https://www.georgeherald.com/News/Article/Local-News/my-slug-202602060855
  // slug = my-slug-202602060855
  const parts = url.split("/");
  return parts[parts.length - 1].toLowerCase();
}

async function main() {
  const articles = await fs.readJson(path.join(DATA_DIR, "articles.json"));
  console.log(`Total articles loaded: ${articles.length}\n`);

  // Deduplicate by slug (the article identifier at end of URL)
  const bySlug = new Map();
  for (const a of articles) {
    const url = a.link || a.guid;
    const slug = getSlug(url);
    
    if (bySlug.has(slug)) {
      // Keep the one with more content
      const existing = bySlug.get(slug);
      const existingBody = existing.page?.bodyText?.length || 0;
      const currentBody = a.page?.bodyText?.length || 0;
      if (currentBody > existingBody) {
        bySlug.set(slug, a);
      }
    } else {
      bySlug.set(slug, a);
    }
  }
  
  console.log(`Unique slugs: ${bySlug.size} (removed ${articles.length - bySlug.size} slug duplicates)\n`);
  
  // Fix categories and sections for all articles
  const deduped = [];
  for (const a of bySlug.values()) {
    const url = a.link || a.guid;
    
    // Extract category from URL path: /Section/Article/Category/slug
    const match = url.match(/\/Article\/([^/]+)\//);
    const rawCat = match ? match[1] : a.category;
    a.category = normalizeCategory(rawCat);
    a.section = getSection(url, a.category);
    
    deduped.push(a);
  }
  
  // Sort by date (newest first)
  deduped.sort((a, b) => {
    const dateA = a.updated || "";
    const dateB = b.updated || "";
    return dateB.localeCompare(dateA);
  });
  
  // Stats
  const years = {};
  const cats = {};
  const secs = {};
  for (const a of deduped) {
    const url = a.link || a.guid;
    const m = url.match(/-(\d{4})\d{8}$/);
    const year = m ? m[1] : "unknown";
    years[year] = (years[year] || 0) + 1;
    cats[a.category] = (cats[a.category] || 0) + 1;
    secs[a.section] = (secs[a.section] || 0) + 1;
  }
  
  console.log("Year breakdown:");
  for (const [y, c] of Object.entries(years).sort()) console.log(`  ${y}: ${c}`);
  
  console.log("\nSection breakdown:");
  for (const [s, n] of Object.entries(secs).sort((a, b) => b[1] - a[1])) console.log(`  ${s.padEnd(20)}: ${n}`);
  
  console.log("\nCategory breakdown:");
  for (const [c, n] of Object.entries(cats).sort((a, b) => b[1] - a[1])) console.log(`  ${c.padEnd(25)}: ${n}`);
  
  // Check for articles with empty/missing content
  let noTitle = 0, noBody = 0, noImages = 0;
  for (const a of deduped) {
    if (!a.title || a.title.length < 5 || a.title === "George Herald") noTitle++;
    if (!a.page?.bodyText || a.page.bodyText.length < 20) noBody++;
    if (!a.page?.images || a.page.images.length === 0) noImages++;
  }
  console.log(`\nContent quality:`);
  console.log(`  Missing/bad title: ${noTitle}`);
  console.log(`  Missing/short body: ${noBody}`);
  console.log(`  No images: ${noImages}`);
  
  // Save
  await fs.writeJson(path.join(DATA_DIR, "articles.json"), deduped, { spaces: 2 });
  
  const summary = {
    scrapedAt: new Date().toISOString(),
    deduplicatedAt: new Date().toISOString(),
    totalArticles: deduped.length,
    totalVideos: (await fs.readJson(path.join(DATA_DIR, "videos.json"))).length,
    totalGalleries: (await fs.readJson(path.join(DATA_DIR, "galleries.json"))).length,
    yearBreakdown: years,
    categoryBreakdown: cats,
    sectionBreakdown: secs,
  };
  await fs.writeJson(path.join(DATA_DIR, "summary.json"), summary, { spaces: 2 });
  
  console.log(`\n✓ Saved ${deduped.length} clean, deduplicated articles`);
}

main().catch(console.error);
