const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

// Import the parser from rescrape
const FRONTEND_DATA = path.join(__dirname, "..", "frontend", "src", "data");
const ARTICLES_DIR = path.join(FRONTEND_DATA, "articles");

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

function isValidVideoEmbed(src) {
  if (!src) return false;
  if (src.includes("youtube.com/embed/")) return true;
  if (src.includes("youtube-nocookie.com/embed/")) return true;
  if (src.includes("player.vimeo.com")) return true;
  return false;
}

async function main() {
  const url = "https://www.georgeherald.com/Sport/Article/Golf/teen-sensation-coetzer-clinches-africa-amateur-women-s-invitational-202602070808";
  const slug = "teen-sensation-coetzer-clinches-africa-amateur-women-s-invitational-202602070808";
  
  const res = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const $ = cheerio.load(res.data);
  
  // Teaser
  let teaser = "";
  $(".teaser_container").each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 10) teaser = t;
  });
  console.log("TEASER:", teaser);
  
  // Contributor + date
  let contributor = "", pubDate = "";
  $(".row").each((_, el) => {
    const text = $(el).text().trim();
    if (text.startsWith("Contributor") || text.startsWith("Journalist")) {
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2) contributor = lines[1];
      const dateMatch = text.match(/\w+day,\s+\d{1,2}\s+\w+\s+\d{4},?\s+\d{1,2}:\d{2}/);
      if (dateMatch) pubDate = dateMatch[0];
    }
  });
  console.log("CONTRIBUTOR:", contributor);
  console.log("PUB DATE:", pubDate);
  
  // Featured caption
  let featuredCaption = "";
  $(".wrapper-article").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && text.length < 500) featuredCaption = text;
  });
  console.log("FEATURED CAPTION:", featuredCaption.substring(0, 150));
  
  // Article content blocks
  const acw = $(".article-content-wrapper").first();
  const blocks = [];
  const boilerplate = ["we bring you the latest garden route", "read more about:", "click here to follow us on whatsapp"];
  
  if (acw.length) {
    acw.find("script, style, .article_link_chain").remove();
    acw.children().each((_, child) => {
      const tag = child.tagName?.toLowerCase();
      const el = $(child);
      const text = el.text().trim();
      if (!text || text.length < 2) return;
      const lower = text.toLowerCase();
      if (boilerplate.some(bp => lower.startsWith(bp) || lower.includes(bp))) return;
      if (text === "Update") return;
      
      if (tag === "blockquote") {
        blocks.push({ type: "blockquote", text });
        return;
      }
      if (tag === "h2" || tag === "h3" || tag === "h4") {
        blocks.push({ type: "heading", text, level: tag });
        return;
      }
      
      // Check for fr-img-wrap
      const frImgWrap = el.find(".fr-img-wrap, span.fr-img-wrap");
      if (frImgWrap.length) {
        frImgWrap.each((_, wrap) => {
          const img = $(wrap).find("img");
          const captionEl = $(wrap).find(".fr-inner");
          const src = img.attr("src") || "";
          const caption = captionEl.text().trim();
          if (src && !isBadImage(src, "")) {
            const fullSrc = src.startsWith("http") ? src : "https://www.georgeherald.com" + src;
            blocks.push({ type: "image_with_caption", text: caption, imageUrl: fullSrc, caption });
          }
        });
        return;
      }
      
      blocks.push({ type: "paragraph", text });
    });
  }
  
  // Add contributor + teaser at the start
  if (contributor || pubDate) {
    blocks.unshift({ type: "contributor", text: contributor, contributorName: contributor, contributorDate: pubDate });
  }
  if (teaser) {
    const insertIdx = blocks[0]?.type === "contributor" ? 1 : 0;
    blocks.splice(insertIdx, 0, { type: "intro_bold", text: teaser });
  }
  
  // Video URLs (only valid embeds)
  const videoUrls = [];
  acw.find("iframe").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (isValidVideoEmbed(src)) videoUrls.push(src);
  });
  
  console.log("\nBLOCKS:", blocks.length);
  blocks.forEach((b, i) => {
    console.log(`  ${i}. [${b.type}] ${(b.text || "").substring(0, 100)}${b.imageUrl ? " IMG:" + b.imageUrl.substring(0, 50) : ""}${b.contributorName ? " BY:" + b.contributorName : ""}`);
  });
  console.log("\nVIDEO URLS:", videoUrls);
  
  // Images
  const images = [];
  const seenUrls = new Set();
  $("img").each((_, el) => {
    const src = $(el).attr("src") || "";
    const alt = $(el).attr("alt") || "";
    if (!src) return;
    const fullSrc = src.startsWith("http") ? src : "https://www.georgeherald.com" + src;
    if (isBadImage(fullSrc, alt)) return;
    if (seenUrls.has(fullSrc)) return;
    seenUrls.add(fullSrc);
    const parent = $(el).parent();
    let caption = "";
    const frInner = parent.find(".fr-inner");
    if (frInner.length) caption = frInner.text().trim();
    images.push({ url: fullSrc, alt, caption });
  });
  console.log("\nIMAGES:", images.length);
  images.forEach(img => console.log(`  ${img.url.substring(0, 80)} [caption: ${img.caption || "none"}]`));
}

main().catch(console.error);
