const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://www.georgeherald.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function testPostPagination(listingUrl, maxPages) {
  const allLinks = new Set();
  
  // First, get page 1 to find the initPager config (items count, query params)
  const res = await axios.get(`${BASE}${listingUrl}`, { headers: { "User-Agent": UA }, timeout: 15000 });
  const $ = cheerio.load(res.data);
  
  // Extract initPager config from inline scripts
  let pagedUrl = "";
  let query1 = null;
  let query2 = null;
  let totalItems = 0;
  
  $("script").each((_, el) => {
    const content = $(el).html() || "";
    if (content.includes("initPager")) {
      const urlMatch = content.match(/url:\s*'([^']+)'/);
      if (urlMatch) pagedUrl = urlMatch[1];
      const q1Match = content.match(/query1:\s*'([^']+)'/);
      if (q1Match) query1 = q1Match[1];
      const q2Match = content.match(/query2:\s*'([^']+)'/);
      if (q2Match) query2 = q2Match[1];
      const itemsMatch = content.match(/items:\s*(\d+)/);
      if (itemsMatch) totalItems = parseInt(itemsMatch[1]);
    }
  });
  
  console.log(`  Config: url=${pagedUrl}, q1=${query1}, q2=${query2}, items=${totalItems}`);
  
  if (!pagedUrl) {
    console.log(`  No PagedListing found for ${listingUrl}`);
    return allLinks;
  }

  const totalPages = Math.ceil(totalItems / 15);
  console.log(`  Total pages: ${totalPages} (${totalItems} items / 15 per page)`);
  
  // Now POST to each page
  for (let page = 1; page <= Math.min(totalPages, maxPages); page++) {
    try {
      const postRes = await axios.post(`${BASE}${pagedUrl}`, 
        `query1=${encodeURIComponent(query1 || "")}&query2=${encodeURIComponent(query2 || "")}&page=${page}`,
        {
          headers: { 
            "User-Agent": UA,
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest",
          },
          timeout: 15000,
        }
      );
      const $p = cheerio.load(postRes.data);
      const pageLinks = [];
      $p('a[href*="/Article/"]').each((_, el) => {
        const href = $p(el).attr("href");
        if (href && !allLinks.has(href)) {
          pageLinks.push(href);
          allLinks.add(href);
        }
      });
      if (page <= 3 || page % 10 === 0) {
        console.log(`  Page ${page}: ${pageLinks.length} new links (total: ${allLinks.size})`);
      }
      if (pageLinks.length === 0) break;
    } catch (err) {
      console.log(`  Page ${page}: ERROR ${err.message}`);
      break;
    }
  }
  return allLinks;
}

async function main() {
  const sections = [
    "/News",
    "/News/Local-News",
    "/News/Crime",
    "/Sport",
    "/Sport/Rugby",
    "/Schools/Academic",
    "/Opinion/Latest",
  ];
  
  for (const section of sections) {
    console.log(`\n=== ${section} ===`);
    const links = await testPostPagination(section, 30);
    
    const years = {};
    for (const link of links) {
      const m = link.match(/(\d{4})\d{8}$/);
      if (m) years[m[1]] = (years[m[1]] || 0) + 1;
    }
    console.log(`  TOTAL: ${links.size} articles | years: ${JSON.stringify(years)}`);
  }
}

main().catch(console.error);
