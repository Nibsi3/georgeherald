const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://www.georgeherald.com";
const OUTPUT_DIR = path.join(__dirname, "..", "scraped-data");
const DELAY_MS = 300;

// ══════════════════════════════════════════════
// PAGINATED CATEGORIES - uses POST to /Section/PagedListing
// Each entry: { endpoint, query1, section (for our data), label }
// ══════════════════════════════════════════════
const PAGINATED_CATEGORIES = [
  // News categories (Top-Stories omitted - it duplicates all other news categories)
  { endpoint: "/News/PagedListing", query1: "Local-News", section: "news", label: "Local News" },
  { endpoint: "/News/PagedListing", query1: "National", section: "news", label: "National" },
  { endpoint: "/News/PagedListing", query1: "Business", section: "news", label: "Business" },
  { endpoint: "/News/PagedListing", query1: "Crime", section: "news", label: "Crime" },
  { endpoint: "/News/PagedListing", query1: "General-News", section: "news", label: "General News" },
  { endpoint: "/News/PagedListing", query1: "Environment", section: "news", label: "Environment" },
  { endpoint: "/News/PagedListing", query1: "Agriculture", section: "news", label: "Agriculture" },
  { endpoint: "/News/PagedListing", query1: "Politics", section: "news", label: "Politics" },
  { endpoint: "/News/PagedListing", query1: "LifeStyle", section: "news", label: "Lifestyle" },
  { endpoint: "/News/PagedListing", query1: "Entertainment-News", section: "entertainment", label: "Entertainment News" },
  { endpoint: "/News/PagedListing", query1: "Property", section: "news", label: "Property" },
  { endpoint: "/News/PagedListing", query1: "Schools", section: "schools", label: "Schools" },
  { endpoint: "/News/PagedListing", query1: "Motoring", section: "news", label: "Motoring" },
  { endpoint: "/News/PagedListing", query1: "Elections", section: "news", label: "Elections" },
  // Sport categories
  { endpoint: "/Sport/PagedListing", query1: "Rugby", section: "sport", label: "Rugby" },
  { endpoint: "/Sport/PagedListing", query1: "Cricket", section: "sport", label: "Cricket" },
  { endpoint: "/Sport/PagedListing", query1: "Football", section: "sport", label: "Football" },
  { endpoint: "/Sport/PagedListing", query1: "Golf", section: "sport", label: "Golf" },
  { endpoint: "/Sport/PagedListing", query1: "Tennis", section: "sport", label: "Tennis" },
  { endpoint: "/Sport/PagedListing", query1: "Athletics", section: "sport", label: "Athletics" },
  { endpoint: "/Sport/PagedListing", query1: "Other", section: "sport", label: "Other Sport" },
  // Entertainment
  { endpoint: "/Entertainment/PagedListing", query1: "", section: "entertainment", label: "Entertainment" },
  // Opinion / Letters
  { endpoint: "/Opinion/PagedListing", query1: "", section: "opinion", label: "Opinion" },
  { endpoint: "/Letters/PagedListing", query1: "", section: "opinion", label: "Letters" },
  // Schools
  { endpoint: "/News/PagedListing", query1: "Academic", section: "schools", label: "Academic" },
  { endpoint: "/News/PagedListing", query1: "Culture", section: "schools", label: "Culture" },
  // Community
  { endpoint: "/MunicipalNotices/PagedListing", query1: "", section: "community", label: "Municipal Notices" },
  { endpoint: "/Community/PagedListing", query1: "We-Care", section: "community", label: "We Care" },
  { endpoint: "/Community/PagedListing", query1: "Heritage", section: "community", label: "Heritage" },
  // Tourism
  { endpoint: "/News/PagedListing", query1: "Tourism", section: "tourism", label: "Tourism" },
];

// Fallback: static listing pages (for sections without PagedListing)
const ARTICLE_LISTING_PAGES = [
  "/News/Top-Stories",
  "/Entertainment",
  "/Letters",
  "/Opinion/Latest",
  "/Schools/Sport",
  "/Schools/Academic",
  "/Schools/Culture",
  "/Community/We-Care",
  "/Community/Heritage",
];

const VIDEO_LISTING_PAGES = [
  "/Video/LatestVideos",
  "/Video/News",
  "/Video/Sport",
  "/Video/Business",
  "/Video/Entertainment",
];

