const axios = require("axios");
const cheerio = require("cheerio");

async function main() {
  const url = "https://www.georgeherald.com/News/Article/General-News/radiologist-dr-pieter-henning-faces-fresh-negligence-complaint-following-patient-s-death-202601300913";
  const res = await axios.get(url, { headers: { "User-Agent": "GeorgeHeraldRedesign/2.0" }, timeout: 15000 });
  const $ = cheerio.load(res.data);

  // Check .article-content-wrapper structure
  const wrapper = $(".article-content-wrapper");
  if (wrapper.length) {
    console.log("=== .article-content-wrapper found ===");
    console.log("Direct children tags:");
    wrapper.children().each((i, el) => {
      const tag = el.tagName;
      const text = $(el).text().trim().slice(0, 80);
      const cls = $(el).attr("class") || "";
      console.log(`  [${i}] <${tag}${cls ? ' class="' + cls + '"' : ''}> "${text}"`);
    });
    console.log("\n=== Inner HTML (first 3000 chars) ===");
    console.log(wrapper.html().slice(0, 3000));
  } else {
    console.log("No .article-content-wrapper found");
    // Try .col-lg-24
    const mainCol = $(".col-lg-24").first();
    if (mainCol.length) {
      console.log("=== .col-lg-24 found ===");
      console.log("Direct children tags:");
      mainCol.children().each((i, el) => {
        const tag = el.tagName;
        const text = $(el).text().trim().slice(0, 60);
        console.log(`  [${i}] <${tag}> "${text}"`);
      });
      console.log("\n=== Inner HTML (first 3000 chars) ===");
      console.log(mainCol.html().slice(0, 3000));
    }
  }
}

main().catch(console.error);
