const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://www.georgeherald.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function findVars(path) {
  const res = await axios.get(`${BASE}${path}`, { headers: { "User-Agent": UA }, timeout: 15000 });
  const $ = cheerio.load(res.data);
  
  // Find ALL var definitions in script tags
  const vars = {};
  $("script").each((_, el) => {
    const content = $(el).html() || "";
    // Match var declarations
    const matches = content.matchAll(/var\s+(\w+)\s*=\s*([^;]+);/g);
    for (const m of matches) {
      const name = m[1];
      const val = m[2].trim();
      if (['category', 'subcategory', 'section', 'displayedPages', 'savedPage'].includes(name)) {
        vars[name] = val;
      }
    }
    // Also check for the full initPager block
    if (content.includes("initPager")) {
      const block = content.match(/initPager[\s\S]{0,600}/);
      if (block) vars._initPager = block[0].replace(/\s+/g, ' ').substring(0, 400);
    }
  });
  
  // Check hidden inputs
  $('input[type="hidden"]').each((_, el) => {
    const name = $(el).attr("name") || $(el).attr("id") || "";
    const val = $(el).val();
    if (name && val) vars[`hidden:${name}`] = val;
  });
  
  return vars;
}

async function main() {
  const paths = ["/News", "/News/Crime", "/News/Local-News", "/Sport", "/Sport/Rugby"];
  
  for (const p of paths) {
    console.log(`\n=== ${p} ===`);
    const vars = await findVars(p);
    for (const [k, v] of Object.entries(vars)) {
      console.log(`  ${k} = ${v}`);
    }
  }
  
  // Now test: what if query1 is the category slug (hyphenated)?
  console.log("\n\n=== Testing query1 with various category name formats ===\n");
  const tests = [
    { url: "/News/PagedListing", q1: "Local-News", label: "Local-News" },
    { url: "/News/PagedListing", q1: "Local News", label: "Local News" },
    { url: "/News/PagedListing", q1: "LocalNews", label: "LocalNews" },
    { url: "/News/PagedListing", q1: "local-news", label: "local-news" },
    { url: "/News/PagedListing", q1: "Top-Stories", label: "Top-Stories" },
    { url: "/News/PagedListing", q1: "Business", label: "Business" },
    { url: "/News/PagedListing", q1: "National", label: "National" },
    { url: "/News/PagedListing", q1: "Agriculture", label: "Agriculture" },
    { url: "/News/PagedListing", q1: "", label: "(empty)" },
    { url: "/Sport/PagedListing", q1: "", label: "Sport (empty)" },
    { url: "/Sport/PagedListing", q1: "null", label: "Sport (null str)" },
    { url: "/Sport/PagedListing", q1: "Rugby", label: "Sport Rugby" },
    { url: "/Entertainment/PagedListing", q1: "", label: "Entertainment (empty)" },
    { url: "/Letters/PagedListing", q1: "", label: "Letters (empty)" },
    { url: "/Opinion/PagedListing", q1: "", label: "Opinion (empty)" },
  ];
  
  for (const t of tests) {
    const params = new URLSearchParams();
    params.append("query1", t.q1);
    params.append("query2", "");
    params.append("page", "1");
    
    try {
      const res = await axios.post(`${BASE}${t.url}`, params.toString(), {
        headers: { 
          "User-Agent": UA,
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
        },
        timeout: 15000,
      });
      const $ = cheerio.load(res.data);
      const links = new Set();
      $('a[href*="/Article/"]').each((_, el) => links.add($(el).attr("href")));
      
      // Try page 2 to verify pagination works
      params.set("page", "2");
      const res2 = await axios.post(`${BASE}${t.url}`, params.toString(), {
        headers: { 
          "User-Agent": UA,
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
        },
        timeout: 15000,
      });
      const $2 = cheerio.load(res2.data);
      const links2 = new Set();
      $2('a[href*="/Article/"]').each((_, el) => links2.add($2(el).attr("href")));
      
      // Check if page 2 has different articles
      let newOnP2 = 0;
      for (const l of links2) { if (!links.has(l)) newOnP2++; }
      
      console.log(`  ${t.label.padEnd(25)} p1: ${links.size} links, p2: ${links2.size} links (${newOnP2} new)`);
    } catch (err) {
      console.log(`  ${t.label.padEnd(25)} ERROR: ${err.response?.status || err.message}`);
    }
  }
}

main().catch(console.error);
