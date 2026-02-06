const axios = require("axios");
const cheerio = require("cheerio");

async function investigate() {
  console.log("=== Investigating George Herald Pagination ===\n");

  // 1. Check the News page for pagination elements
  const res = await axios.get("https://www.georgeherald.com/News", {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  const $ = cheerio.load(res.data);

  // Find pagination-related elements
  console.log("1. Pagination elements:");
  $("[class*=pag], [class*=Pag], [id*=pag], [id*=Pag]").each((_, el) => {
    const $el = $(el);
    console.log(`  <${el.tagName} class="${$el.attr("class") || ""}" id="${$el.attr("id") || ""}"> text: "${$el.text().trim().substring(0, 80)}"`);
  });

  // 2. Find numeric page links or next/prev
  console.log("\n2. Page-like links:");
  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    if (href.includes("page") || href.includes("Page") || text.match(/^\d+$/) || 
        text === "Next" || text === "Prev" || text === "»" || text === "›" ||
        text === "..." || text === "Previous") {
      console.log(`  <a href="${href}"> "${text}"`);
    }
  });

  // 3. Check for JavaScript-based pagination
  console.log("\n3. Script tags with page/pagination references:");
  $("script").each((_, el) => {
    const content = $(el).html() || "";
    if (content.includes("page") || content.includes("Page") || content.includes("paging")) {
      // Extract relevant lines
      const lines = content.split("\n").filter(l => 
        l.includes("page") || l.includes("Page") || l.includes("paging") || l.includes("ajax") || l.includes("Ajax")
      );
      lines.slice(0, 10).forEach(l => console.log(`  ${l.trim().substring(0, 150)}`));
    }
  });

  // 4. Try fetching page 2 with different URL patterns
  console.log("\n4. Testing pagination URL patterns:");
  const patterns = [
    "/News?page=2",
    "/News?p=2",
    "/News?pageIndex=2",
    "/News/2",
    "/News?start=20",
    "/News?skip=20",
  ];
  for (const pattern of patterns) {
    try {
      const r = await axios.get("https://www.georgeherald.com" + pattern, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        maxRedirects: 0,
        validateStatus: (s) => s < 400,
      });
      const $p = cheerio.load(r.data);
      const links = new Set();
      $p('a[href*="/Article/"]').each((_, el) => {
        links.add($p(el).attr("href"));
      });
      console.log(`  ${pattern} -> ${r.status}, ${links.size} article links`);
    } catch (err) {
      console.log(`  ${pattern} -> ${err.response?.status || err.message}`);
    }
  }

  // 5. Check if there's infinite scroll / AJAX endpoint
  console.log("\n5. Looking for AJAX/API endpoints:");
  const allScripts = [];
  $("script").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src) allScripts.push(src);
  });
  allScripts.forEach(s => console.log(`  Script: ${s}`));

  // 6. Look for the #page-2 hash pattern - maybe it's JS-driven
  console.log("\n6. Checking for hash-based pagination JS:");
  $("script").each((_, el) => {
    const content = $(el).html() || "";
    if (content.includes("#page") || content.includes("hash") || content.includes("loadMore") || 
        content.includes("LoadMore") || content.includes("infinite") || content.includes("scroll")) {
      const relevant = content.substring(0, 500);
      console.log(`  Found script with pagination: ${relevant.substring(0, 300)}`);
    }
  });

  // 7. Count current articles on the page
  const articleLinks = new Set();
  $('a[href*="/Article/"]').each((_, el) => {
    articleLinks.add($(el).attr("href"));
  });
  console.log(`\n7. Articles on page 1: ${articleLinks.size} unique article links`);
  
  // Show first/last few
  const linkArr = Array.from(articleLinks);
  console.log("  First 3:", linkArr.slice(0, 3));
  console.log("  Last 3:", linkArr.slice(-3));
}

investigate().catch(console.error);
