/**
 * INKFORGE — PHASE 8 COMPREHENSIVE VERIFICATION SUITE
 * Mobile-First Experience, Responsive UI & PWA Readiness
 *
 * Scenarios Tested:
 * 1.  Viewport Configuration (device-width, initialScale 1, maximumScale 5, viewportFit cover, dual theme color)
 * 2.  PWA Metadata & Apple Web App Integration (manifest, appleWebApp capable, black-translucent)
 * 3.  Web App Manifest Generation (display standalone, background, theme, icons)
 * 4.  Mobile CSS Utilities & Safe-Area Insets (.pt-safe, .pb-safe, .pl-safe, .pr-safe, env(safe-area-inset-*))
 * 5.  Touch & Momentum Scroll Helpers (.touch-scroll, .no-scrollbar, .touch-manipulation)
 * 6.  Auth Modal Virtual Keyboard Hardening (max-h 90dvh, overscroll-contain, 16px iOS zoom guard, 44px touch target)
 * 7.  Collections Modal Virtual Keyboard Hardening (max-h 90dvh, overscroll-contain, 16px zoom guard, 44px hit targets)
 * 8.  Writing Studio Toolbar Single-Ribbon Touch Navigation (overflow-x-auto, no-scrollbar, touch-scroll)
 * 9.  Writing Studio Toolbar Button Hitboxes (min 36px/44px touch targets on mobile)
 * 10. Writing Studio Popovers Viewport Width Containment (max-w-[calc(100vw-2rem)])
 * 11. Writing Studio AI Copilot Mobile Bottom-Sheet Drawer & Backdrop (<lg vs lg+)
 * 12. Writing Studio Header & Modals Small Screen Containment (manuscript title max-w, modal max-h)
 * 13. Public Reading Folio Responsive Geometry (narrow margin padding, return link responsive layout)
 * 14. Discover Page Search Input iOS Zoom Guard (text-base sm:text-sm)
 * 15. Regression & Integrity Check: Database Connection, Document Lifecycle, Publishing & Teardown
 */

import fs from "fs";
import path from "path";
import manifest from "../app/manifest";
import { checkDatabaseConnection, prisma } from "../lib/db";
import { AuthService } from "../lib/services/auth.service";
import { DocumentService } from "../lib/services/document.service";

