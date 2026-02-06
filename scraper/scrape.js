const axios = require("axios");
const cheerio = require("cheerio");
const xml2js = require("xml2js");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://www.georgeherald.com";
const OUTPUT_DIR = path.join(__dirname, "..", "scraped-data");
const DELAY_MS = 500; // polite delay between requests

// All RSS feed URLs organized by section
const RSS_FEEDS = {
  news: {
    "top-stories": "/RSS/ArticleFeed/TopStories",
    "local": "/RSS/ArticleFeed/Local%20News",
    "national": "/RSS/ArticleFeed/National%20News",
    "business": "/RSS/ArticleFeed/Business",
    "crime": "/RSS/ArticleFeed/Crime",
    "general": "/RSS/ArticleFeed/General%20News",
    "environment": "/RSS/ArticleFeed/Environment",
    "agriculture": "/RSS/ArticleFeed/Agriculture",
    "politics": "/RSS/ArticleFeed/Politics",
    "lifestyle": "/RSS/ArticleFeed/LifeStyle",
    "entertainment": "/RSS/ArticleFeed/Entertainment%20News",
    "property": "/RSS/ArticleFeed/Property",
    "schools": "/RSS/ArticleFeed/Schools",
  },
  sport: {
    "latest": "/RSS/ArticleFeed/Latest%20Sport",
    "rugby": "/RSS/ArticleFeed/Rugby",
    "cricket": "/RSS/ArticleFeed/Cricket",
    "football": "/RSS/ArticleFeed/Football",
    "golf": "/RSS/ArticleFeed/Golf",
    "tennis": "/RSS/ArticleFeed/Tennis",
    "athletics": "/RSS/ArticleFeed/Athletics",
    "other": "/RSS/ArticleFeed/Other",
  },
};

// Listing pages for videos and galleries
const VIDEO_PAGES = [
  "/Video/LatestVideos",
  "/Video/News",
  "/Video/Sport",
  "/Video/Business",
  "/Video/Entertainment",
  "/Video/Lifestyle",
];

const GALLERY_PAGES = [
  "/Galleries/General",
  "/Galleries/News",
  "/Galleries/Schools",
  "/Galleries/Special-Events",
  "/Galleries/Sport",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "GeorgeHeraldRedesign/1.0 (content migration)",
      },
      timeout: 15000,
    });
    return res.data;
  } catch (err) {
    console.error(`  Failed to fetch ${url}: ${err.message}`);
    return null;
  }
}

// ──────────────────────────────────────────────
// RSS FEED PARSING
// ──────────────────────────────────────────────
async function parseRSSFeed(feedUrl) {
  const xml = await fetchPage(feedUrl);
  if (!xml) return [];

  const parser = new xml2js.Parser({ explicitArray: false });
  try {
    const result = await parser.parseStringPromise(xml);
    const channel = result.rss && result.rss.channel;
    if (!channel || !channel.item) return [];

    const items = Array.isArray(channel.item) ? channel.item : [channel.item];
    return items.map((item) => ({
      guid: item.guid ? (item.guid._ || item.guid) : null,
      link: item.link && typeof item.link === "string" ? item.link : (item.link && item.link._ ? item.link._ : ""),
      title: item.title || "",
      description: item.description || "",
      updated: item["a10:updated"] || item.pubDate || "",
    }));
  } catch (err) {
    console.error(`  Failed to parse RSS: ${err.message}`);
    return [];
  }
}

