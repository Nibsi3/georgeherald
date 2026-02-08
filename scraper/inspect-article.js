const axios = require("axios");
const cheerio = require("cheerio");

const URL = "https://www.georgeherald.com/Sport/Article/Golf/teen-sensation-coetzer-clinches-africa-amateur-women-s-invitational-202602070808";

async function main() {
  const res = await axios.get(URL, { headers: { "User-Agent": "Mozilla/5.0" } });
  const $ = cheerio.load(res.data);

  // Find article content area
  const content = $(".col-lg-24").first();
  content.find("script, style, .article_link_chain").remove();

  console.log("=== CHILDREN OF .col-lg-24 ===\n");
  content.children().each((i, child) => {
    const tag = child.tagName;
    const el = $(child);
    const cls = el.attr("class") || "";
    const style = el.attr("style") || "";
    const txt = el.text().trim().substring(0, 150);
    if (txt.length < 3) return;
    
    // Show HTML for interesting elements (bold, figcaption, etc.)
    const html = el.html().trim().substring(0, 300);
    const hasBold = html.includes("<strong>") || html.includes("<b>") || html.includes("font-weight");
    const hasCaption = tag === "figcaption" || html.includes("figcaption") || html.includes("caption");
    
    let flags = "";
    if (hasBold) flags += " [BOLD]";
    if (hasCaption) flags += " [CAPTION]";
    if (style) flags += ` [style="${style.substring(0, 80)}"]`;
    
    console.log(`${i}. <${tag} class="${cls}">${flags}`);
    console.log(`   TEXT: ${txt}`);
    if (hasBold || hasCaption || tag === "blockquote" || tag === "figure") {
      console.log(`   HTML: ${html}`);
    }
    console.log();
  });

  // Also look for image captions specifically
  console.log("=== IMAGE CAPTIONS ===\n");
  $("figcaption, .caption, .photo-caption, .image-caption, .wp-caption-text").each((i, el) => {
    console.log(`Caption ${i}: ${$(el).text().trim().substring(0, 200)}`);
  });

  // Check how images are structured
  console.log("\n=== ARTICLE IMAGES WITH CONTEXT ===\n");
  $("img").each((i, el) => {
    const src = $(el).attr("src") || "";
    if (!src.includes("cms.groupeditors.com")) return;
    if (src.includes("george_herald.jpg")) return;
    
    const parent = $(el).parent();
    const parentTag = parent[0]?.tagName || "?";
    const parentClass = parent.attr("class") || "";
    
    // Check for caption in sibling or parent's children
    const nextSib = $(el).next();
    const parentNext = parent.next();
    
    console.log(`IMG: ${src.substring(0, 100)}`);
    console.log(`  Parent: <${parentTag} class="${parentClass}">`);
    console.log(`  Next sibling text: ${nextSib.text().trim().substring(0, 150)}`);
    console.log(`  Parent's next: <${parentNext[0]?.tagName}> ${parentNext.text().trim().substring(0, 150)}`);
    console.log();
  });

  // Look for bold paragraphs (intro text)
  console.log("=== BOLD/STRONG PARAGRAPHS ===\n");
  content.find("p, div").each((i, el) => {
    const html = $(el).html() || "";
    const text = $(el).text().trim();
    if (text.length < 20) return;
    
    // Check if the entire paragraph is bold
    const strippedHtml = html.replace(/<br\s*\/?>/g, "").trim();
    if (strippedHtml.startsWith("<strong>") || strippedHtml.startsWith("<b>")) {
      const style = $(el).attr("style") || "";
      console.log(`BOLD P: ${text.substring(0, 200)}`);
      console.log(`  style: ${style}`);
      console.log(`  html: ${html.substring(0, 300)}`);
      console.log();
    }
  });

  // Look for blockquotes
  console.log("=== BLOCKQUOTES ===\n");
  content.find("blockquote").each((i, el) => {
    console.log(`BQ ${i}: ${$(el).text().trim().substring(0, 300)}`);
    console.log();
  });

  // Look for iframes (video embeds)
  console.log("=== IFRAMES ===\n");
  $("iframe").each((i, el) => {
    const src = $(el).attr("src") || "";
    console.log(`iframe ${i}: ${src}`);
  });
}

main().catch(console.error);