const GALLERY_LISTING_PAGES = [
  "/Galleries/General",
  "/Galleries/News",
  "/Galleries/Schools",
  "/Galleries/Special-Events",
  "/Galleries/Sport",
];

// RSS feeds for additional article discovery
const RSS_FEEDS = [
  "/RSS/ArticleFeed/TopStories",
  "/RSS/ArticleFeed/News",
  "/RSS/ArticleFeed/Local%20News",
  "/RSS/ArticleFeed/Business",
  "/RSS/ArticleFeed/Property",
  "/RSS/ArticleFeed/Agriculture",
  "/RSS/ArticleFeed/LifeStyle",
  "/RSS/ArticleFeed/National%20News",
  "/RSS/ArticleFeed/Motoring",
  "/RSS/ArticleFeed/Politics",
  "/RSS/ArticleFeed/Elections",
  "/RSS/ArticleFeed/Entertainment",
  "/RSS/ArticleFeed/General%20News",
  "/RSS/ArticleFeed/Schools",
  "/RSS/ArticleFeed/Sport",
  "/RSS/ArticleFeed/Latest%20Sport",
  "/RSS/ArticleFeed/Rugby",
  "/RSS/ArticleFeed/Cricket",
  "/RSS/ArticleFeed/Football",
  "/RSS/ArticleFeed/Golf",
  "/RSS/ArticleFeed/Tennis",
  "/RSS/ArticleFeed/Athletics",
  "/RSS/ArticleFeed/Other",
  "/RSS/ArticleFeed/Entertainment%20News",
  "/RSS/ArticleFeed/Lifestyle",
  "/RSS/ArticleFeed/Loadshedding",
  "/RSS/ArticleFeed/International",
  "/RSS/ArticleFeed/In%20The%20Newspaper",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, {
        headers: {
          "User-Agent": "GeorgeHeraldRedesign/2.0 (content migration)",
          "Accept": "text/html,application/xhtml+xml",
        },
        timeout: 20000,
      });
      return res.data;
    } catch (err) {
      if (attempt < retries) {
        await sleep(2000);
        continue;
      }
      console.error(`  Failed to fetch ${url}: ${err.message}`);
      return null;
    }
  }
}

// Extract date from article URL suffix (e.g. -202602060855 -> 2026)
function getYearFromUrl(url) {
  const match = url.match(/-(\d{4})(\d{2})(\d{2})\d{4}$/);
  if (match) return parseInt(match[1]);
  return null;
}

function getDateFromUrl(url) {
  const match = url.match(/-(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (match) {
    return new Date(
      parseInt(match[1]),
      parseInt(match[2]) - 1,
      parseInt(match[3]),
      parseInt(match[4]),
      parseInt(match[5])
    ).toISOString();
  }
  return null;
}

function extractCategoryFromUrl(url) {
  // /News/Article/Local-News/slug -> Local-News
  // /Sport/Article/Rugby/slug -> Rugby
  const match = url.match(/\/Article\/([^/]+)\//);
  if (match) return match[1].replace(/-/g, " ").toLowerCase().replace(/\s+/g, "-");
  return "general";
}

function extractSectionFromUrl(url) {
  if (url.includes("/Sport/")) return "sport";
  if (url.includes("/Opinion/") || url.includes("/Letters")) return "opinion";
  if (url.includes("/Schools/")) return "schools";
  if (url.includes("/Community/") || url.includes("/Municipal")) return "community";
  if (url.includes("/Tourism/")) return "tourism";
  if (url.includes("/Entertainment")) return "entertainment";
  return "news";
}

// Extract article links from RSS XML
function extractLinksFromRss(xml) {
  const links = new Set();
  const regex = /<link>(https?:\/\/www\.georgeherald\.com\/[^<]*Article[^<]*)<\/link>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    links.add(match[1]);
  }
  return Array.from(links);
}

// ──────────────────────────────────────────────
// PAGINATED LISTING via POST (the core discovery mechanism)
// ──────────────────────────────────────────────
async function scrapePagedListing(cat) {
  const links = new Set();
  let consecutiveOld = 0;
  const maxPages = 200; // cap: 200 pages × 15 items = 3000 articles max per category

  for (let page = 1; page <= maxPages; page++) {
    try {
      const params = new URLSearchParams();
      params.append("query1", cat.query1);
      params.append("query2", "");
      params.append("page", page.toString());

      const res = await axios.post(BASE_URL + cat.endpoint, params.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
        },
        timeout: 20000,
      });

      const $ = cheerio.load(res.data);
      const pageLinks = [];
      $('a[href*="/Article/"]').each((_, el) => {
        const href = $(el).attr("href");
        if (href) {
          const full = href.startsWith("http") ? href : BASE_URL + href;
          if (full.includes("georgeherald.com") && !links.has(full)) {
            pageLinks.push(full);
          }
        }
      });

      if (pageLinks.length === 0) break;

      // Check years - stop when we're consistently past 2024
      let oldCount = 0;
      for (const link of pageLinks) {
        links.add(link);
        const year = getYearFromUrl(link);
        if (year && year < 2024) oldCount++;
      }

      // If ALL articles on this page are pre-2024, increment counter
      if (oldCount === pageLinks.length) {
        consecutiveOld++;
        if (consecutiveOld >= 2) {
          // Two consecutive pages of only old articles - done with this category
          break;
        }
      } else {
        consecutiveOld = 0;
      }

      if (page % 20 === 0) {
        process.stdout.write(`    p${page}:${links.size} `);
      }
      await sleep(200);
    } catch (err) {
      // 404 or other error - try once more then stop
      if (err.response?.status === 404) break;
      await sleep(1000);
      continue;
    }
  }
  return links;
}

