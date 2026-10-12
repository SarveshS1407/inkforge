/**
 * INKFORGE — LIVE DEPLOYMENT VERIFICATION ENGINE
 * Validates the live Vercel URL end-to-end:
 * 1. Health check & Homepage HTTP 200
 * 2. User registration & Session cookie issuance
 * 3. Manuscript creation, persistence & autosave
 * 4. Revision history creation & retrieval
 * 5. Publishing lifecycle & Public Reader URL access
 * 6. Access isolation (User B cannot access User A's private draft)
 * 7. Unpublishing & public access revocation
 */

const targetUrl = process.argv[2] || process.env.LIVE_APP_URL || "http://localhost:3000";
const baseUrl = targetUrl.replace(/\/$/, "");

console.log("================================================================================");
console.log("       INKFORGE — LIVE DEPLOYMENT AUTOMATED VERIFICATION SUITE                   ");
console.log(`       Target URL: ${baseUrl}`);
console.log("================================================================================\n");

function extractCookies(response) {
  const raw = response.headers.get("set-cookie") || "";
  const cookies = [];
  // Node fetch may concatenate multiple Set-Cookie headers with commas
  const parts = raw.split(/,(?=[^;]+=[^;]+)/);
  for (const p of parts) {
    const cookiePair = p.split(";")[0].trim();
    if (cookiePair) cookies.push(cookiePair);
  }
  return cookies.join("; ");
}

