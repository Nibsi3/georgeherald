const fs = require("fs-extra");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "scraped-data");
const FRONTEND_DATA = path.join(__dirname, "..", "frontend", "src", "data");

async function main() {
  const articles = await fs.readJson(path.join(DATA_DIR, "articles.json"));
  console.log(`Loaded ${articles.length} articles\n`);

  // Create lightweight listing entries (no bodyText/bodyHtml/full images)
  const listings = articles.map((a) => {
    const url = a.link || a.guid || "";
    const slug = url.split("/").pop() || "";
    
    // Get first/best image for card display
    const ogImage = a.page?.ogImage || "";
    const firstImage = a.page?.images?.[0]?.url || "";
    const featuredImage = ogImage || firstImage || "";

    return {
      guid: a.guid,
      link: a.link,
      title: a.title,
      description: a.description || a.page?.ogDescription || "",
      updated: a.updated,
      section: a.section,
      category: a.category,
      isTopStory: a.isTopStory || false,
      slug,
      featuredImage,
      author: a.page?.author || "",
      tags: a.page?.tags || [],
      hasVideo: (a.page?.videoUrls?.length || 0) > 0,
      hasGallery: !!a.page?.galleryLink,
      imageCount: a.page?.images?.length || 0,
    };
  });

  // Save lightweight listings
  const listingsJson = JSON.stringify(listings);
  console.log(`Listings JSON size: ${(listingsJson.length / 1024 / 1024).toFixed(2)} MB`);
  await fs.writeJson(path.join(FRONTEND_DATA, "articles.json"), listings, { spaces: 0 });

  // Create individual article detail files in articles/ directory
  const articlesDir = path.join(FRONTEND_DATA, "articles");
  await fs.ensureDir(articlesDir);
  
  // Clean existing files
  const existing = await fs.readdir(articlesDir);
  for (const f of existing) {
    await fs.remove(path.join(articlesDir, f));
  }

  let saved = 0;
  for (const a of articles) {
    const url = a.link || a.guid || "";
    const slug = url.split("/").pop() || "";
    if (!slug) continue;

    // Full article detail
    const detail = {
      title: a.title,
      description: a.description || a.page?.ogDescription || "",
      link: a.link,
      updated: a.updated,
      section: a.section,
      category: a.category,
      isTopStory: a.isTopStory || false,
      bodyText: a.page?.bodyText || "",
      bodyHtml: a.page?.bodyHtml || "",
      images: a.page?.images || [],
      author: a.page?.author || "",
      tags: a.page?.tags || [],
      videoUrls: a.page?.videoUrls || [],
      galleryLink: a.page?.galleryLink || "",
      ogImage: a.page?.ogImage || "",
    };

    await fs.writeJson(path.join(articlesDir, `${slug}.json`), detail, { spaces: 0 });
    saved++;
  }

  console.log(`Saved ${saved} individual article files to ${articlesDir}`);
  
  // Copy videos and galleries as-is (small files)
  await fs.copy(path.join(DATA_DIR, "videos.json"), path.join(FRONTEND_DATA, "videos.json"));
  await fs.copy(path.join(DATA_DIR, "galleries.json"), path.join(FRONTEND_DATA, "galleries.json"));
  await fs.copy(path.join(DATA_DIR, "summary.json"), path.join(FRONTEND_DATA, "summary.json"));

  // Verify sizes
  const listingStat = await fs.stat(path.join(FRONTEND_DATA, "articles.json"));
  console.log(`\nFinal articles.json (listings): ${(listingStat.size / 1024 / 1024).toFixed(2)} MB`);
  
  const articleFiles = await fs.readdir(articlesDir);
  console.log(`Individual article files: ${articleFiles.length}`);
  
  console.log("\nDone! Frontend data split complete.");
}

main().catch(console.error);
