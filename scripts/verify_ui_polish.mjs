import fs from "fs";
import assert from "assert";

console.log("================================================================================");
console.log("            INKFORGE — THEME AWARENESS & UI POLISH VERIFICATION SUITE           ");
console.log("================================================================================");

let passed = 0;
let total = 0;

function test(description, fn) {
  total++;
  try {
    fn();
    console.log(`✓ [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`✗ [FAIL] ${description}:`, err.message);
  }
}

// 1. Verify CSS rules in globals.css
const globalsCss = fs.readFileSync("src/app/globals.css", "utf8");

test("globals.css defines --paper-border-strong for .tone-cotton, .tone-vellum, and .tone-inkwell", () => {
  assert(globalsCss.includes("--paper-border-strong: #c8bd9f;"), "Cotton missing --paper-border-strong");
  assert(globalsCss.includes("--paper-border-strong: #beac8c;"), "Vellum missing --paper-border-strong");
  assert(globalsCss.includes("--paper-border-strong: #404552;"), "Inkwell missing --paper-border-strong");
});

test("globals.css defines .tone-vellum .book-cloth-permanent with warm antiquarian parchment palette", () => {
  assert(globalsCss.includes(".tone-vellum .book-cloth-permanent"), "Missing .tone-vellum .book-cloth-permanent");
  assert(globalsCss.includes("background-color: #dfcead;"), "Missing Vellum background color #dfcead");
  assert(globalsCss.includes("border-color: #cbb894;"), "Missing Vellum border color #cbb894");
  assert(globalsCss.includes("color: #201a14;"), "Missing Vellum text color #201a14");
});

test("globals.css defines .tone-vellum .french-groove and .book-spine-crease", () => {
  assert(globalsCss.includes(".tone-vellum .french-groove"), "Missing Vellum french groove");
  assert(globalsCss.includes(".tone-vellum .book-spine-crease"), "Missing Vellum spine crease");
});

test("globals.css defines .tone-vellum book cover typography and debossing overrides", () => {
  assert(globalsCss.includes(".tone-vellum .book-cover-title"), "Missing .book-cover-title override");
  assert(globalsCss.includes(".tone-vellum .book-cover-kicker"), "Missing .book-cover-kicker override");
  assert(globalsCss.includes(".tone-vellum .book-cover-crest"), "Missing .book-cover-crest override");
  assert(globalsCss.includes(".tone-vellum .book-cover-subcolophon"), "Missing .book-cover-subcolophon override");
  assert(globalsCss.includes(".tone-vellum .gold-foil-stamp"), "Missing .gold-foil-stamp override");
  assert(globalsCss.includes(".tone-vellum .letterpress-bookplate"), "Missing .letterpress-bookplate override");
  assert(globalsCss.includes(".tone-vellum .bookplate-label"), "Missing .bookplate-label override");
  assert(globalsCss.includes(".tone-vellum .bookplate-action"), "Missing .bookplate-action override");
  assert(globalsCss.includes(".tone-vellum .book-cover-kbd"), "Missing .book-cover-kbd override");
});

// 2. Verify PhysicalBook.tsx cover elements have theme classes
const physicalBook = fs.readFileSync("src/components/landing/PhysicalBook.tsx", "utf8");

test("PhysicalBook.tsx contains theme-aware classes on closed permanent cover", () => {
  assert(physicalBook.includes("book-spine-crease"), "Missing book-spine-crease class");
  assert(physicalBook.includes("tone-vellum-frame-outer"), "Missing tone-vellum-frame-outer");
  assert(physicalBook.includes("tone-vellum-frame-inner"), "Missing tone-vellum-frame-inner");
  assert(physicalBook.includes("book-cover-crest"), "Missing book-cover-crest");
  assert(physicalBook.includes("book-cover-subcolophon"), "Missing book-cover-subcolophon");
  assert(physicalBook.includes("book-cover-kicker"), "Missing book-cover-kicker");
  assert(physicalBook.includes("book-cover-title"), "Missing book-cover-title");
  assert(physicalBook.includes("book-cover-motto"), "Missing book-cover-motto");
  assert(physicalBook.includes("book-cover-edition"), "Missing book-cover-edition");
  assert(physicalBook.includes("book-cover-bookplate-divider"), "Missing book-cover-bookplate-divider");
  assert(physicalBook.includes("bookplate-label"), "Missing bookplate-label");
  assert(physicalBook.includes("bookplate-action"), "Missing bookplate-action");
  assert(physicalBook.includes("book-cover-kbd-hint"), "Missing book-cover-kbd-hint");
  assert(physicalBook.includes("book-cover-kbd"), "Missing book-cover-kbd");
});

test("PhysicalBook.tsx safe chapter / item counter prevents out-of-bounds access", () => {
  assert(physicalBook.includes("BOOK_CHAPTERS[activeChapterIndex]?.roman || \"I\""), "Missing safe optional chaining on BOOK_CHAPTERS");
  assert(physicalBook.includes("getAdaptiveMenuItems(book.state).length"), "Missing safe item count for author book mode");
});

// 3. Verify RootLayout inline theme initialization script
const layoutTsx = fs.readFileSync("src/app/layout.tsx", "utf8");

test("RootLayout includes inline script for instant theme persistence on reload", () => {
  assert(layoutTsx.includes("localStorage.getItem('inkforge_paper_tone')"), "Missing localStorage theme check in layout script");
  assert(layoutTsx.includes("suppressHydrationWarning"), "Missing suppressHydrationWarning on html tag");
  assert(layoutTsx.includes("tone-vellum"), "Missing tone-vellum in layout script");
  assert(layoutTsx.includes("tone-inkwell"), "Missing tone-inkwell in layout script");
});

// 4. Verify homepage dispatches are real functional links
const pageTsx = fs.readFileSync("src/app/page.tsx", "utf8");

test("Homepage Gazetteer dispatches are wrapped in Link to /discover", () => {
  assert(pageTsx.includes("<Link\n                      href=\"/discover\"\n                      className=\"block group/dispatch"), "Dispatches missing Link wrapper");
});

// 5. Verify no undefined CSS variables across codebase
test("All CSS variable usages in src/ are defined in globals.css", () => {
  const definedVars = new Set();
  for (const match of globalsCss.matchAll(/--[a-zA-Z0-9_-]+/g)) {
    definedVars.add(match[0]);
  }

  function scan(dir) {
    for (const f of fs.readdirSync(dir)) {
      const full = `${dir}/${f}`;
      if (fs.statSync(full).isDirectory()) {
        if (f !== "node_modules" && f !== ".next") scan(full);
      } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
        const c = fs.readFileSync(full, "utf8");
        for (const m of c.matchAll(/var\((--[a-zA-Z0-9_-]+)\)/g)) {
          assert(definedVars.has(m[1]), `Undefined CSS variable ${m[1]} in ${full}`);
        }
      }
    }
  }
  scan("src");
});

console.log(`\nResults: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%).`);
if (passed !== total) process.exit(1);
