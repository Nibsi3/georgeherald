const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://www.georgeherald.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function findPagerConfig(path) {
  const res = await axios.get(`${BASE}${path}`, { headers: { "User-Agent": UA }, timeout: 15000 });
  const $ = cheerio.load(res.data);
  
  // Find ALL initPager calls - extract the raw JS
  const configs = [];
  $("script").each((_, el) => {
    const content = $(el).html() || "";
    const match = content.match(/initPager\s*\(\s*\{[\s\S]*?\}\s*\)/g);
    if (match) {
      match.forEach(m => configs.push(m));
    }
  });
  
  if (configs.length === 0) {
    console.log(`  ${path}: NO initPager found`);
    return null;
  }
  
  for (const config of configs) {
    console.log(`  ${path}:`);
    console.log(`    ${config.replace(/\s+/g, ' ').substring(0, 500)}`);
  }
  return configs[0];
}

async function testPost(pagedUrl, query1, query2, page) {
  const params = new URLSearchParams();
  if (query1) params.append("query1", query1);
  if (query2) params.append("query2", query2);
  params.append("page", page.toString());
  
  try {
    const res = await axios.post(`${BASE}${pagedUrl}`, params.toString(), {
      headers: { 
        "User-Agent": UA,
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": `${BASE}/News`,
      },
      timeout: 15000,
    });
    const $ = cheerio.load(res.data);
    const links = [];
    $('a[href*="/Article/"]').each((_, el) => {
      links.push($(el).attr("href"));
    });
    return { status: res.status, size: res.data.length, links: [...new Set(links)] };
  } catch (err) {
    return { status: err.response?.status || err.message, size: 0, links: [] };
  }
}

async function main() {
  console.log("=== Finding initPager configs ===\n");
  
  const pages = [
    "/News", "/News/Local-News", "/News/Crime", "/News/Business",
    "/Sport", "/Sport/Rugby", "/Opinion/Latest", "/Schools/Academic",
    "/Entertainment",
  ];
  
  for (const p of pages) {
    await findPagerConfig(p);
  }
  
  // Now test different POST approaches
  console.log("\n\n=== Testing POST variations ===\n");
  
  // Maybe the URL needs the full category path
  const tests = [
    { url: "/News/PagedListing", q1: "Local News", q2: null, label: "News + q1=Local News" },
    { url: "/News/PagedListing", q1: "Crime", q2: null, label: "News + q1=Crime" },
    { url: "/News/PagedListing", q1: null, q2: "Local News", label: "News + q2=Local News" },
    { url: "/News/Local-News/PagedListing", q1: null, q2: null, label: "Local-News/PagedListing" },
    { url: "/Sport/PagedListing", q1: "Rugby", q2: null, label: "Sport + q1=Rugby" },
    { url: "/Sport/PagedListing", q1: null, q2: "Rugby", label: "Sport + q2=Rugby" },
  ];
  
  for (const test of tests) {
    for (const page of [1, 2]) {
      const result = await testPost(test.url, test.q1, test.q2, page);
      console.log(`  ${test.label} p${page}: ${result.status}, ${result.size}B, ${result.links.length} links`);
      if (result.links.length > 0 && page === 1) {
        console.log(`    First: ${result.links[0]}`);
        console.log(`    Last: ${result.links[result.links.length - 1]}`);
      }
    }
  }
}

main().catch(console.error);
