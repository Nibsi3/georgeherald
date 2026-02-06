const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");

const dataDir = path.join(__dirname, "..", "scraped-data");
const articles = fs.readJsonSync(path.join(dataDir, "articles.json"));

function decodeHtml(str) {
  if (!str) return "";
  const doc = cheerio.load("<p>" + str + "</p>");
  return doc("p").text();
}

function titleFromSlug(url) {
  const slug = (url || "").split("/").pop() || "";
  return slug
    .replace(/-\d{12}$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

let fixed = 0;
for (const a of articles) {
  // Decode HTML entities
  a.title = decodeHtml(a.title);
  a.description = decodeHtml(a.description);

  // If title is truncated or too long or is the og:description prefix, use slug
  const slugTitle = titleFromSlug(a.link);
  if (
    !a.title ||
    a.title.length < 10 ||
    a.title.endsWith("...") ||
    a.title.length > 80 ||
    (a.title.includes(" - ") && a.title.indexOf(" - ") < 40)
  ) {
    if (slugTitle.length > 10) {
      a.title = slugTitle;
      fixed++;
    }
  }
}

fs.writeJsonSync(path.join(dataDir, "articles.json"), articles, { spaces: 2 });
console.log("Fixed " + fixed + " titles out of " + articles.length);
console.log("Sample titles:");
articles.slice(0, 10).forEach((a) => console.log("  -", a.title));