// ──────────────────────────────────────────────
// ARTICLE PAGE SCRAPING
// ──────────────────────────────────────────────
async function scrapeArticlePage(url) {
  const html = await fetchPage(url);
  if (!html) return null;

  const $ = cheerio.load(html);

  // Extract main article content
  const title = $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") || "";

  const ogImage = $('meta[property="og:image"]').attr("content") || "";
  const ogDesc = $('meta[property="og:description"]').attr("content") || "";

  // Get article body - try various selectors used by GroupEditors CMS
  let bodyHtml = "";
  let bodyText = "";
  const articleSelectors = [
    ".article-body",
    ".article-content",
    ".article__body",
    ".entry-content",
    '[itemprop="articleBody"]',
    ".field-name-body",
    ".news-article-body",
    "#article-body",
  ];

  for (const sel of articleSelectors) {
    if ($(sel).length) {
      bodyHtml = $(sel).html() || "";
      bodyText = $(sel).text().trim();
      break;
    }
  }

  // Fallback: grab paragraphs from the main content area
  if (!bodyText) {
    const mainContent = $(".article-detail, .news-detail, .content-area, main, .main-content").first();
    if (mainContent.length) {
      bodyHtml = mainContent.find("p").map((_, el) => $.html(el)).get().join("\n");
      bodyText = mainContent.find("p").map((_, el) => $(el).text().trim()).get().join("\n\n");
    }
  }

  // Broader fallback: any large text block in the page
  if (!bodyText) {
    const allParagraphs = $("p");
    const contentParagraphs = [];
    allParagraphs.each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 60) {
        contentParagraphs.push(text);
      }
    });
    bodyText = contentParagraphs.join("\n\n");
  }

  // Extract all images from article area
  const images = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    const alt = $(el).attr("alt") || "";
    if (src && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar") && !src.includes("placeholder") && !src.includes("widget")) {
      const fullUrl = src.startsWith("http") ? src : `${BASE_URL}${src}`;
      images.push({ url: fullUrl, alt });
    }
  });

  // Extract author
  let author = "";
  const authorSelectors = [".author-name", ".article-author", '[rel="author"]', ".byline", ".writer"];
  for (const sel of authorSelectors) {
    if ($(sel).length) {
      author = $(sel).first().text().trim();
      break;
    }
  }
  // fallback: look for "Source" text
  if (!author) {
    $("*").each((_, el) => {
      const text = $(el).text();
      const match = text.match(/Source\s+([A-Za-z\s]+?)(?:\n|$)/);
      if (match && !author) {
        author = match[1].trim();
      }
    });
  }

  // Extract tags/keywords
  const tags = [];
  $('meta[name="keywords"]').each((_, el) => {
    const content = $(el).attr("content") || "";
    content.split(",").forEach((t) => {
      const tag = t.trim();
      if (tag) tags.push(tag);
    });
  });
  // Also look for "Read more about:" links
  $('a[href*="/Search/"]').each((_, el) => {
    const tag = $(el).text().trim();
    if (tag && tag.length < 50) tags.push(tag);
  });

  // Extract linked gallery
  let galleryLink = "";
  $('a[href*="/Galleries/Gallery/"]').each((_, el) => {
    galleryLink = $(el).attr("href") || "";
    if (galleryLink && !galleryLink.startsWith("http")) {
      galleryLink = `${BASE_URL}${galleryLink}`;
    }
  });

  // Extract embedded video URLs
  const videoUrls = [];
  $("iframe").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src.includes("youtube") || src.includes("vimeo") || src.includes("facebook")) {
      videoUrls.push(src);
    }
  });
  $('a[href*="youtube.com"], a[href*="youtu.be"]').each((_, el) => {
    videoUrls.push($(el).attr("href"));
  });

  return {
    title,
    ogImage,
    ogDescription: ogDesc,
    bodyHtml,
    bodyText,
    images,
    author,
    tags: [...new Set(tags)],
    galleryLink,
    videoUrls,
    sourceUrl: url,
  };
}

// ──────────────────────────────────────────────
// VIDEO PAGE SCRAPING
// ──────────────────────────────────────────────
async function scrapeVideoListingPage(pageUrl) {
  const html = await fetchPage(`${BASE_URL}${pageUrl}`);
  if (!html) return [];

  const $ = cheerio.load(html);
  const videos = [];

  // Find video links on the listing page
  $('a[href*="/Video/Video/"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim() || $(el).attr("title") || "";
    const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

    if (href && title && title !== "View Video") {
      // Extract thumbnail from nearby img
      const img = $(el).find("img").first();
      const thumbnail = img.attr("src") || img.attr("data-src") || "";
      const fullThumb = thumbnail && !thumbnail.startsWith("http") ? `${BASE_URL}${thumbnail}` : thumbnail;

      videos.push({
        title,
        url: fullUrl,
        slug: href.split("/").pop() || "",
        thumbnail: fullThumb,
        section: pageUrl.split("/").pop() || "general",
      });
    }
  });

  return videos;
}