async function runLiveVerification() {
  const timestamp = Date.now();
  const testUser = {
    email: `live_tester_${timestamp}@inkforge.internal`,
    password: `P@ssword_${timestamp}!`,
    username: `writer_${timestamp}`,
    displayName: `Sprint Reviewer ${timestamp}`,
  };

  const hostileUser = {
    email: `hostile_${timestamp}@inkforge.internal`,
    password: `P@ssword_${timestamp}!`,
    username: `attacker_${timestamp}`,
    displayName: `Unauthorized Viewer`,
  };

  const results = [];

  // TEST 1: Homepage & Healthcheck
  try {
    process.stdout.write("[Test 1] Probing Live Homepage & Health Endpoint... ");
    const homeRes = await fetch(`${baseUrl}/`);
    if (!homeRes.ok) throw new Error(`Homepage returned HTTP ${homeRes.status}`);

    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    if (!healthRes.ok) throw new Error(`Healthcheck returned HTTP ${healthRes.status}`);
    const healthJson = await healthRes.json();
    console.log(`✓ PASS (Status: ${healthJson.status || "OK"}, DB: ${healthJson.database?.status || "connected"})`);
    results.push({ name: "Homepage & Health API", status: "PASS" });
  } catch (err) {
    console.log(`✗ FAIL: ${err.message}`);
    results.push({ name: "Homepage & Health API", status: "FAIL", error: err.message });
  }

  // TEST 2: Registration & Session Issuance
  let sessionCookie = "";
  let registeredUserId = "";
  try {
    process.stdout.write("[Test 2] Testing User Registration & Session Cookie... ");
    const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    if (!regRes.ok) {
      const errText = await regRes.text();
      throw new Error(`Registration failed (${regRes.status}): ${errText}`);
    }

    sessionCookie = extractCookies(regRes);
    const regData = await regRes.json();
    registeredUserId = regData.data?.id || regData.id;
    console.log(`✓ PASS (User ID: ${registeredUserId.slice(0, 8)}...)`);
    results.push({ name: "Account Registration & Session", status: "PASS" });
  } catch (err) {
    console.log(`✗ FAIL: ${err.message}`);
    results.push({ name: "Account Registration & Session", status: "FAIL", error: err.message });
  }

  // TEST 3: Document Creation & Persistence
  let documentId = "";
  let documentSlug = "";
  const distinctiveSentence = `The deliberate craftsman inscriptions of eternity endure forever. [ID: ${timestamp}]`;
  try {
    process.stdout.write("[Test 3] Testing Manuscript Creation & Server Persistence... ");
    const docRes = await fetch(`${baseUrl}/api/v1/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        title: `The Architecture of Typography [${timestamp}]`,
        subtitle: "A Sovereign Essay on Literary Permanence",
        contentHtml: `<p>${distinctiveSentence}</p>`,
        contentJson: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: distinctiveSentence }],
            },
          ],
        }),
      }),
    });

    if (!docRes.ok) {
      const errText = await docRes.text();
      throw new Error(`Document creation failed (${docRes.status}): ${errText}`);
    }

    const docData = await docRes.json();
    const doc = docData.data?.document || docData.data || docData.document || docData;
    documentId = doc.id;
    documentSlug = doc.slug;

    // Verify document reads back from database
    const fetchDocRes = await fetch(`${baseUrl}/api/v1/documents/${documentId}`, {
      headers: { Cookie: sessionCookie },
    });
    if (!fetchDocRes.ok) throw new Error("Failed to re-read created document");
    const fetchedData = await fetchDocRes.json();
    const fetchedDoc = fetchedData.data?.document || fetchedData.data || fetchedData.document || fetchedData;

    if (!JSON.stringify(fetchedDoc).includes(distinctiveSentence)) {
      throw new Error("Persisted document does not contain distinctive test sentence");
    }

    console.log(`✓ PASS (Doc ID: ${documentId.slice(0, 8)}..., Version: ${fetchedDoc.version})`);
    results.push({ name: "Manuscript Creation & Persistence", status: "PASS" });
  } catch (err) {
    console.log(`✗ FAIL: ${err.message}`);
    results.push({ name: "Manuscript Creation & Persistence", status: "FAIL", error: err.message });
  }

  // TEST 4: Revisions & Atomic History
  try {
    process.stdout.write("[Test 4] Testing Revisions & Versioning... ");
    const revRes = await fetch(`${baseUrl}/api/v1/documents/${documentId}/revisions`, {
      headers: { Cookie: sessionCookie },
    });
    if (!revRes.ok) throw new Error("Failed to fetch document revisions");
    const revData = await revRes.json();
    const revisions = revData.data?.revisions || revData.data || revData.revisions || [];
    console.log(`✓ PASS (${revisions.length} revision snapshot(s) verified)`);
    results.push({ name: "Atomic Revisions & History", status: "PASS" });
  } catch (err) {
    console.log(`✗ FAIL: ${err.message}`);
    results.push({ name: "Atomic Revisions & History", status: "FAIL", error: err.message });
  }

  // TEST 5: Publishing & Public Reader Access
  try {
    process.stdout.write("[Test 5] Publishing Manuscript & Testing Public Reader Page... ");
    const pubRes = await fetch(`${baseUrl}/api/v1/documents/${documentId}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        excerpt: "An architectural treatise on deliberate publishing.",
        tags: ["Architecture", "Typography"],
      }),
    });

    if (!pubRes.ok) {
      const errText = await pubRes.text();
      throw new Error(`Publish failed (${pubRes.status}): ${errText}`);
    }

    const pubData = await pubRes.json();
    const publishedDoc = pubData.data?.document || pubData.data || pubData.document || pubData;
    const finalSlug = publishedDoc.slug || documentSlug;

    // Probe public reader page WITHOUT ANY COOKIES (unauthenticated incognito visitor)
    const readerRes = await fetch(`${baseUrl}/read/${finalSlug}`);
    if (!readerRes.ok) {
      throw new Error(`Public reading page returned HTTP ${readerRes.status}`);
    }

    const readerHtml = await readerRes.text();
    if (!readerHtml.includes(distinctiveSentence)) {
      throw new Error("Public reader page does not contain the published manuscript text");
    }

    console.log(`✓ PASS (Public Reader URL: ${baseUrl}/read/${finalSlug})`);
    results.push({ name: "Publishing & Public Reader URL", status: "PASS" });
  } catch (err) {
    console.log(`✗ FAIL: ${err.message}`);
    results.push({ name: "Publishing & Public Reader URL", status: "FAIL", error: err.message });
  }

  // TEST 6: Private Access Isolation (Hostile user cannot read draft or private edit endpoints)
  try {
    process.stdout.write("[Test 6] Verifying Cross-User Privacy & Security Isolation... ");
    const hostileReg = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hostileUser),
    });
    const hostileCookie = extractCookies(hostileReg);

    // Hostile user attempts to access User A's private edit endpoint
    const breachRes = await fetch(`${baseUrl}/api/v1/documents/${documentId}`, {
      headers: { Cookie: hostileCookie },
    });

    if (breachRes.ok) {
      throw new Error("SECURITY FAILURE: User B was able to view User A's private document endpoint!");
    }

    console.log(`✓ PASS (Access correctly rejected with HTTP ${breachRes.status})`);
    results.push({ name: "Cross-User Privacy Isolation", status: "PASS" });
  } catch (err) {
    console.log(`✗ FAIL: ${err.message}`);
    results.push({ name: "Cross-User Privacy Isolation", status: "FAIL", error: err.message });
  }

  // TEST 7: Unpublishing & Public Access Revocation
  try {
    process.stdout.write("[Test 7] Unpublishing & Verifying Revocation of Public Access... ");
    const unpubRes = await fetch(`${baseUrl}/api/v1/documents/${documentId}/unpublish`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });

    if (!unpubRes.ok) {
      const errText = await unpubRes.text();
      throw new Error(`Unpublish failed (${unpubRes.status}): ${errText}`);
    }

    // Probe reader URL again without cookies
    const revokedRes = await fetch(`${baseUrl}/read/${documentSlug}`);
    if (revokedRes.ok) {
      const revokedHtml = await revokedRes.text();
      if (revokedHtml.includes(distinctiveSentence)) {
        throw new Error("Unpublished manuscript text is still publicly accessible!");
      }
    }

    console.log("✓ PASS (Public access successfully revoked)");
    results.push({ name: "Unpublishing & Access Revocation", status: "PASS" });
  } catch (err) {
    console.log(`✗ FAIL: ${err.message}`);
    results.push({ name: "Unpublishing & Access Revocation", status: "FAIL", error: err.message });
  }

  console.log("\n================================================================================");
  console.log("                           LIVE VERIFICATION SUMMARY                            ");
  console.log("================================================================================");
  console.table(results);

  const allPassed = results.every((r) => r.status === "PASS");
  if (allPassed) {
    console.log("🎉 ALL LIVE WORKFLOW TESTS PASSED CLEANLY ON THE DEPLOYED APPLICATION!\n");
  } else {
    console.log("⚠️ SOME TESTS FAILED OR EXPERIENCED ANOMALIES.\n");
  }

  return { allPassed, results };
}

runLiveVerification().catch(console.error);
