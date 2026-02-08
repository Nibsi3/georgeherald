/**
 * Re-scrape existing articles to fix:
 * 1. Image captions (fr-inner spans)
 * 2. Blockquotes / bold intro text
 * 3. Teaser / subtitle extraction
 * 4. Contributor + date metadata
 * 5. Filter fake video URLs (YouTube channel links, not actual embeds)
 * 6. Better image filtering (remove sidebar/logo/footer images)
 * 7. Featured image captions from wrapper-article
 */
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const FRONTEND_DATA = path.join(__dirname, "..", "frontend", "src", "data");
const ARTICLES_FILE = path.join(FRONTEND_DATA, "articles.json");
const ARTICLES_DIR = path.join(FRONTEND_DATA, "articles");
const DELAY_MS = 350;
const BATCH_SIZE = 50; // process in batches

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        timeout: 25000,
      });
      return res.data;
    } catch (err) {
      if (attempt < retries) { await sleep(2000); continue; }
      return null;
    }
  }
}

// Bad image patterns — aggressively filter non-article images
const BAD_IMG_PATTERNS = [
  "sidebar", "logo", "weather", "winnersbanners", "edenmatchmaker",
  "google", "favicon", "placeholder", "copyrightbar", "digitalplatforms",
  "followus", "localnewsnetwork", "footer", "twitterx", "facebook.png",
  "youtube.png", "instagram.png", "tiktok.png", "whatsapp.png", "rss.png",
  "press%20reader", "press reader", "paper-logo", "online-platforms",
  "sidebar-news", "sidebar-emergy", "laptop", "local%20events",
  "local%20sport", "george.jpg", "george_herald.jpg",
  "/images/SideBar/", "/images/weather/", "/images/WinnersBanners/",
  "footerLogos", "GH_footerLogos",
];

function isBadImage(url, alt) {
  const u = (url || "").toLowerCase();
  const a = (alt || "").toLowerCase();
  if (!u.includes("cms.groupeditors.com")) return true;
  return BAD_IMG_PATTERNS.some(p => u.includes(p.toLowerCase()) || a.includes(p.toLowerCase()));
}

// Only real embeddable video URLs (not channel links)
function isValidVideoEmbed(src) {
  if (!src) return false;
  // Must be youtube.com/embed/ or youtu.be/ or vimeo.com/video/
  if (src.includes("youtube.com/embed/")) return true;
  if (src.includes("youtube-nocookie.com/embed/")) return true;
  if (src.includes("youtu.be/")) return true;
  if (src.includes("vimeo.com/video/")) return true;
  if (src.includes("player.vimeo.com")) return true;
  // Reject channel links, playlist pages, etc.
  return false;
}