async function scrapeVideoPage(url) {
  const html = await fetchPage(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const title = $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") || "";
  const ogImage = $('meta[property="og:image"]').attr("content") || "";
  const description = $('meta[property="og:description"]').attr("content") || "";

  // Find embedded video
  let videoUrl = "";
  $("iframe").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src) videoUrl = src;
  });
  $("video source").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src) videoUrl = src;
  });

  // Get all text content
  let bodyText = "";
  $("p").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 30) bodyText += text + "\n\n";
  });

  return {
    title,
    description: description || bodyText.slice(0, 300),
    videoUrl,
    thumbnail: ogImage,
    sourceUrl: url,
  };
}

// ──────────────────────────────────────────────
// GALLERY PAGE SCRAPING
// ──────────────────────────────────────────────
async function scrapeGalleryListingPage(pageUrl) {
  const html = await fetchPage(`${BASE_URL}${pageUrl}`);
  if (!html) return [];

  const $ = cheerio.load(html);
  const galleries = [];

  $('a[href*="/Galleries/Gallery/"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const title = $(el).text().trim() || $(el).attr("title") || "";
    const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

    if (href && title && title !== "View Gallery") {
      const img = $(el).find("img").first();
      const cover = img.attr("src") || img.attr("data-src") || "";
      const fullCover = cover && !cover.startsWith("http") ? `${BASE_URL}${cover}` : cover;

      galleries.push({
        title,
        url: fullUrl,
        slug: href.split("/").pop() || "",
        coverImage: fullCover,
        section: pageUrl.split("/").pop() || "general",
      });
    }
  });

  // Deduplicate by URL
  const seen = new Set();
  return galleries.filter((g) => {
    if (seen.has(g.url)) return false;
    seen.add(g.url);
    return true;
  });
}

async function scrapeGalleryPage(url) {
  const html = await fetchPage(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const title = $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") || "";
  const ogImage = $('meta[property="og:image"]').attr("content") || "";

  const images = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    const alt = $(el).attr("alt") || "";
    if (src && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar") && !src.includes("widget") && !src.includes("placeholder")) {
      const fullUrl = src.startsWith("http") ? src : `${BASE_URL}${src}`;
      images.push({ url: fullUrl, alt });
    }
  });

  return {
    title,
    coverImage: ogImage,
    images,
    sourceUrl: url,
  };
}

