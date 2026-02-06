const fs = require("fs-extra");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "scraped-data");

async function main() {
  const articles = await fs.readJson(path.join(DATA_DIR, "articles.json"));
  console.log(`Total articles loaded: ${articles.length}\n`);

  // 1. Find duplicates by URL (guid/link)
  const byUrl = new Map();
  const byTitle = new Map();
  
  for (const a of articles) {
    const url = a.link || a.guid;
    if (byUrl.has(url)) {
      byUrl.get(url).push(a);
    } else {
      byUrl.set(url, [a]);
    }
    
    // Also check by title (same article might have different URLs)
    const titleKey = (a.title || "").toLowerCase().trim();
    if (titleKey && titleKey.length > 10 && titleKey !== "george herald") {
      if (byTitle.has(titleKey)) {
        byTitle.get(titleKey).push(a);
      } else {
        byTitle.set(titleKey, [a]);
      }
    }
  }

  // Count URL duplicates
  let urlDupes = 0;
  for (const [url, group] of byUrl) {
    if (group.length > 1) {
      urlDupes += group.length - 1;
      if (urlDupes <= 10) {
        console.log(`  URL dupe (${group.length}x): ${url.substring(0, 100)}`);
      }
    }
  }
  console.log(`\nURL duplicates: ${urlDupes}`);

  // Count title duplicates (different URLs, same title)
  let titleDupes = 0;
  const titleDupeExamples = [];
  for (const [title, group] of byTitle) {
    if (group.length > 1) {
      // Check if these are actually different URLs
      const urls = new Set(group.map(a => a.link || a.guid));
      if (urls.size > 1) {
        titleDupes += group.length - 1;
        if (titleDupeExamples.length < 5) {
          titleDupeExamples.push({ title: title.substring(0, 80), urls: [...urls].map(u => u.substring(u.lastIndexOf("/") + 1, u.lastIndexOf("/") + 60)) });
        }
      }
    }
  }
  console.log(`Title duplicates (different URLs): ${titleDupes}`);
  for (const ex of titleDupeExamples) {
    console.log(`  "${ex.title}":`);
    ex.urls.forEach(u => console.log(`    ${u}`));
  }

  // 2. Check category assignments
  console.log(`\n=== Category analysis ===\n`);
  
  // The article URL contains the authoritative category: /Section/Article/Category/slug
  let categoryMismatches = 0;
  const categoryFromUrl = {};
  
  for (const a of articles) {
    const url = a.link || a.guid;
    // Extract category from URL: /News/Article/Local-News/slug or /Sport/Article/Rugby/slug
    const match = url.match(/\/Article\/([^/]+)\//);
    const urlCategory = match ? match[1].toLowerCase().replace(/-/g, "-") : null;
    const storedCategory = (a.category || "").toLowerCase();
    
    if (urlCategory) {
      categoryFromUrl[urlCategory] = (categoryFromUrl[urlCategory] || 0) + 1;
      
      // Normalize both for comparison
      const normalizedUrl = urlCategory.replace(/-/g, "-");
      const normalizedStored = storedCategory.replace(/ /g, "-");
      
      if (normalizedUrl !== normalizedStored) {
        categoryMismatches++;
        if (categoryMismatches <= 5) {
          console.log(`  Mismatch: URL="${urlCategory}" stored="${storedCategory}" -> ${url.substring(url.lastIndexOf("/Article/"))}`);
        }
      }
    }
  }
  console.log(`\nCategory mismatches: ${categoryMismatches}`);
  console.log(`\nCategories from URLs:`);
  const sorted = Object.entries(categoryFromUrl).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sorted) {
    console.log(`  ${cat.padEnd(25)}: ${count}`);
  }

  // 3. Deduplicate - keep one per URL, prefer the one with more content
  console.log(`\n=== Deduplicating ===\n`);
  const deduped = [];
  const seenUrls = new Set();
  const seenTitles = new Set();
  
  for (const a of articles) {
    const url = a.link || a.guid;
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);
    
    // Fix category from URL (authoritative source)
    const match = url.match(/\/Article\/([^/]+)\//);
    if (match) {
      a.category = match[1].toLowerCase().replace(/ /g, "-");
    }
    
    // Fix section from URL
    if (url.includes("/Sport/")) a.section = "sport";
    else if (url.includes("/Opinion/") || url.includes("/Letters/")) a.section = "opinion";
    else if (url.includes("/Schools/")) a.section = "schools";
    else if (url.includes("/Community/") || url.includes("/Municipal")) a.section = "community";
    else if (url.includes("/Tourism/")) a.section = "tourism";
    else if (url.includes("/Entertainment/")) a.section = "entertainment";
    else a.section = "news";
    
    deduped.push(a);
  }
  
  console.log(`Before: ${articles.length}`);
  console.log(`After URL dedup: ${deduped.length}`);
  console.log(`Removed: ${articles.length - deduped.length}`);

  // Year breakdown of deduped
  const years = {};
  for (const a of deduped) {
    const url = a.link || a.guid;
    const m = url.match(/-(\d{4})\d{8}$/);
    const year = m ? m[1] : "unknown";
    years[year] = (years[year] || 0) + 1;
  }
  console.log(`\nYear breakdown (deduped):`);
  for (const [y, c] of Object.entries(years).sort()) console.log(`  ${y}: ${c}`);

  // Category breakdown of deduped
  const cats = {};
  for (const a of deduped) {
    cats[a.category] = (cats[a.category] || 0) + 1;
  }
  console.log(`\nCategory breakdown (deduped):`);
  for (const [c, n] of Object.entries(cats).sort((a, b) => b[1] - a[1])) console.log(`  ${c.padEnd(25)}: ${n}`);

  // Section breakdown of deduped
  const secs = {};
  for (const a of deduped) {
    secs[a.section] = (secs[a.section] || 0) + 1;
  }
  console.log(`\nSection breakdown (deduped):`);
  for (const [s, n] of Object.entries(secs).sort((a, b) => b[1] - a[1])) console.log(`  ${s.padEnd(20)}: ${n}`);

  // Save deduped data
  await fs.writeJson(path.join(DATA_DIR, "articles.json"), deduped, { spaces: 2 });
  
  // Update summary
  const summary = {
    scrapedAt: new Date().toISOString(),
    totalArticles: deduped.length,
    totalVideos: (await fs.readJson(path.join(DATA_DIR, "videos.json"))).length,
    totalGalleries: (await fs.readJson(path.join(DATA_DIR, "galleries.json"))).length,
    yearBreakdown: years,
    categoryBreakdown: cats,
    sectionBreakdown: secs,
  };
  await fs.writeJson(path.join(DATA_DIR, "summary.json"), summary, { spaces: 2 });
  
  console.log(`\nSaved ${deduped.length} deduplicated articles to articles.json`);
}

main().catch(console.error);
