const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://www.georgeherald.com";
const dataDir = path.join(__dirname, "..", "scraped-data");

async function main() {
  // Fetch the Top Stories listing page
  console.log("Fetching Top Stories listing page...");
  const res = await axios.get(BASE_URL + "/News/Top-Stories", {
    headers: { "User-Agent": "GeorgeHeraldRedesign/2.0" },
    timeout: 15000,
  });
  const $ = cheerio.load(res.data);

  // Extract all article links from the Top Stories page
  const topStoryUrls = new Set();
  $('a[href*="/Article/"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      const fullHref = href.startsWith("http") ? href : BASE_URL + href;
      if (fullHref.includes("georgeherald.com") && fullHref.includes("/Article/")) {
        // Extract slug (last part of URL) for matching
        const slug = fullHref.split("/").pop() || "";
        topStoryUrls.add(slug);
      }
    }
  });
  console.log(`Found ${topStoryUrls.size} top story URLs`);

  // Load and update articles
  const articles = fs.readJsonSync(path.join(dataDir, "articles.json"));
  let flagged = 0;
  for (const a of articles) {
    const slug = (a.link || "").split("/").pop() || "";
    if (topStoryUrls.has(slug)) {
      a.isTopStory = true;
      flagged++;
    } else {
      a.isTopStory = false;
    }
  }

  fs.writeJsonSync(path.join(dataDir, "articles.json"), articles, { spaces: 2 });
  console.log(`Flagged ${flagged} articles as top stories out of ${articles.length}`);
  
  // Show top story titles
  articles.filter(a => a.isTopStory).slice(0, 5).forEach(a => {
    console.log("  -", a.title);
  });
}

main().catch(console.error);
