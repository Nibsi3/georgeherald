const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://www.georgeherald.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function findCategoryVar(path) {
  const res = await axios.get(`${BASE}${path}`, { headers: { "User-Agent": UA }, timeout: 15000 });
  const $ = cheerio.load(res.data);
  
  let category = null;
  let subcategory = null;
  let items = 0;
  let pagedUrl = null;
  
  $("script").each((_, el) => {
    const content = $(el).html() || "";
    // Look for var category = "..." and var subcategory = "..."
    const catMatch = content.match(/var\s+category\s*=\s*["']([^"']+)["']/);
    if (catMatch) category = catMatch[1];
    const subMatch = content.match(/var\s+subcategory\s*=\s*["']([^"']+)["']/);
    if (subMatch) subcategory = subMatch[1];
    
    const itemsMatch = content.match(/items:\s*(\d+)/);
    if (itemsMatch && parseInt(itemsMatch[1]) > items) items = parseInt(itemsMatch[1]);
    
    const urlMatch = content.match(/url:\s*'([^']*PagedListing[^']*)'/);
    if (urlMatch) pagedUrl = urlMatch[1];
  });
  
  console.log(`${path.padEnd(30)} cat="${category}" sub="${subcategory}" items=${items} url=${pagedUrl}`);
  return { category, subcategory, items, pagedUrl };
}

async function main() {
  const paths = [
    "/News",
    "/News/Top-Stories",
    "/News/Local-News",
    "/News/National",
    "/News/Business",
    "/News/Crime",
    "/News/General-News",
    "/News/Environment",
    "/News/Agriculture",
    "/News/Politics",
    "/News/LifeStyle",
    "/News/Entertainment-News",
    "/News/Property",
    "/News/Schools",
    "/News/Motoring",
    "/Sport",
    "/Sport/Latest-Sport",
    "/Sport/Rugby",
    "/Sport/Cricket",
    "/Sport/Football",
    "/Sport/Golf",
    "/Sport/Tennis",
    "/Sport/Athletics",
    "/Sport/Other",
    "/Opinion/Latest",
    "/Schools/Sport",
    "/Schools/Academic",
    "/Schools/Culture",
    "/Municipal-Notices",
    "/Community/We-Care",
    "/Community/Heritage",
    "/Entertainment",
    "/Letters",
  ];
  
  console.log("=== Category/Subcategory variables per page ===\n");
  
  const results = [];
  for (const p of paths) {
    const r = await findCategoryVar(p);
    results.push({ path: p, ...r });
  }
  
  // Now test actual pagination for the ones with items
  console.log("\n\n=== Testing POST pagination for key sections ===\n");
  const toTest = results.filter(r => r.items > 0 && r.pagedUrl).slice(0, 8);
  
  for (const r of toTest) {
    const allLinks = new Set();
    const maxPages = Math.min(Math.ceil(r.items / 15), 5); // just test 5 pages
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const params = new URLSearchParams();
        if (r.category) params.append("query1", r.category);
        if (r.subcategory) params.append("query2", r.subcategory);
        params.append("page", page.toString());
        
        const res = await axios.post(`${BASE}${r.pagedUrl}`, params.toString(), {
          headers: { 
            "User-Agent": UA,
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest",
          },
          timeout: 15000,
        });
        const $ = cheerio.load(res.data);
        const pageLinks = [];
        $('a[href*="/Article/"]').each((_, el) => {
          const href = $(el).attr("href");
          if (href && !allLinks.has(href)) {
            pageLinks.push(href);
            allLinks.add(href);
          }
        });
        if (page <= 2) console.log(`  ${r.path} p${page}: +${pageLinks.length} (total: ${allLinks.size})`);
      } catch (err) {
        console.log(`  ${r.path} p${page}: ERROR ${err.response?.status || err.message}`);
        break;
      }
    }
    console.log(`  ${r.path}: ${allLinks.size} articles from ${maxPages} pages (total avail: ${r.items})`);
  }
}

main().catch(console.error);
