const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://www.georgeherald.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function testSection(path) {
  // Test both ?page=N on main URL and /PagedListing endpoint
  const allLinks = new Set();
  
  // Strategy 1: ?page=N on main URL
  let emptyCount = 0;
  for (let page = 1; page <= 200; page++) {
    try {
      const url = `${BASE}${path}?page=${page}`;
      const res = await axios.get(url, { headers: { "User-Agent": UA }, timeout: 15000 });
      const $ = cheerio.load(res.data);
      const links = [];
      $('a[href*="/Article/"]').each((_, el) => {
        const href = $(el).attr("href");
        if (href && !allLinks.has(href)) {
          links.push(href);
          allLinks.add(href);
        }
      });
      if (links.length === 0) {
        emptyCount++;
        if (emptyCount >= 3) break; // 3 consecutive empty pages = done
      } else {
        emptyCount = 0;
      }
      if (page % 20 === 0) {
        process.stdout.write(`  p${page}:${allLinks.size} `);
      }
    } catch (err) {
      break;
    }
  }
  return allLinks;
}

async function main() {
  // Test key sections
  const sections = [
    "/News",
    "/News/Local-News", 
    "/News/Crime",
    "/Sport",
    "/Sport/Rugby",
    "/Opinion/Latest",
    "/Schools/Academic",
  ];
  
  for (const section of sections) {
    process.stdout.write(`${section}: `);
    const links = await testSection(section);
    const years = {};
    for (const link of links) {
      const m = link.match(/(\d{4})\d{8}$/);
      if (m) years[m[1]] = (years[m[1]] || 0) + 1;
    }
    console.log(`${links.size} articles | years: ${JSON.stringify(years)}`);
  }
}

main().catch(console.error);