async function runPhase8Verification() {
  console.log("================================================================================");
  console.log("         INKFORGE PHASE 8: MOBILE-FIRST EXPERIENCE & PWA READINESS               ");
  console.log("    Responsive Studio, Touch Ergonomics, Safe Insets & Mobile Folio Reading     ");
  console.log("================================================================================\n");

  (process.env as any).NODE_ENV = "test";
  const runId = Date.now().toString().slice(-6);

  // --------------------------------------------------------------------------
  // 1. Viewport Configuration (src/app/layout.tsx)
  // --------------------------------------------------------------------------
  console.log("[Test 1] Verifying Next.js Viewport Configuration in layout.tsx...");
  const layoutCode = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
  if (!layoutCode.includes("export const viewport: Viewport =")) {
    throw new Error("Viewport export is missing in src/app/layout.tsx");
  }
  if (!layoutCode.includes('width: "device-width"')) {
    throw new Error("Expected viewport width 'device-width'");
  }
  if (!layoutCode.includes("initialScale: 1")) {
    throw new Error("Expected initialScale 1");
  }
  if (!layoutCode.includes("maximumScale: 5")) {
    throw new Error("Expected maximumScale 5 (accessible pinch-to-zoom)");
  }
  if (!layoutCode.includes('viewportFit: "cover"')) {
    throw new Error("Expected viewportFit 'cover' for notch/island edge-to-edge support");
  }
  if (!layoutCode.includes("themeColor:") || !layoutCode.includes("prefers-color-scheme: dark") || !layoutCode.includes("prefers-color-scheme: light")) {
    throw new Error("Expected dual themeColor entries for dark and light media schemes");
  }
  console.log("  ✓ Viewport correctly configured (device-width, initialScale: 1, maxScale: 5, cover, dual theme color)\n");

  // --------------------------------------------------------------------------
  // 2. PWA Metadata & Apple Web App Integration (src/app/layout.tsx)
  // --------------------------------------------------------------------------
  console.log("[Test 2] Verifying PWA Metadata in layout.tsx...");
  if (!layoutCode.includes('manifest: "/manifest.webmanifest"')) {
    throw new Error("Expected metadata.manifest to be '/manifest.webmanifest'");
  }
  if (!layoutCode.includes("appleWebApp: {") || !layoutCode.includes("capable: true") || !layoutCode.includes('statusBarStyle: "black-translucent"')) {
    throw new Error("Expected appleWebApp metadata object with capable: true and black-translucent status bar");
  }
  if (!layoutCode.includes("formatDetection: {") || !layoutCode.includes("telephone: false")) {
    throw new Error("Expected formatDetection with telephone: false");
  }
  console.log("  ✓ PWA metadata correctly specified (manifest, appleWebApp capable, black-translucent)\n");

  // --------------------------------------------------------------------------
  // 3. Web App Manifest Generation (src/app/manifest.ts)
  // --------------------------------------------------------------------------
  console.log("[Test 3] Verifying Web App Manifest Generator (manifest.ts)...");
  const manifestData = manifest();
  if (manifestData.display !== "standalone") {
    throw new Error(`Expected display 'standalone', got: ${manifestData.display}`);
  }
  if (manifestData.start_url !== "/") {
    throw new Error(`Expected start_url '/', got: ${manifestData.start_url}`);
  }
  if (manifestData.background_color !== "#0f1012") {
    throw new Error(`Expected background_color '#0f1012', got: ${manifestData.background_color}`);
  }
  if (manifestData.theme_color !== "#831e26") {
    throw new Error(`Expected theme_color '#831e26', got: ${manifestData.theme_color}`);
  }
  if (!manifestData.icons || manifestData.icons.length < 2) {
    throw new Error("Expected at least 2 icon sizes in manifest (192 and 512)");
  }
  const has192 = manifestData.icons.some((i) => i.sizes === "192x192" && i.purpose === "maskable");
  const has512 = manifestData.icons.some((i) => i.sizes === "512x512" && i.purpose === "maskable");
  if (!has192 || !has512) {
    throw new Error("Manifest must include 192x192 and 512x512 maskable icons");
  }
  console.log("  ✓ Web App Manifest verified (standalone, colors, maskable icons)\n");

  // --------------------------------------------------------------------------
  // 4. Mobile CSS Utilities & Safe Area Insets (src/app/globals.css)
  // --------------------------------------------------------------------------
  console.log("[Test 4] Verifying Mobile Safe Area Utilities in globals.css...");
  const globalsCss = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
  const hasPtSafe = globalsCss.includes(".pt-safe") && globalsCss.includes("safe-area-inset-top");
  const hasPbSafe = globalsCss.includes(".pb-safe") && globalsCss.includes("safe-area-inset-bottom");
  const hasPlSafe = globalsCss.includes(".pl-safe") && globalsCss.includes("safe-area-inset-left");
  const hasPrSafe = globalsCss.includes(".pr-safe") && globalsCss.includes("safe-area-inset-right");
  if (!hasPtSafe || !hasPbSafe || !hasPlSafe || !hasPrSafe) {
    throw new Error("globals.css missing safe-area-inset utilities (.pt-safe, .pb-safe, etc.)");
  }
  console.log("  ✓ Safe-area inset utilities verified (.pt-safe, .pb-safe, .pl-safe, .pr-safe)\n");

  // --------------------------------------------------------------------------
  // 5. Touch Scrolling & Scrollbar Utilities (src/app/globals.css)
  // --------------------------------------------------------------------------
  console.log("[Test 5] Verifying Touch Momentum & Scrollbar Utilities in globals.css...");
  const hasTouchScroll = globalsCss.includes(".touch-scroll") && globalsCss.includes("-webkit-overflow-scrolling: touch");
  const hasNoScrollbar = globalsCss.includes(".no-scrollbar") && globalsCss.includes("scrollbar-width: none");
  const hasTouchManipulation = globalsCss.includes(".touch-manipulation") && globalsCss.includes("touch-action: manipulation");
  if (!hasTouchScroll || !hasNoScrollbar || !hasTouchManipulation) {
    throw new Error("globals.css missing momentum scrolling or touch manipulation utilities");
  }
  console.log("  ✓ Touch scroll, scrollbar concealment, and touch-manipulation utilities verified\n");

  // --------------------------------------------------------------------------
  // 6. Auth Modal Virtual Keyboard Hardening (src/components/auth/SignInModal.tsx)
  // --------------------------------------------------------------------------
  console.log("[Test 6] Verifying Auth Modal Mobile Keyboard & Touch Hardening...");
  const signInModal = fs.readFileSync(path.join(process.cwd(), "src/components/auth/SignInModal.tsx"), "utf8");
  if (!signInModal.includes("max-h-[90dvh]") || !signInModal.includes("overscroll-contain")) {
    throw new Error("SignInModal container must have max-h-[90dvh] and overscroll-contain");
  }
  if (!signInModal.includes("text-base sm:text-sm")) {
    throw new Error("SignInModal inputs must use text-base sm:text-sm to prevent iOS Safari auto-zoom");
  }
  if (!signInModal.includes("min-h-[44px]")) {
    throw new Error("SignInModal submit button must have min-h-[44px] touch hitbox");
  }
  console.log("  ✓ Auth modal protected against virtual keyboard clipping and iOS focus-zoom\n");

  // --------------------------------------------------------------------------
  // 7. Collections Modals Mobile Keyboard Hardening
  // --------------------------------------------------------------------------
  console.log("[Test 7] Verifying Collections Modals Virtual Keyboard Hardening...");
  const addToCollectionModal = fs.readFileSync(
    path.join(process.cwd(), "src/components/collections/AddToCollectionModal.tsx"),
    "utf8"
  );
  if (!addToCollectionModal.includes("max-h-[90dvh]") || !addToCollectionModal.includes("overscroll-contain")) {
    throw new Error("AddToCollectionModal must have max-h-[90dvh] and overscroll-contain");
  }
  if (!addToCollectionModal.includes("text-base sm:text-xs")) {
    throw new Error("AddToCollectionModal inputs must use text-base sm:text-xs to prevent iOS Safari auto-zoom");
  }

  const collectionsPage = fs.readFileSync(path.join(process.cwd(), "src/app/collections/page.tsx"), "utf8");
  if (!collectionsPage.includes("max-h-[90dvh] overflow-y-auto overscroll-contain")) {
    throw new Error("Collections create/edit modals must have max-h-[90dvh] and overscroll-contain");
  }
  console.log("  ✓ Collections modals protected against viewport overflow and keyboard obscuring\n");

  // --------------------------------------------------------------------------
  // 8. Writing Studio Toolbar Single-Ribbon Touch Navigation (src/components/editor/Editor.tsx)
  // --------------------------------------------------------------------------
  console.log("[Test 8] Verifying Editor Toolbar Single-Ribbon Touch Navigation...");
  const editorCode = fs.readFileSync(path.join(process.cwd(), "src/components/editor/Editor.tsx"), "utf8");
  if (!editorCode.includes("overflow-x-auto") || !editorCode.includes("no-scrollbar") || !editorCode.includes("touch-scroll")) {
    throw new Error("Editor toolbar must use overflow-x-auto, no-scrollbar, and touch-scroll for smooth mobile ribbon interaction");
  }
  if (!editorCode.includes("sm:flex-wrap")) {
    throw new Error("Editor toolbar must preserve wrap layout on desktop screens (sm:flex-wrap)");
  }
  console.log("  ✓ Editor toolbar features horizontal momentum scroll ribbon on mobile with desktop wrap\n");

  // --------------------------------------------------------------------------
  // 9. Writing Studio Toolbar Button Hitboxes (src/components/editor/Editor.tsx)
  // --------------------------------------------------------------------------
  console.log("[Test 9] Verifying Editor Toolbar Touch Hitboxes...");
  if (!editorCode.includes("min-h-[36px] min-w-[36px]") && !editorCode.includes("min-h-[44px]")) {
    throw new Error("Editor toolbar buttons must feature minimum touch hitboxes for finger tapping");
  }
  console.log("  ✓ Editor toolbar buttons feature tactile touch hitboxes\n");

  // --------------------------------------------------------------------------
  // 10. Writing Studio Popovers Viewport Width Containment (src/components/editor/Editor.tsx)
  // --------------------------------------------------------------------------
  console.log("[Test 10] Verifying Editor Popovers Viewport Width Containment...");
  if (!editorCode.includes("max-w-[calc(100vw-2rem)]") && !editorCode.includes("max-w-[calc(100vw-1.5rem)]")) {
    throw new Error("Editor popovers must be bounded with max-w-[calc(100vw-...)] to prevent horizontal viewport breakout on 320px screens");
  }
  console.log("  ✓ Editor popovers and dialogs bounded within viewport width\n");

  // --------------------------------------------------------------------------
  // 11. Writing Studio AI Copilot Mobile Bottom-Sheet Drawer (src/app/(studio)/write/page.tsx)
  // --------------------------------------------------------------------------
  console.log("[Test 11] Verifying AI Copilot Mobile Bottom-Sheet Drawer & Overlay...");
  const writePage = fs.readFileSync(path.join(process.cwd(), "src/app/(studio)/write/page.tsx"), "utf8");
  if (!writePage.includes("fixed inset-x-0 bottom-0 top-12 z-50 rounded-t-2xl") || !writePage.includes("lg:static")) {
    throw new Error("AI Copilot must render as a fixed bottom-sheet drawer on mobile (<lg) and static sidebar on desktop (lg+)");
  }
  if (!writePage.includes("fixed inset-0 bg-black/60") || !writePage.includes("lg:hidden")) {
    throw new Error("AI Copilot must provide a mobile backdrop overlay to dismiss on tap");
  }
  console.log("  ✓ AI Copilot renders as an accessible bottom-sheet drawer on mobile and sidebar on desktop\n");

  // --------------------------------------------------------------------------
  // 12. Writing Studio Small Screen Header & Modal Hardening (src/app/(studio)/write/page.tsx)
  // --------------------------------------------------------------------------
  console.log("[Test 12] Verifying Studio Header & Modals Small Screen Containment...");
  if (!writePage.includes("max-w-[calc(100vw-3rem)] sm:max-w-md")) {
    throw new Error("Manuscript title in studio header must be bounded on narrow viewports");
  }
  if (!writePage.includes("max-h-[90dvh]") || !writePage.includes("max-h-[85dvh]")) {
    throw new Error("Studio publication and revision modals must feature max-h dvh bounds");
  }
  console.log("  ✓ Studio header and publishing modals properly bounded for mobile viewports\n");

  // --------------------------------------------------------------------------
  // 13. Public Reading Folio Responsive Geometry (src/app/(reader)/read/[slug]/page.tsx)
  // --------------------------------------------------------------------------
  console.log("[Test 13] Verifying Public Reading Folio Responsive Geometry...");
  const readerPage = fs.readFileSync(path.join(process.cwd(), "src/app/(reader)/read/[slug]/page.tsx"), "utf8");
  if (!readerPage.includes("px-4 py-8 sm:py-12 sm:px-6")) {
    throw new Error("Reader page must feature responsive padding for small mobile devices");
  }
  if (!readerPage.includes('hidden sm:inline">Return to </span>Frontispiece') || !readerPage.includes("flex flex-wrap items-center justify-between")) {
    throw new Error("Reader return navigation must adapt on narrow screens");
  }
  console.log("  ✓ Public reader folio provides comfortable reading padding across screen sizes\n");

  // --------------------------------------------------------------------------
  // 14. Discover Page Search Input iOS Zoom Guard (src/app/discover/page.tsx)
  // --------------------------------------------------------------------------
  console.log("[Test 14] Verifying Discover Page Search Input iOS Zoom Guard...");
  const discoverPage = fs.readFileSync(path.join(process.cwd(), "src/app/discover/page.tsx"), "utf8");
  if (!discoverPage.includes("text-base sm:text-sm")) {
    throw new Error("Discover search input must use text-base sm:text-sm to prevent iOS Safari auto-zoom");
  }
  console.log("  ✓ Discover search input verified against iOS focus-zoom\n");

  // --------------------------------------------------------------------------
  // 15. Regression & Integrity Check: Database Connection & Document Lifecycle
  // --------------------------------------------------------------------------
  console.log("[Test 15] Running End-to-End Regression & Document Lifecycle Integrity...");
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.status !== "connected") {
    throw new Error(`Database connection failed: ${dbHealth.error}`);
  }

  const testEmail = `mobile.author.${runId}@inkforge.test`;
  const regAuthor = await AuthService.register({
    email: testEmail,
    username: `mobile_author_${runId}`,
    displayName: "Mobile Scribe",
    password: "PasswordMobile123!",
  });
  const authorId = regAuthor.user.id;

  // Create document
  const draftDoc = await DocumentService.createDocument(
    {
      title: `Mobile Manuscript ${runId}`,
      contentHtml: "<p>Composed upon a pocket folio beneath the evening sky.</p>",
    },
    authorId
  );
  if (!draftDoc.id) throw new Error("Failed to create document");

  // Update document (autosave test)
  const updatedDoc = await DocumentService.updateDocument(
    draftDoc.id,
    {
      contentHtml: "<p>Composed upon a pocket folio beneath the evening sky. Revised on mobile device.</p>",
      expectedVersion: draftDoc.version,
    },
    authorId
  );
  if (updatedDoc.version !== draftDoc.version + 1) {
    throw new Error(`Expected incremented version, got ${updatedDoc.version}`);
  }

  // Publish document
  const publishedDoc = await DocumentService.publishDocument(draftDoc.id, authorId);
  if (publishedDoc.status !== "PUBLISHED") {
    throw new Error("Document publication failed");
  }

  // Retrieve published document by slug
  const publicFolio = await DocumentService.getDocumentBySlug(publishedDoc.slug!);
  if (!publicFolio || publicFolio.id !== draftDoc.id) {
    throw new Error("Failed to retrieve public folio by slug");
  }

  // Teardown test records
  await prisma.postRevision.deleteMany({ where: { postId: draftDoc.id } });
  await prisma.post.delete({ where: { id: draftDoc.id } });
  await prisma.verificationToken.deleteMany({ where: { userId: authorId } });
  await prisma.profile.deleteMany({ where: { userId: authorId } });
  await prisma.session.deleteMany({ where: { userId: authorId } });
  await prisma.user.delete({ where: { id: authorId } });

  console.log("  ✓ Complete document lifecycle verified (create, save, publish, public slug retrieval, teardown)\n");

  console.log("================================================================================");
  console.log("    ✓ ALL 15 PHASE 8 VERIFICATION SCENARIOS COMPLETED SUCCESSFULLY!             ");
  console.log("================================================================================");
}

runPhase8Verification().catch((err) => {
  console.error("\n❌ PHASE 8 VERIFICATION FAILED:", err);
  process.exit(1);
});