// Extract ALL article links from any page HTML
function extractArticleLinksFromHtml(html) {
  const $ = cheerio.load(html);
  const links = new Set();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/Article/')) {
      const fullHref = href.startsWith('http') ? href : BASE_URL + href;
      if (fullHref.includes('georgeherald.com')) {
        links.add(decodeURIComponent(fullHref));
      }
    }
  });
  return Array.from(links);
}

// ──────────────────────────────────────────────
// SCRAPE LISTING PAGES FOR ARTICLE LINKS
// ──────────────────────────────────────────────
async function scrapeListingPage(listingUrl, maxPages = 5) {
  const links = new Set();

  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = page === 1 ? listingUrl : `${listingUrl}?page=${page}`;
    const fullUrl = BASE_URL + pageUrl;
    console.log(`  Scraping listing: ${pageUrl}`);
    const html = await fetchPage(fullUrl);
    if (!html) break;

    const $ = cheerio.load(html);
    const prevSize = links.size;

    // Find all article links - these match /News/Article/* or /Sport/Article/*
    $('a[href*="/Article/"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        const fullHref = href.startsWith("http") ? href : BASE_URL + href;
        // Only include georgeherald.com article links
        if (fullHref.includes("georgeherald.com") && fullHref.includes("/Article/")) {
          links.add(fullHref);
        }
      }
    });

    const newLinks = links.size - prevSize;
    console.log(`    Page ${page}: +${newLinks} links (total: ${links.size})`);

    // Stop if no new links found on this page (no more pages)
    if (newLinks === 0) break;
    await sleep(DELAY_MS);
  }

  return Array.from(links);
}

async function scrapeVideoListingPage(listingUrl) {
  const fullUrl = BASE_URL + listingUrl;
  console.log(`  Scraping video listing: ${listingUrl}`);
  const html = await fetchPage(fullUrl);
  if (!html) return [];

  const $ = cheerio.load(html);
  const videos = [];

  $('a[href*="/Video/"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("/Video/") && !href.endsWith("/Video/LatestVideos") &&
        !href.endsWith("/Video/News") && !href.endsWith("/Video/Sport") &&
        !href.endsWith("/Video/Business") && !href.endsWith("/Video/Entertainment") &&
        !href.endsWith("/Video/Lifestyle") && href !== listingUrl) {
      const fullHref = href.startsWith("http") ? href : BASE_URL + href;
      const title = $(el).text().trim() ||
        $(el).find("img").attr("alt") || "";
      const thumbnail = $(el).find("img").attr("src") || "";
      if (title && title.length > 3) {
        videos.push({
          url: fullHref,
          title,
          thumbnail: thumbnail.startsWith("http") ? thumbnail : (thumbnail ? BASE_URL + thumbnail : ""),
          slug: fullHref.split("/").pop() || "",
          section: listingUrl.split("/").pop()?.toLowerCase() || "news",
        });
      }
    }
  });

  return videos;
}

