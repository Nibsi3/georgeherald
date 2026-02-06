const axios = require("axios");
const cheerio = require("cheerio");

async function investigate() {
  // Test the PagedListing AJAX endpoint
  const categories = [
    { name: "News", url: "/News/PagedListing" },
    { name: "Sport", url: "/Sport/PagedListing" },
    { name: "Local News", url: "/News/Local-News/PagedListing" },
  ];

  for (const cat of categories) {
    console.log(`\n=== ${cat.name} ===`);
    for (let page = 1; page <= 5; page++) {
      try {
        const res = await axios.get(`https://www.georgeherald.com${cat.url}?page=${page}`, {
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "X-Requested-With": "XMLHttpRequest",
          },
          timeout: 15000,
        });
        const $ = cheerio.load(res.data);
        const links = new Set();
        $('a[href*="/Article/"]').each((_, el) => {
          links.add($(el).attr("href"));
        });
        console.log(`  Page ${page}: ${res.status}, ${res.data.length} bytes, ${links.size} article links`);
        if (links.size === 0) {
          console.log(`  (no more articles - stopping)`);
          break;
        }
        if (page === 1) {
          const first = Array.from(links)[0];
          console.log(`    First: ${first}`);
        }
      } catch (err) {
        console.log(`  Page ${page}: ${err.response?.status || err.message}`);
      }
    }
  }

  // Now test how many pages exist for /News
  console.log("\n\n=== Finding total pages for /News ===");
  let totalArticles = 0;
  const allLinks = new Set();
  for (let page = 1; page <= 200; page++) {
    try {
      const res = await axios.get(`https://www.georgeherald.com/News/PagedListing?page=${page}`, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "X-Requested-With": "XMLHttpRequest",
        },
        timeout: 15000,
      });
      const $ = cheerio.load(res.data);
      const links = new Set();
      $('a[href*="/Article/"]').each((_, el) => {
        const href = $(el).attr("href");
        links.add(href);
        allLinks.add(href);
      });
      if (links.size === 0) {
        console.log(`  Page ${page}: EMPTY - total pages: ${page - 1}`);
        break;
      }
      totalArticles += links.size;
      if (page % 10 === 0) {
        console.log(`  Page ${page}: ${links.size} links (running total: ${allLinks.size} unique)`);
      }
    } catch (err) {
      console.log(`  Page ${page}: ERROR ${err.message} - stopping`);
      break;
    }
  }
  console.log(`\nTotal unique articles found via /News pagination: ${allLinks.size}`);
  
  // Check years
  const years = {};
  for (const link of allLinks) {
    const match = link.match(/(\d{4})\d{8}$/);
    if (match) {
      const year = match[1];
      years[year] = (years[year] || 0) + 1;
    }
  }
  console.log("Year breakdown:", years);
}

investigate().catch(console.error);
