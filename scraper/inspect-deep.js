const axios = require("axios");
const cheerio = require("cheerio");

const URL = "https://www.georgeherald.com/Sport/Article/Golf/teen-sensation-coetzer-clinches-africa-amateur-women-s-invitational-202602070808";

async function main() {
  const res = await axios.get(URL, { headers: { "User-Agent": "Mozilla/5.0" } });
  const $ = cheerio.load(res.data);

  // 1. Featured image + caption in wrapper-article
  console.log("=== FEATURED IMAGE WRAPPER ===");
  $(".wrapper-article").each((i, el) => {
    console.log("HTML:", $(el).html().substring(0, 800));
  });

  // 2. Article content wrapper children
  console.log("\n=== ARTICLE-CONTENT-WRAPPER CHILDREN ===");
  const acw = $(".article-content-wrapper").first();
  acw.find("script, style").remove();
  acw.children().each((i, child) => {
    const tag = child.tagName;
    const el = $(child);
    const cls = el.attr("class") || "";
    const style = el.attr("style") || "";
    const text = el.text().trim();
    if (text.length < 3) return;
    const html = el.html().trim().substring(0, 400);
    console.log(`\n--- Child ${i}: <${tag} class="${cls}" style="${style.substring(0, 60)}">`);
    console.log(`TEXT: ${text.substring(0, 200)}`);
    console.log(`HTML: ${html}`);
  });

  // 3. Inline images with fr-img-wrap (captions)
  console.log("\n\n=== FR-IMG-WRAP (inline images with captions) ===");
  $(".fr-img-wrap, span.fr-img-wrap").each((i, el) => {
    const img = $(el).find("img");
    const captionEl = $(el).find("span.fr-inner, .fr-inner");
    const src = img.attr("src") || img.attr("data-src") || "";
    const caption = captionEl.text().trim() || $(el).contents().filter(function() { return this.type === "text"; }).text().trim();
    console.log(`Image: ${src.substring(0, 100)}`);
    console.log(`Caption: ${caption}`);
    console.log(`Full HTML: ${$(el).html().substring(0, 400)}`);
    console.log();
  });

  // 4. Teaser container
  console.log("=== TEASER CONTAINER ===");
  $(".teaser_container").each((i, el) => {
    console.log(`Teaser: ${$(el).text().trim()}`);
    console.log(`HTML: ${$(el).html().substring(0, 300)}`);
  });

  // 5. Contributor row
  console.log("\n=== CONTRIBUTOR ROW ===");
  $(".row").each((i, el) => {
    const text = $(el).text().trim();
    if (text.includes("Contributor") || text.includes("Journalist")) {
      console.log(`Contributor: ${text.substring(0, 200)}`);
    }
  });

  // 6. ALL iframes (including sidebar)
  console.log("\n=== ALL IFRAMES ===");
  $("iframe").each((i, el) => {
    const src = $(el).attr("src") || "";
    const parent = $(el).parent();
    const parentCls = parent.attr("class") || "";
    console.log(`iframe: src="${src}" parent="${parent[0]?.tagName}.${parentCls}"`);
  });
}

main().catch(console.error);
