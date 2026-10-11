import { prisma } from "../lib/db";
import { AuthService } from "../lib/services/auth.service";

async function main() {
  const baseUrl = "http://localhost:3000";
  const testEmail = `author.e2e.${Date.now()}@inkforge.local`;
  const initialPassword = "InitialPassword123!";
  const updatedPassword = "UpdatedSecurePassword456!";

  console.log("================================================================================");
  console.log("  INKFORGE — PASSWORD RESET END-TO-END VERIFICATION SUITE");
  console.log("================================================================================\n");

  try {
    // 1. Create author account
    console.log("[Step 1] Creating test author account via /api/v1/auth/register...");
    const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
        username: `e2e_author_${Date.now()}`,
        displayName: "E2E Verified Author",
      }),
    });
    const regData = await regRes.json();
    if (!regRes.ok || !regData.success) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }
    const userId = regData.data.id;
    console.log(`  ✓ Registered author ID: ${userId} (${testEmail})`);

    // 2. Request password reset via HTTP API
    console.log("\n[Step 2] Requesting password reset via POST /api/v1/auth/forgot-password...");
    const forgotRes = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const forgotData = await forgotRes.json();
    if (!forgotRes.ok || !forgotData.success) {
      throw new Error(`Forgot password API failed: ${JSON.stringify(forgotData)}`);
    }
    console.log(`  ✓ Received API response: ${JSON.stringify(forgotData.data)}`);

    // 3. Retrieve generated token directly from test mode AuthService
    console.log("\n[Step 3] Obtaining valid single-use token for test verification...");
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    const resetResult = await AuthService.requestPasswordReset(testEmail);
    const rawToken = resetResult.rawTokenForTesting!;
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    console.log(`  ✓ Secured test token: ${rawToken.substring(0, 8)}...${rawToken.substring(rawToken.length - 6)}`);

    // 4. Validate token via GET /api/v1/auth/reset-password
    console.log("\n[Step 4] Validating token via GET /api/v1/auth/reset-password?token=...");
    const valRes = await fetch(`${baseUrl}/api/v1/auth/reset-password?token=${encodeURIComponent(rawToken)}`);
    const valData = await valRes.json();
    if (!valRes.ok || !valData.success || !valData.data.valid) {
      throw new Error(`Token validation failed: ${JSON.stringify(valData)}`);
    }
    console.log(`  ✓ Token pre-validation confirmed valid (expiresAt: ${valData.data.expiresAt})`);

    // 5. Test invalid token validation
    console.log("\n[Step 5] Testing invalid token rejection on GET /api/v1/auth/reset-password...");
    const invRes = await fetch(`${baseUrl}/api/v1/auth/reset-password?token=bad-dummy-token`);
    const invData = await invRes.json();
    if (invRes.status !== 400 || invData.success !== false) {
      throw new Error(`Invalid token was not rejected with 400! Status: ${invRes.status}`);
    }
    console.log(`  ✓ Invalid token correctly rejected with 400: "${invData.error.message}"`);

    // 6. Test submitting new password via POST /api/v1/auth/reset-password
    console.log("\n[Step 6] Submitting new password via POST /api/v1/auth/reset-password...");
    const resetRes = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawToken,
        newPassword: updatedPassword,
      }),
    });
    const resetData = await resetRes.json();
    if (!resetRes.ok || !resetData.success) {
      throw new Error(`Password reset submission failed: ${JSON.stringify(resetData)}`);
    }
    console.log(`  ✓ Password update confirmed: "${resetData.data.message}"`);

    // 7. Test that old password fails to sign in
    console.log("\n[Step 7] Confirming old password is no longer valid...");
    const oldLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
      }),
    });
    const oldLoginData = await oldLoginRes.json();
    if (oldLoginRes.status !== 401) {
      throw new Error(`Old password unexpectedly allowed sign in! Status: ${oldLoginRes.status}`);
    }
    console.log(`  ✓ Old password correctly rejected (401 Unauthorized): "${oldLoginData.error?.message}"`);

    // 8. Test that new password succeeds to sign in
    console.log("\n[Step 8] Confirming new password allows sign in...");
    const newLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: updatedPassword,
      }),
    });
    const newLoginData = await newLoginRes.json();
    if (!newLoginRes.ok || !newLoginData.success) {
      throw new Error(`New password failed to sign in! Status: ${newLoginRes.status}`);
    }
    console.log(`  ✓ New password signed in successfully! User: ${newLoginData.data.email}`);

    // 9. Confirm single-use token was consumed and cannot be reused
    console.log("\n[Step 9] Confirming single-use token cannot be reused...");
    const reuseRes = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawToken,
        newPassword: "YetAnotherPassword789!",
      }),
    });
    const reuseData = await reuseRes.json();
    if (reuseRes.status !== 400) {
      throw new Error(`Reused token was unexpectedly accepted! Status: ${reuseRes.status}`);
    }
    console.log(`  ✓ Reused token correctly rejected with 400: "${reuseData.error?.message}"`);

    // 10. Confirm /auth/forgot-password redirects to /auth/reset-password
    console.log("\n[Step 10] Confirming /auth/forgot-password redirect...");
    const redirRes = await fetch(`${baseUrl}/auth/forgot-password`, {
      redirect: "manual",
    });
    if (redirRes.status !== 307 && redirRes.status !== 308) {
      throw new Error(`Expected 307/308 redirect on /auth/forgot-password, received ${redirRes.status}`);
    }
    const loc = redirRes.headers.get("location");
    console.log(`  ✓ /auth/forgot-password redirected with HTTP ${redirRes.status} to: "${loc}"`);

    // 11. Cleanup test author
    console.log("\n[Step 11] Cleaning up temporary test author...");
    await prisma.user.delete({ where: { id: userId } });
    console.log("  ✓ Test author records cleanly removed.");

    console.log("\n================================================================================");
    console.log("  ✓ ALL 11 END-TO-END PASSWORD RESET FLOW CHECKS PASSED PERFECTLY!");
    console.log("================================================================================\n");
  } catch (error) {
    console.error("\n❌ E2E VERIFICATION FAILED:", error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});