async function scrapeGalleryListingPage(listingUrl) {
  const fullUrl = BASE_URL + listingUrl;
  console.log(`  Scraping gallery listing: ${listingUrl}`);
  const html = await fetchPage(fullUrl);
  if (!html) return [];

  const $ = cheerio.load(html);
  const galleries = [];

  $('a[href*="/Galleries/"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("/Galleries/") && href !== listingUrl &&
        !GALLERY_LISTING_PAGES.some(p => href.endsWith(p))) {
      const fullHref = href.startsWith("http") ? href : BASE_URL + href;
      const title = $(el).text().trim() ||
        $(el).find("img").attr("alt") || "";
      const coverImage = $(el).find("img").attr("src") || "";
      if (title && title.length > 3) {
        galleries.push({
          url: fullHref,
          title,
          coverImage: coverImage.startsWith("http") ? coverImage : (coverImage ? BASE_URL + coverImage : ""),
          slug: fullHref.split("/").pop() || "",
          section: listingUrl.split("/").pop()?.toLowerCase() || "general",
        });
      }
    }
  });

  return galleries;
}

// ──────────────────────────────────────────────
// SCRAPE INDIVIDUAL ARTICLE
// ──────────────────────────────────────────────
// Version that takes pre-fetched HTML (for spider approach)
async function scrapeArticleFromHtml(html, url) {
  if (!html) return null;
  const $ = cheerio.load(html);
  return parseArticleFromCheerio($, url);
}

async function scrapeArticlePage(url) {
  const html = await fetchPage(url);
  if (!html) return null;
  const $ = cheerio.load(html);
  return parseArticleFromCheerio($, url);
}

