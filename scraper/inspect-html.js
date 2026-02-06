const axios = require("axios");
const cheerio = require("cheerio");

(async () => {
  const url = "https://www.georgeherald.com/News/Article/Crime/court-orders-psychiatric-evaluation-for-van-druten-bail-application-withdrawn-202602061209";
  const r = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const $ = cheerio.load(r.data);

  console.log("=== SELECTOR TEST ===");
  const sels = [
    ".article-body", ".article-content", "[itemprop=articleBody]",
    ".entry-content", ".post-content", ".ArticleBody", ".article_body",
    ".Detail", ".article-detail", ".col-md-8", ".col-sm-8", ".col-lg-8",
    ".main-content", ".content-area", "article", ".article",
    ".news-article", ".story-content", ".post-body", ".page-content",
    "#article-body", "#articleBody", "#content", "#main-content",
    ".field-name-body", ".body-content", ".text-content",
  ];
  for (const s of sels) {
    const el = $(s);
    if (el.length) {
      const txt = el.text().trim();
      if (txt.length > 50) {
        console.log(s, "=> els:", el.length, "len:", txt.length, "preview:", txt.slice(0, 100));
      }
    }
  }

  console.log("\n=== IDS WITH CONTENT ===");
  $("[id]").each((_, el) => {
    const id = $(el).attr("id");
    const txt = $(el).text().trim();
    if (txt.length > 100 && txt.length < 8000) {
      console.log("#" + id, "len:", txt.length, "tag:", el.tagName);
    }
  });

  console.log("\n=== CLASSES WITH ARTICLE-LIKE CONTENT ===");
  const seen = new Set();
  $("[class]").each((_, el) => {
    const cls = $(el).attr("class") || "";
    const firstCls = cls.split(" ")[0];
    if (seen.has(firstCls)) return;
    const txt = $(el).text().trim();
    if (txt.length > 200 && txt.length < 6000 && 
        !cls.includes("nav") && !cls.includes("menu") && 
        !cls.includes("footer") && !cls.includes("header") &&
        !cls.includes("sidebar")) {
      seen.add(firstCls);
      console.log("." + firstCls, "tag:", el.tagName, "len:", txt.length, "preview:", txt.slice(0, 100));
    }
  });

  // Also try to find the h1 and what comes after it
  console.log("\n=== H1 TITLE ===");
  console.log($("h1").first().text().trim());

  console.log("\n=== H1 PARENT STRUCTURE ===");
  const h1 = $("h1").first();
  if (h1.length) {
    let parent = h1.parent();
    for (let i = 0; i < 5; i++) {
      if (parent.length) {
        console.log("Parent", i, "tag:", parent[0].tagName, "class:", (parent.attr("class") || "").slice(0, 60), "id:", parent.attr("id") || "", "textLen:", parent.text().trim().length);
        parent = parent.parent();
      }
    }
  }
})();