// ──────────────────────────────────────────────
// MAIN ORCHESTRATOR
// ──────────────────────────────────────────────
async function main() {
  console.log("=== George Herald Content Scraper ===\n");
  await fs.ensureDir(OUTPUT_DIR);

  // ── 1. SCRAPE ALL ARTICLES FROM RSS FEEDS ──
  console.log("📰 Phase 1: Fetching articles from RSS feeds...\n");
  const allArticleLinks = new Map(); // url -> { section, category, rssData }

  for (const [sectionName, feeds] of Object.entries(RSS_FEEDS)) {
    for (const [category, feedPath] of Object.entries(feeds)) {
      const feedUrl = `${BASE_URL}${feedPath}`;
      console.log(`  Fetching ${sectionName}/${category}...`);
      const items = await parseRSSFeed(feedUrl);
      console.log(`    Found ${items.length} items`);

      for (const item of items) {
        if (item.link && !allArticleLinks.has(item.link)) {
          allArticleLinks.set(item.link, {
            section: sectionName,
            category,
            rssData: item,
          });
        }
      }
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n  Total unique articles from RSS: ${allArticleLinks.size}\n`);

  // ── 2. SCRAPE EACH ARTICLE PAGE ──
  console.log("📄 Phase 2: Scraping individual article pages...\n");
  const articles = [];
  let count = 0;

  for (const [url, meta] of allArticleLinks) {
    count++;
    console.log(`  [${count}/${allArticleLinks.size}] ${meta.rssData.title.slice(0, 60)}...`);

    const pageData = await scrapeArticlePage(url);
    if (pageData) {
      articles.push({
        ...meta.rssData,
        section: meta.section,
        category: meta.category,
        page: pageData,
      });
    }

    // Save progress every 50 articles
    if (count % 50 === 0) {
      await fs.writeJson(path.join(OUTPUT_DIR, "articles-partial.json"), articles, { spaces: 2 });
      console.log(`    (saved progress: ${articles.length} articles)`);
    }

    await sleep(DELAY_MS);
  }

  await fs.writeJson(path.join(OUTPUT_DIR, "articles.json"), articles, { spaces: 2 });
  console.log(`\n  ✅ Saved ${articles.length} articles\n`);

  // ── 3. SCRAPE VIDEOS ──
  console.log("🎬 Phase 3: Scraping videos...\n");
  const allVideoLinks = [];

  for (const pagePath of VIDEO_PAGES) {
    console.log(`  Listing ${pagePath}...`);
    const videoList = await scrapeVideoListingPage(pagePath);
    console.log(`    Found ${videoList.length} videos`);
    allVideoLinks.push(...videoList);
    await sleep(DELAY_MS);
  }

  // Deduplicate
  const uniqueVideos = new Map();
  for (const v of allVideoLinks) {
    if (!uniqueVideos.has(v.url)) uniqueVideos.set(v.url, v);
  }
  console.log(`  Total unique videos: ${uniqueVideos.size}\n`);

  const videos = [];
  count = 0;
  for (const [url, meta] of uniqueVideos) {
    count++;
    console.log(`  [${count}/${uniqueVideos.size}] ${meta.title.slice(0, 60)}...`);
    const pageData = await scrapeVideoPage(url);
    if (pageData) {
      videos.push({ ...meta, page: pageData });
    }
    await sleep(DELAY_MS);
  }

  await fs.writeJson(path.join(OUTPUT_DIR, "videos.json"), videos, { spaces: 2 });
  console.log(`\n  ✅ Saved ${videos.length} videos\n`);

  // ── 4. SCRAPE GALLERIES ──
  console.log("🖼️  Phase 4: Scraping galleries...\n");
  const allGalleryLinks = [];

  for (const pagePath of GALLERY_PAGES) {
    console.log(`  Listing ${pagePath}...`);
    const galleryList = await scrapeGalleryListingPage(pagePath);
    console.log(`    Found ${galleryList.length} galleries`);
    allGalleryLinks.push(...galleryList);
    await sleep(DELAY_MS);
  }

  const uniqueGalleries = new Map();
  for (const g of allGalleryLinks) {
    if (!uniqueGalleries.has(g.url)) uniqueGalleries.set(g.url, g);
  }
  console.log(`  Total unique galleries: ${uniqueGalleries.size}\n`);

  const galleries = [];
  count = 0;
  for (const [url, meta] of uniqueGalleries) {
    count++;
    console.log(`  [${count}/${uniqueGalleries.size}] ${meta.title.slice(0, 60)}...`);
    const pageData = await scrapeGalleryPage(url);
    if (pageData) {
      galleries.push({ ...meta, page: pageData });
    }
    await sleep(DELAY_MS);
  }

  await fs.writeJson(path.join(OUTPUT_DIR, "galleries.json"), galleries, { spaces: 2 });
  console.log(`\n  ✅ Saved ${galleries.length} galleries\n`);

  // ── 5. SUMMARY ──
  const summary = {
    scrapedAt: new Date().toISOString(),
    totalArticles: articles.length,
    totalVideos: videos.length,
    totalGalleries: galleries.length,
    sections: {},
  };

  for (const a of articles) {
    const key = `${a.section}/${a.category}`;
    summary.sections[key] = (summary.sections[key] || 0) + 1;
  }

  await fs.writeJson(path.join(OUTPUT_DIR, "summary.json"), summary, { spaces: 2 });

  console.log("=== SCRAPING COMPLETE ===");
  console.log(`  Articles: ${articles.length}`);
  console.log(`  Videos:   ${videos.length}`);
  console.log(`  Galleries: ${galleries.length}`);
  console.log(`\n  Data saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
