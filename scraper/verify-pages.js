const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const BASE = "http://localhost:3000";
const dataDir = path.join(__dirname, "..", "frontend", "src", "data");

async function check(url) {
  try {
    const r = await axios.get(url, { timeout: 30000, validateStatus: () => true });
    return r.status;
  } catch (e) {
    return "ERR: " + e.message;
  }
}

async function main() {
  const articles = fs.readJsonSync(path.join(dataDir, "articles.json"));
  const videos = fs.readJsonSync(path.join(dataDir, "videos.json"));
  const galleries = fs.readJsonSync(path.join(dataDir, "galleries.json"));

  console.log("=== Checking all article detail pages ===");
  const slugSet = new Set();
  let ok = 0, fail = 0, dupes = 0;
  for (let i = 0; i < articles.length; i++) {
    const link = articles[i].link || "";
    let slug = link.split("/").pop() || "";
    // Strip date suffix (same as frontend extractSlug)
    slug = slug.replace(/-\d{12}$/, "");
    if (!slug) { console.log("  EMPTY slug for article", i); fail++; continue; }
    if (slugSet.has(slug)) { dupes++; continue; }
    slugSet.add(slug);
    
    const status = await check(BASE + "/news/" + slug);
    if (status === 200) {
      ok++;
    } else {
      console.log("  FAIL", status, "/news/" + slug);
      fail++;
    }
    if ((ok + fail) % 50 === 0) console.log(`  Progress: ${ok + fail}/${slugSet.size}`);
  }
  console.log(`Articles: ${ok} OK, ${fail} FAIL, ${dupes} duplicates skipped\n`);

  console.log("=== Checking video detail pages ===");
  let vOk = 0, vFail = 0;
  for (const v of videos.slice(0, 10)) {
    const slug = v.slug || "";
    if (!slug) continue;
    const status = await check(BASE + "/videos/" + slug);
    if (status === 200) vOk++; else { console.log("  FAIL", status, "/videos/" + slug); vFail++; }
  }
  console.log(`Videos (sample 10): ${vOk} OK, ${vFail} FAIL\n`);

  console.log("=== Checking gallery detail pages ===");
  let gOk = 0, gFail = 0;
  for (const g of galleries.slice(0, 10)) {
    const slug = g.slug || "";
    if (!slug) continue;
    const status = await check(BASE + "/galleries/" + slug);
    if (status === 200) gOk++; else { console.log("  FAIL", status, "/galleries/" + slug); gFail++; }
  }
  console.log(`Galleries (sample 10): ${gOk} OK, ${gFail} FAIL\n`);

  console.log("=== Checking listing pages ===");
  const listings = ["/", "/news", "/sport", "/videos", "/galleries", "/lifestyle", "/schools", "/community", "/search",
    "/news/category/local", "/news/category/crime", "/news/category/business", "/news/category/politics",
    "/news/category/top-stories", "/news/category/environment", "/news/category/national",
    "/sport/rugby", "/sport/cricket", "/sport/football", "/sport/golf"];
  let lOk = 0, lFail = 0;
  for (const p of listings) {
    const status = await check(BASE + p);
    if (status === 200) lOk++; else { console.log("  FAIL", status, p); lFail++; }
  }
  console.log(`Listings: ${lOk} OK, ${lFail} FAIL`);
}

main().catch(console.error);
