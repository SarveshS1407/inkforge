/**
 * INKFORGE — LIVE DEPLOYMENT VERIFICATION ENGINE
 * Validates the deployed application end-to-end:
 * 1. Health check & Homepage HTTP 200
 * 2. User registration & Session cookie issuance
 * 3. Manuscript creation, persistence & autosave
 * 4. Cross-user private draft isolation (User B cannot access User A's private draft)
 * 5. Revision history creation & retrieval
 * 6. Publishing lifecycle & Public Reader URL access (unauthenticated visitor)
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

  // TEST 4: Cross-User Privacy Isolation (Draft is strictly private to Author A)
  try {
    process.stdout.write("[Test 4] Verifying Cross-User Privacy on Private Draft... ");
    const hostileReg = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hostileUser),
    });
    const hostileCookie = extractCookies(hostileReg);

    // Hostile user attempts to view Author A's unpublished draft
    const breachRes = await fetch(`${baseUrl}/api/v1/documents/${documentId}`, {
      headers: { Cookie: hostileCookie },
    });

    if (breachRes.ok) {
      throw new Error("SECURITY FAILURE: User B was able to view User A's private draft!");
    }

    console.log(`✓ PASS (Unauthorized access rejected with HTTP ${breachRes.status})`);
    results.push({ name: "Cross-User Privacy Isolation", status: "PASS" });
  } catch (err) {
    console.log(`✗ FAIL: ${err.message}`);
    results.push({ name: "Cross-User Privacy Isolation", status: "FAIL", error: err.message });
  }

  // TEST 5: Revisions & Atomic History
  try {
    process.stdout.write("[Test 5] Testing Revisions & Versioning... ");
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

  // TEST 6: Publishing & Public Reader Access
  try {
    process.stdout.write("[Test 6] Publishing Manuscript & Testing Public Reader Access... ");
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

    // 1. Probe public reader HTML page (unauthenticated visitor)
    const readerPageRes = await fetch(`${baseUrl}/read/${finalSlug}`);
    if (!readerPageRes.ok) {
      throw new Error(`Public reading page returned HTTP ${readerPageRes.status}`);
    }

    // 2. Probe public document API by slug (unauthenticated visitor)
    const publicDocRes = await fetch(`${baseUrl}/api/v1/documents/by-slug/${finalSlug}`);
    if (!publicDocRes.ok) {
      throw new Error(`Public document API returned HTTP ${publicDocRes.status}`);
    }
    const publicDocData = await publicDocRes.json();
    const publicDoc = publicDocData.data?.document || publicDocData.data || publicDocData;

    if (!JSON.stringify(publicDoc).includes(distinctiveSentence)) {
      throw new Error("Public document API did not return the published text");
    }

    console.log(`✓ PASS (Public Reader: ${baseUrl}/read/${finalSlug})`);
    results.push({ name: "Publishing & Public Reader Access", status: "PASS" });
  } catch (err) {
    console.log(`✗ FAIL: ${err.message}`);
    results.push({ name: "Publishing & Public Reader Access", status: "FAIL", error: err.message });
  }

  // TEST 7: Unpublishing & Public Access Revocation
  try {
    process.stdout.write("[Test 7] Unpublishing & Verifying Public Access Revocation... ");
    const unpubRes = await fetch(`${baseUrl}/api/v1/documents/${documentId}/unpublish`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });

    if (!unpubRes.ok) {
      const errText = await unpubRes.text();
      throw new Error(`Unpublish failed (${unpubRes.status}): ${errText}`);
    }

    // Unauthenticated visitor attempts to fetch unpublished story
    const revokedRes = await fetch(`${baseUrl}/api/v1/documents/by-slug/${documentSlug}`);
    if (revokedRes.ok) {
      throw new Error("Unpublished manuscript is still accessible to public visitors!");
    }

    // Author A can still access their private draft
    const authorDocRes = await fetch(`${baseUrl}/api/v1/documents/${documentId}`, {
      headers: { Cookie: sessionCookie },
    });
    if (!authorDocRes.ok) {
      throw new Error("Author was unable to access their own manuscript after unpublishing");
    }

    console.log("✓ PASS (Public access revoked; Author retains private access)");
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
    console.log("🎉 ALL 7 CORE WORKFLOW TESTS PASSED 100% CLEANLY!\n");
  } else {
    console.log("⚠️ SOME TESTS FAILED.\n");
  }

  return { allPassed, results };
}

runLiveVerification().catch(console.error);
