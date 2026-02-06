const https = require("https");
const fs = require("fs");
const path = require("path");

// All classified categories with their URLs (only those with items > 0)
const CATEGORIES = {
  "all-classifieds": {
    "general-classifieds": { name: "All Classifieds (PDF)", count: 13 }
  },
  "vacancies": {
    "employment-offered": { name: "Employment Offered", count: 5 },
    "employment-wanted": { name: "Employment Wanted", count: 10 },
    "domestic-work-wanted": { name: "Domestic Work Wanted", count: 22 },
    "general-vacancies": { name: "General Vacancies", count: 1 },
    "business-opportunities": { name: "Business Opportunities", count: 1 },
  },
  "for-sale": {
    "pets-and-livestock": { name: "Pets & Livestock", count: 2 },
    "miscellaneous-for-sale": { name: "Miscellaneous For Sale", count: 2 },
    "carpets-furniture-and-appliances": { name: "Carpets/Furniture & Appliances", count: 1 },
    "auctions": { name: "Auctions", count: 3 },
  },
  "home-improvement": {
    "gardening": { name: "Gardening", count: 2 },
    "interior-decorating": { name: "Interior Decorating", count: 1 },
    "plumbing": { name: "Plumbing", count: 1 },
    "handymen": { name: "Handymen", count: 3 },
    "cleaning": { name: "Cleaning", count: 2 },
  },
  "motoring": {
    "vehicles-for-sale": { name: "Vehicles For Sale", count: 1 },
  },
  "notices": {
    "personal": { name: "Personal", count: 3 },
    "marriages": { name: "Marriages", count: 1 },
    "births": { name: "Births", count: 1 },
  },
  "property": {
    "houses-for-sale": { name: "Houses For Sale", count: 1 },
    "flats-to-let": { name: "Flats To Let", count: 3 },
    "business-premises-to-let": { name: "Business Premises To Let", count: 4 },
    "rooms-and-boarding": { name: "Rooms & Boarding", count: 1 },
  },
  "services": {
    "general-services": { name: "General Services", count: 4 },
    "removals-transport": { name: "Removals / Transport", count: 2 },
    "storage": { name: "Storage", count: 1 },
    "photographic": { name: "Photographic", count: 1 },
  },
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

function parseClassifiedAds(html) {
  const ads = [];
  // Match classified ad blocks - they have ref IDs like BZ003558, MW000986, VL009151
  const adRegex = /classifieds\/classified\/([\w\d]+)["'][^>]*>[\s\S]*?<\/a>/g;
  // Simpler: find all classified links and their text
  const linkRegex = /href=["']\/classifieds\/classified\/([\w\d]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  
  let match;
  const seen = new Set();
  while ((match = linkRegex.exec(html)) !== null) {
    const ref = match[1];
    if (seen.has(ref)) continue;
    seen.add(ref);
    
    // Extract text content (strip HTML tags)
    let text = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text === "Read More" || text.length < 5) continue;
    
    // Try to extract date
    const dateMatch = text.match(/((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4})/i);
    const date = dateMatch ? dateMatch[1] : "";
    
    // Remove date from text
    if (date) text = text.replace(date, "").trim();
    
    ads.push({ ref, text, date, url: `https://www.georgeherald.com/classifieds/classified/${ref}` });
  }
  return ads;
}

async function scrapeAll() {
  const data = {};
  let totalAds = 0;

  for (const [section, subcats] of Object.entries(CATEGORIES)) {
    data[section] = { name: section.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()), subcategories: {} };
    
    for (const [subcat, meta] of Object.entries(subcats)) {
      if (subcat === "general-classifieds") continue; // Skip the PDF link
      
      const url = `https://www.georgeherald.com/classifieds/classification/${section}/${subcat}`;
      console.log(`Scraping ${section}/${subcat} (expected: ${meta.count})...`);
      
      try {
        const html = await fetch(url);
        const ads = parseClassifiedAds(html);
        data[section].subcategories[subcat] = { name: meta.name, count: ads.length, ads };
        totalAds += ads.length;
        console.log(`  Found ${ads.length} ads`);
      } catch (err) {
        console.log(`  Error: ${err.message}`);
        data[section].subcategories[subcat] = { name: meta.name, count: 0, ads: [] };
      }
      
      // Small delay
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Save data
  const outDir = path.join(__dirname, "frontend", "src", "data");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "classifieds.json"), JSON.stringify(data, null, 2));
  console.log(`\nDone! Saved ${totalAds} classified ads to frontend/src/data/classifieds.json`);
}

scrapeAll().catch(console.error);