function parseArticleImproved($, url) {
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  const ogImage = $('meta[property="og:image"]').attr("content") || "";
  const ogDesc = $('meta[property="og:description"]').attr("content") || "";

  let title = ogTitle;
  if (!title || title.length < 5) {
    $(".col-lg-24 h2, .col-lg-24 h3").each((_, el) => {
      const t = $(el).text().trim();
      if (t.length > 10 && t.length < 200 && !title) title = t;
    });
  }

  // --- Extract teaser (subtitle) ---
  let teaser = "";
  $(".teaser_container").each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 10) teaser = t;
  });

  // --- Extract contributor + date ---
  let contributor = "";
  let pubDate = "";
  $(".row").each((_, el) => {
    const text = $(el).text().trim();
    if (text.startsWith("Contributor") || text.startsWith("Journalist")) {
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      // First line is "Contributor" or "Journalist", second is the name
      if (lines.length >= 2) contributor = lines[1];
      // Look for date pattern
      const dateMatch = text.match(/\w+day,\s+\d{1,2}\s+\w+\s+\d{4},?\s+\d{1,2}:\d{2}/);
      if (dateMatch) pubDate = dateMatch[0];
    }
  });

  // --- Extract featured image caption from wrapper-article ---
  let featuredCaption = "";
  $(".wrapper-article").each((_, el) => {
    const text = $(el).text().trim();
    // The wrapper contains the caption text (not the title)
    if (text.length > 10 && text.length < 500) featuredCaption = text;
  });

  // --- Find the article content wrapper ---
  const acw = $(".article-content-wrapper").first();
  if (!acw.length) {
    // fallback to col-lg-24
  }

  const blocks = [];
  let bodyText = "";
  const contentEl = acw.length ? acw : $(".col-lg-24").first();

  // Boilerplate patterns to skip
  const boilerplate = [
    "we bring you the latest garden route",
    "read more about:",
    "click here to follow us on whatsapp",
    "'we bring you the latest",
  ];

  if (contentEl.length) {
    contentEl.find("script, style, .article_link_chain").remove();
    
    contentEl.children().each((_, child) => {
      const tag = child.tagName?.toLowerCase();
      const el = $(child);
      const text = el.text().trim();
      if (!text || text.length < 2) return;
      if (text === "Update" || text === "Read more") return;
      
      // Skip boilerplate
      const lower = text.toLowerCase();
      if (boilerplate.some(bp => lower.startsWith(bp) || lower.includes(bp))) return;

      // Headings
      if (tag === "h2" || tag === "h3" || tag === "h4") {
        blocks.push({ type: "heading", text, level: tag });
        return;
      }

      // Blockquotes → these are bold intro text or pull quotes
      if (tag === "blockquote") {
        blocks.push({ type: "blockquote", text });
        return;
      }

      // Check for inline images with captions (fr-img-wrap)
      const frImgWrap = el.find(".fr-img-wrap, span.fr-img-wrap");
      if (frImgWrap.length) {
        frImgWrap.each((_, wrap) => {
          const img = $(wrap).find("img");
          const captionEl = $(wrap).find(".fr-inner");
          const src = img.attr("src") || img.attr("data-src") || "";
          const caption = captionEl.text().trim();
          if (src && !isBadImage(src, "")) {
            const fullSrc = src.startsWith("http") ? src : "https://www.georgeherald.com" + src;
            blocks.push({ type: "image_with_caption", text: caption, imageUrl: fullSrc, caption });
          }
        });
        // Also get any remaining text in this element (after images)
        const remainingText = el.clone().find(".fr-img-wrap").remove().end().text().trim();
        if (remainingText.length > 10) {
          blocks.push({ type: "paragraph", text: remainingText });
        }
        return;
      }

      // Regular paragraph
      let html = el.html() || "";
      html = html.replace(/<script[\s\S]*?<\/script>/gi, "")
                  .replace(/<style[\s\S]*?<\/style>/gi, "")
                  .replace(/&nbsp;/g, " ").trim();

      // Check if it contains an image with caption
      const img = el.find("img");
      if (img.length) {
        const src = img.attr("src") || img.attr("data-src") || "";
        if (src && !isBadImage(src, img.attr("alt") || "")) {
          const fullSrc = src.startsWith("http") ? src : "https://www.georgeherald.com" + src;
          // Look for caption in sibling span
          const captionSpan = img.next("span, .fr-inner");
          const caption = captionSpan.text().trim();
          blocks.push({ type: "image_with_caption", text: caption || "", imageUrl: fullSrc, caption: caption || "" });
        }
        // Get remaining paragraph text
        const textOnly = el.clone().find("img, .fr-img-wrap").remove().end().text().trim();
        if (textOnly.length > 10 && !boilerplate.some(bp => textOnly.toLowerCase().includes(bp))) {
          blocks.push({ type: "paragraph", text: textOnly });
        }
        return;
      }

      if (html && text.length > 2) {
        blocks.push({ type: "paragraph", text, html });
      }
    });

    bodyText = blocks.filter(b => b.type !== "image_with_caption").map(b => b.text).join("\n\n");
  }

  // --- Add contributor block at the start if found ---
  if (contributor || pubDate) {
    blocks.unshift({ type: "contributor", text: contributor, contributorName: contributor, contributorDate: pubDate });
  }

  // --- Add teaser as intro_bold at the start (after contributor) ---
  if (teaser) {
    const insertIdx = blocks[0]?.type === "contributor" ? 1 : 0;
    blocks.splice(insertIdx, 0, { type: "intro_bold", text: teaser });
  }

  // --- Extract images (filtered) ---
  const images = [];
  const seenUrls = new Set();
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    const alt = $(el).attr("alt") || "";
    if (!src) return;
    const fullSrc = src.startsWith("http") ? src : "https://www.georgeherald.com" + src;
    if (isBadImage(fullSrc, alt)) return;
    if (seenUrls.has(fullSrc)) return;
    seenUrls.add(fullSrc);

    // Try to find caption
    const parent = $(el).parent();
    let caption = "";
    const frInner = parent.find(".fr-inner");
    if (frInner.length) caption = frInner.text().trim();

    images.push({ url: fullSrc, alt: alt || title, caption });
  });

  // --- Extract ONLY valid embeddable video URLs ---
  const videoUrls = [];
  // Only look inside article content, not sidebar
  contentEl.find("iframe").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (isValidVideoEmbed(src)) {
      // Normalize to embed URL
      let embedUrl = src.trim();
      if (!embedUrl.startsWith("http")) embedUrl = "https:" + embedUrl;
      videoUrls.push(embedUrl);
    }
  });

  // --- Author: use contributor or fallback to byline ---
  let author = contributor || "";
  if (!author) {
    for (const sel of [".author-name", ".article-author", '[rel="author"]', ".byline"]) {
      const el = $(sel);
      if (el.length) { author = el.text().trim(); break; }
    }
  }

  // --- Tags ---
  const tags = [];
  $('meta[name="keywords"]').each((_, el) => {
    ($(el).attr("content") || "").split(",").forEach(t => {
      const tag = t.trim();
      if (tag && tag.length < 50) tags.push(tag);
    });
  });

  return {
    title,
    ogImage,
    ogDescription: ogDesc,
    teaser,
    contributor,
    pubDate,
    featuredCaption,
    bodyBlocks: blocks,
    bodyText,
    images,
    author,
    tags: [...new Set(tags)],
    videoUrls,
  };
}