function parseArticleFromCheerio($, url) {

  // Title: use og:title first, then try page structure
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  const ogImage = $('meta[property="og:image"]').attr("content") || "";
  const ogDesc = $('meta[property="og:description"]').attr("content") || "";

  // Find article title from the page - it's usually in col-lg-24 before the body
  let title = ogTitle;
  if (!title || title.length < 5 || title === "George Herald") {
    // Try finding the largest bold/heading text in the article area
    $(".col-lg-24 h2, .col-lg-24 h3, .col-lg-24 strong").each((_, el) => {
      const t = $(el).text().trim();
      if (t.length > 10 && t.length < 200 && !title) {
        title = t;
      }
    });
  }

  // Get article body HTML - preserve structure (p, blockquote, h2, h3, strong, em, a)
  let bodyHtml = "";
  let bodyText = "";
  const articleSelectors = [
    ".article-content-wrapper",
    ".article-body",
    ".article-content",
    '[itemprop="articleBody"]',
    ".ArticleBody",
    ".story-body",
    ".article_body",
  ];

  let contentEl = null;
  for (const sel of articleSelectors) {
    const el = $(sel);
    if (el.length && el.text().trim().length > 50) {
      contentEl = el;
      break;
    }
  }

  // Fallback: main article column
  if (!contentEl) {
    const mainCol = $(".col-lg-24").first();
    if (mainCol.length) {
      contentEl = mainCol.clone();
      contentEl.find("script, style, nav, .ad, .sidebar, .weatherblock, .NewsScroller, .ticker, .breakingNews").remove();
    }
  }

  if (contentEl) {
    // Remove unwanted elements from content
    contentEl.find("script, style, .article_link_chain, .text-align:last-child").remove();
    
    // Extract structured content as array of blocks
    const blocks = [];
    contentEl.children().each((_, child) => {
      const tag = child.tagName?.toLowerCase();
      const el = $(child);
      const text = el.text().trim();
      if (!text || text.length < 2) return;
      
      // Skip "Update" label, "Read more about:" suffix, and social media cruft
      if (text === "Update" || text.startsWith("Read more about:")) return;
      if (text.startsWith("'We bring you the latest")) return;
      
      if (tag === "h2" || tag === "h3" || tag === "h4") {
        blocks.push({ type: "heading", text, level: tag });
      } else if (tag === "blockquote") {
        // Get inner text from blockquote (may contain <p> inside)
        const bqText = el.find("p").length ? el.find("p").text().trim() : text;
        blocks.push({ type: "blockquote", text: bqText });
      } else if (tag === "ul" || tag === "ol") {
        const items = [];
        el.find("li").each((_, li) => {
          const liText = $(li).text().trim();
          if (liText) items.push(liText);
        });
        if (items.length) blocks.push({ type: "list", items, ordered: tag === "ol" });
      } else if (tag === "div" && el.hasClass("article_link_chain")) {
        // Related article links - skip
      } else {
        // Paragraph: preserve inline links and formatting
        let html = el.html() || "";
        // Clean the HTML: keep only safe tags
        html = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/&nbsp;/g, " ")
          .trim();
        if (html) blocks.push({ type: "paragraph", text, html });
      }
    });

    // Build bodyHtml from blocks
    bodyHtml = JSON.stringify(blocks);
    bodyText = blocks.map(b => {
      if (b.type === "heading") return "\n## " + b.text + "\n";
      if (b.type === "blockquote") return "\n> " + b.text + "\n";
      if (b.type === "list") return b.items.map(i => "- " + i).join("\n");
      return b.text;
    }).join("\n\n");
  }

  // Get images - ONLY from CMS, exclude sidebar/ads/matchmaker/logos
  const images = [];
  const badImagePatterns = [
    "SideBar", "sidebar", "logo", "Logo", "weather", "Weather",
    "WinnersBanners", "Press%20Reader", "Press Reader", "paper-logo",
    "online-platforms", "edenmatchmaker", "google", "favicon",
    "Loader", "arrow-fb", "placeholder", "copyrightbar",
    "georgeherald.com/images/", "digitalplatforms", "localnewsnetwork",
    "twitterx.png", "facebook.png", "Youtube.png", "Instagram.png",
    "tiktok.png", "whatsapp.png", "rss.png",
  ];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    const alt = $(el).attr("alt") || "";
    if (!src) return;
    const fullSrc = src.startsWith("http") ? src : BASE_URL + src;
    // Skip bad images
    const isBad = badImagePatterns.some((p) => fullSrc.includes(p) || alt.includes(p));
    if (isBad) return;
    // Skip tiny tracking pixels
    const w = parseInt($(el).attr("width") || "999");
    const h = parseInt($(el).attr("height") || "999");
    if (w < 10 || h < 10) return;
    images.push({ url: fullSrc, alt });
  });

  // Author - try specific selectors, then parse from bodyText
  let author = "";
  const authorSelectors = [".author-name", ".article-author", '[rel="author"]', ".byline"];
  for (const sel of authorSelectors) {
    const el = $(sel);
    if (el.length) {
      author = el.text().trim();
      break;
    }
  }
  if (!author && bodyText) {
    const match = bodyText.match(/Journalist\s+([A-Za-z\u00C0-\u00FF\s]+?)(?:\n|$)/);
    if (match) author = match[1].trim();
  }

  // Tags
  const tags = [];
  $('meta[name="keywords"]').each((_, el) => {
    const content = $(el).attr("content") || "";
    content.split(",").forEach((t) => {
      const tag = t.trim();
      if (tag && tag.length < 50) tags.push(tag);
    });
  });
  $(".article-tags a, .tags a, .tag-list a").each((_, el) => {
    const tag = $(el).text().trim();
    if (tag) tags.push(tag);
  });

  // Gallery link
  const galleryLink = $('a[href*="/Galleries/"]').first().attr("href") || "";

  // Video URLs
  const videoUrls = [];
  $("iframe").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src && (src.includes("youtube") || src.includes("vimeo") || src.includes("facebook"))) {
      videoUrls.push(src);
    }
  });

  return {
    title,
    ogImage,
    ogDescription: ogDesc,
    bodyText,
    bodyHtml,
    images,
    author,
    tags: [...new Set(tags)],
    galleryLink,
    videoUrls,
    sourceUrl: url,
  };
}

// Scrape video detail page
async function scrapeVideoPage(url) {
  const html = await fetchPage(url);
  if (!html) return null;
  const $ = cheerio.load(html);

  const description = $('meta[property="og:description"]').attr("content") || $("p").first().text().trim() || "";
  const thumbnail = $('meta[property="og:image"]').attr("content") || "";
  let videoUrl = "";
  $("iframe").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src && (src.includes("youtube") || src.includes("vimeo") || src.includes("facebook"))) {
      videoUrl = src;
    }
  });

  return { description, thumbnail, videoUrl };
}