async function main() {
  const mode = process.argv[2] || "recent"; // "recent" (last 200) or "all"
  
  console.log("=== Article Re-scraper (Improved Parser) ===\n");
  
  const articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, "utf-8"));
  console.log(`Total articles in index: ${articles.length}`);

  // Determine which articles to rescrape
  let toRescrape;
  if (mode === "all") {
    toRescrape = articles.filter(a => a.link && a.link.includes("georgeherald.com"));
    console.log(`Mode: ALL — will rescrape ${toRescrape.length} GH articles`);
  } else {
    // Recent: sort by date, take last N
    const count = parseInt(process.argv[3]) || 200;
    toRescrape = articles
      .filter(a => a.link && a.link.includes("georgeherald.com"))
      .sort((a, b) => new Date(b.updated) - new Date(a.updated))
      .slice(0, count);
    console.log(`Mode: RECENT — will rescrape ${toRescrape.length} most recent GH articles`);
  }

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < toRescrape.length; i++) {
    const article = toRescrape[i];
    const slug = article.slug;
    const link = article.link;

    const html = await fetchPage(link);
    if (!html) {
      failed++;
      continue;
    }

    try {
      const $ = cheerio.load(html);
      const data = parseArticleImproved($, link);

      if (!data.title || data.title.length < 5) {
        failed++;
        continue;
      }

      // Update listing entry
      const idx = articles.findIndex(a => a.slug === slug);
      if (idx !== -1) {
        if (data.author) articles[idx].author = data.author;
        articles[idx].hasVideo = data.videoUrls.length > 0;
        articles[idx].imageCount = data.images.length;
      }

      // Update detail file
      const detailFile = path.join(ARTICLES_DIR, `${slug}.json`);
      let existing = {};
      try { existing = JSON.parse(fs.readFileSync(detailFile, "utf-8")); } catch {}

      const updatedDetail = {
        ...existing,
        title: data.title,
        description: data.ogDescription || existing.description || "",
        bodyText: JSON.stringify(data.bodyBlocks),
        bodyHtml: JSON.stringify(data.bodyBlocks), // same format
        images: data.images.map(img => ({ url: img.url, alt: img.alt || data.title, caption: img.caption || "" })),
        author: data.author || existing.author || "",
        tags: data.tags.length > 0 ? data.tags : (existing.tags || []),
        videoUrls: data.videoUrls,
        teaser: data.teaser || "",
        contributor: data.contributor || "",
        featuredCaption: data.featuredCaption || "",
        galleryLink: existing.galleryLink || "",
        ogImage: data.ogImage || existing.ogImage || "",
      };

      await fs.writeJson(detailFile, updatedDetail, { spaces: 2 });
      updated++;
    } catch (err) {
      console.error(`  Error parsing ${slug}: ${err.message}`);
      failed++;
    }

    if ((i + 1) % 10 === 0) {
      console.log(`  [${i + 1}/${toRescrape.length}] Updated: ${updated}, Failed: ${failed}`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
  console.log(`Saving ${articles.length} articles index...`);
  await fs.writeJson(ARTICLES_FILE, articles, { spaces: 2 });
  console.log("Saved!");
}

main().catch(console.error);