// Scrape gallery detail page
async function scrapeGalleryPage(url) {
  const html = await fetchPage(url);
  if (!html) return null;
  const $ = cheerio.load(html);

  const description = $('meta[property="og:description"]').attr("content") || "";
  const images = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    const alt = $(el).attr("alt") || "";
    if (src) {
      const fullSrc = src.startsWith("http") ? src : BASE_URL + src;
      images.push({ url: fullSrc, alt });
    }
  });

  return { description, images };
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
  console.log("=== George Herald COMPREHENSIVE Scraper (2024-2026) ===");
  console.log(`  ${PAGINATED_CATEGORIES.length} paginated categories (POST API)`);
  console.log(`  ${ARTICLE_LISTING_PAGES.length} fallback listing pages`);
  console.log(`  ${RSS_FEEDS.length} RSS feeds`);
  console.log(`  ${VIDEO_LISTING_PAGES.length} video listing pages`);
  console.log(`  ${GALLERY_LISTING_PAGES.length} gallery listing pages\n`);
  await fs.ensureDir(OUTPUT_DIR);

  const articleLinkMap = new Map(); // url -> Set of sources

  // ════════════════════════════════════════════
  // PHASE 1: Paginated category crawl (POST API)
  // This is the primary discovery mechanism - crawls every page
  // of every category until articles are older than 2024
  // ════════════════════════════════════════════
  console.log("PHASE 1: Crawling ALL paginated categories via POST API...\n");
  for (const cat of PAGINATED_CATEGORIES) {
    process.stdout.write(`  ${cat.label}: `);
    const links = await scrapePagedListing(cat);
    let added = 0;
    for (const link of links) {
      const decoded = decodeURIComponent(link);
      if (!articleLinkMap.has(decoded)) {
        articleLinkMap.set(decoded, new Set());
        added++;
      }
      articleLinkMap.get(decoded).add(cat.label);
    }
    console.log(`${links.size} found, ${added} new (total: ${articleLinkMap.size})`);
  }
  console.log(`\n  After paginated crawl: ${articleLinkMap.size} unique links\n`);

  // ════════════════════════════════════════════
  // PHASE 1b: Fallback listing pages (first page only)
  // ════════════════════════════════════════════
  console.log("PHASE 1b: Scraping fallback listing pages...\n");
  for (const page of ARTICLE_LISTING_PAGES) {
    const links = await scrapeListingPage(page, 1);
    links.forEach((l) => {
      const decoded = decodeURIComponent(l);
      if (!articleLinkMap.has(decoded)) articleLinkMap.set(decoded, new Set());
      articleLinkMap.get(decoded).add(page);
    });
    await sleep(DELAY_MS);
  }
  console.log(`  After fallback pages: ${articleLinkMap.size} unique links\n`);

  // ════════════════════════════════════════════
  // PHASE 2: RSS feeds for additional discovery
  // ════════════════════════════════════════════
  console.log("PHASE 2: Scraping RSS feeds...\n");
  for (const feed of RSS_FEEDS) {
    const fullUrl = BASE_URL + feed;
    try {
      const res = await axios.get(fullUrl, {
        headers: { "User-Agent": "GeorgeHeraldRedesign/2.0 (content migration)" },
        timeout: 20000,
      });
      const rssLinks = extractLinksFromRss(res.data);
      let added = 0;
      rssLinks.forEach((l) => {
        const decoded = decodeURIComponent(l);
        if (!articleLinkMap.has(decoded)) { articleLinkMap.set(decoded, new Set()); added++; }
        articleLinkMap.get(decoded).add("RSS:" + feed);
      });
      if (added > 0) console.log(`  RSS ${feed}: +${added} new`);
    } catch (err) {
      // silently skip failed RSS feeds
    }
    await sleep(200);
  }
  console.log(`  After RSS feeds: ${articleLinkMap.size} unique links\n`);

  // ════════════════════════════════════════════
  // PHASE 3: Filter to 2024-2026
  // ════════════════════════════════════════════
  let targetLinks = [];
  let excluded = 0;
  for (const link of articleLinkMap.keys()) {
    const year = getYearFromUrl(link);
    if (year && year >= 2024 && year <= 2026) {
      targetLinks.push(link);
    } else if (!year) {
      targetLinks.push(link);
    } else {
      excluded++;
    }
  }
  console.log(`  Target articles (2024-2026): ${targetLinks.length}`);
  console.log(`  Excluded (older): ${excluded}\n`);

  // ════════════════════════════════════════════
  // PHASE 4: Scrape each article + spider for more links
  // ════════════════════════════════════════════
  console.log("PHASE 4: Scraping article pages + discovering linked articles...\n");
  const articles = [];
  const scrapedUrls = new Set();
  let failed = 0;
  let spiderDiscovered = 0;

  // Process in rounds - first round is the known links,
  // subsequent rounds are newly discovered links from article pages
  let round = 1;
  let linksToProcess = [...targetLinks];

  while (linksToProcess.length > 0) {
    console.log(`  Round ${round}: ${linksToProcess.length} articles to scrape`);
    const nextRoundLinks = [];

    // Process in batches of 5 (conservative for reliability)
    const batchSize = 5;
    for (let i = 0; i < linksToProcess.length; i += batchSize) {
      const batch = linksToProcess.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (link) => {
          if (scrapedUrls.has(link)) return { link, pageData: null, newLinks: [] };
          scrapedUrls.add(link);
          const html = await fetchPage(link);
          if (!html) return { link, pageData: null, newLinks: [] };
          
          // Extract article data from HTML
          const pageData = await scrapeArticleFromHtml(html, link);
          
          // Spider: find more article links from this page
          const discoveredLinks = extractArticleLinksFromHtml(html);
          const newLinks = discoveredLinks.filter(l => {
            const decoded = decodeURIComponent(l);
            const year = getYearFromUrl(decoded);
            return !scrapedUrls.has(decoded) && 
                   !articleLinkMap.has(decoded) &&
                   year && year >= 2024 && year <= 2026;
          });
          
          await sleep(DELAY_MS);
          return { link, pageData, newLinks };
        })
      );

      for (const { link, pageData, newLinks } of results) {
        if (pageData) {
          const section = extractSectionFromUrl(link);
          const category = extractCategoryFromUrl(link);
          const dateStr = getDateFromUrl(link);
          const slug = link.split("/").pop() || "";

          let articleTitle = pageData.title || "";
          if (!articleTitle || articleTitle.length < 5 || articleTitle === "George Herald") {
            articleTitle = slug.replace(/-\d{12}$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          }

          const sourceLists = articleLinkMap.get(link) || new Set();
          const isTopStory = sourceLists.has("/News/Top-Stories") || sourceLists.has("RSS:/RSS/ArticleFeed/TopStories");

          articles.push({
            guid: link,
            link,
            title: articleTitle,
            description: pageData.ogDescription || "",
            updated: dateStr || new Date().toISOString(),
            section,
            category,
            isTopStory,
            page: pageData,
          });
        } else if (!pageData && !scrapedUrls.has(link + "_skip")) {
          failed++;
        }

        // Queue newly discovered links
        for (const nl of newLinks) {
          const decoded = decodeURIComponent(nl);
          if (!scrapedUrls.has(decoded)) {
            nextRoundLinks.push(decoded);
            articleLinkMap.set(decoded, new Set(["spidered"]));
            spiderDiscovered++;
          }
        }
      }

      // Progress logging
      const total = scrapedUrls.size;
      if (total % 25 === 0) {
        console.log(`    Scraped: ${total} | Articles: ${articles.length} | Discovered: ${spiderDiscovered} | Failed: ${failed}`);
      }
    }

    // Deduplicate next round
    linksToProcess = [...new Set(nextRoundLinks)].filter(l => !scrapedUrls.has(l));
    round++;
    
    // Safety: cap at 5 spider rounds
    if (round > 5) {
      console.log(`  Stopping after 5 spider rounds`);
      break;
    }
  }

  console.log(`\n  TOTAL Scraped: ${articles.length} articles (${failed} failed)`);
  console.log(`  Spider discovered: ${spiderDiscovered} additional articles\n`);

  // Fix titles
  for (const a of articles) {
    if (!a.title || a.title.length < 5) {
      const slug = a.link.split("/").pop() || "";
      a.title = slug.replace(/-\d{12}$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  // ════════════════════════════════════════════
  // PHASE 5: Scrape videos
  // ════════════════════════════════════════════
  console.log("PHASE 5: Scraping videos...\n");
  let allVideos = [];
  for (const page of VIDEO_LISTING_PAGES) {
    const vids = await scrapeVideoListingPage(page);
    allVideos.push(...vids);
    await sleep(DELAY_MS);
  }
  const videoMap = new Map();
  for (const v of allVideos) { videoMap.set(v.url, v); }
  allVideos = Array.from(videoMap.values());

  console.log(`  Found ${allVideos.length} unique videos, scraping detail pages...`);
  for (let i = 0; i < allVideos.length; i++) {
    const v = allVideos[i];
    const page = await scrapeVideoPage(v.url);
    if (page) allVideos[i].page = page;
    await sleep(DELAY_MS);
    if ((i + 1) % 20 === 0) console.log(`    [${i + 1}/${allVideos.length}]`);
  }

  // ════════════════════════════════════════════
  // PHASE 6: Scrape galleries
  // ════════════════════════════════════════════
  console.log("\nPHASE 6: Scraping galleries...\n");
  let allGalleries = [];
  for (const page of GALLERY_LISTING_PAGES) {
    const gals = await scrapeGalleryListingPage(page);
    allGalleries.push(...gals);
    await sleep(DELAY_MS);
  }
  const galMap = new Map();
  for (const g of allGalleries) { galMap.set(g.url, g); }
  allGalleries = Array.from(galMap.values());

  console.log(`  Found ${allGalleries.length} unique galleries, scraping detail pages...`);
  for (let i = 0; i < allGalleries.length; i++) {
    const g = allGalleries[i];
    const page = await scrapeGalleryPage(g.url);
    if (page) allGalleries[i].page = page;
    await sleep(DELAY_MS);
    if ((i + 1) % 20 === 0) console.log(`    [${i + 1}/${allGalleries.length}]`);
  }

  // ════════════════════════════════════════════
  // SAVE
  // ════════════════════════════════════════════
  console.log("\nSaving data...\n");
  await fs.writeJson(path.join(OUTPUT_DIR, "articles.json"), articles, { spaces: 2 });
  await fs.writeJson(path.join(OUTPUT_DIR, "videos.json"), allVideos, { spaces: 2 });
  await fs.writeJson(path.join(OUTPUT_DIR, "galleries.json"), allGalleries, { spaces: 2 });

  const summary = {
    scrapedAt: new Date().toISOString(),
    totalArticles: articles.length,
    totalVideos: allVideos.length,
    totalGalleries: allGalleries.length,
    yearBreakdown: {},
    categoryBreakdown: {},
    sectionBreakdown: {},
  };
  for (const a of articles) {
    const year = getYearFromUrl(a.link) || "unknown";
    summary.yearBreakdown[year] = (summary.yearBreakdown[year] || 0) + 1;
    summary.categoryBreakdown[a.category] = (summary.categoryBreakdown[a.category] || 0) + 1;
    summary.sectionBreakdown[a.section] = (summary.sectionBreakdown[a.section] || 0) + 1;
  }
  await fs.writeJson(path.join(OUTPUT_DIR, "summary.json"), summary, { spaces: 2 });

  console.log("\n╔══════════════════════════════════════╗");
  console.log("║   FULL SCRAPE COMPLETE               ║");
  console.log("╠══════════════════════════════════════╣");
  console.log(`║  Articles: ${String(articles.length).padStart(6)}                   ║`);
  console.log(`║  Videos:   ${String(allVideos.length).padStart(6)}                   ║`);
  console.log(`║  Galleries:${String(allGalleries.length).padStart(6)}                   ║`);
  console.log("╠══════════════════════════════════════╣");
  console.log("║  Year breakdown:                     ║");
  for (const [year, count] of Object.entries(summary.yearBreakdown).sort()) {
    console.log(`║    ${year}: ${String(count).padStart(6)}                       ║`);
  }
  console.log("╠══════════════════════════════════════╣");
  console.log("║  Section breakdown:                  ║");
  for (const [sec, count] of Object.entries(summary.sectionBreakdown).sort()) {
    console.log(`║    ${sec.padEnd(15)}: ${String(count).padStart(5)}              ║`);
  }
  console.log("╠══════════════════════════════════════╣");
  console.log("║  Category breakdown:                 ║");
  for (const [cat, count] of Object.entries(summary.categoryBreakdown).sort()) {
    console.log(`║    ${cat.padEnd(20)}: ${String(count).padStart(4)}         ║`);
  }
  console.log("╚══════════════════════════════════════╝");
}

main().catch(console.error);
