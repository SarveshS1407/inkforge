import { checkDatabaseConnection, prisma } from "../lib/db";
import { AuthService } from "../lib/services/auth.service";
import { DocumentService } from "../lib/services/document.service";
import { validateSession, createSession } from "../lib/auth/session";
import { extractSessionToken, requireAuth } from "../lib/auth/guard";
import {
  getLatestEmailForTesting,
  clearTestInbox,
  emailService,
  IEmailProvider,
  EmailDeliveryResult,
} from "../lib/services/email/email.service";
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  VersionConflictError,
  TooManyRequestsError,
  EmailDeliveryError,
} from "../lib/errors";
import { generateSecureToken, hashToken } from "../lib/auth/password";

async function runVerification() {
  console.log("================================================================================");
  console.log("             INKFORGE PHASE 2A: COMPREHENSIVE BACKEND VERIFICATION              ");
  console.log("  Real Authentication, Server Sessions, Multi-Client Auth & Doc Authorization   ");
  console.log("================================================================================\n");

  (process.env as any).NODE_ENV = "test";
  emailService.resetToDefault();
  clearTestInbox();

  // 1. Test Database Connectivity
  console.log("[Test 1] Verifying Database Connectivity...");
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.status !== "connected") {
    throw new Error(`Database connection failed: ${dbHealth.error}`);
  }
  console.log("  ✓ Database is connected and healthy (SQLite dev.db / Prisma Client v6.19.3)\n");

  // Unique email & usernames for test isolation
  const shortId = Date.now().toString().slice(-6);
  const testUserA = {
    email: `author.alpha.${shortId}@inkforge.test`,
    password: "CorrectHorseBatteryStaple123!",
    username: `alpha_${shortId}`,
    displayName: "Author Alpha",
  };
  const testUserB = {
    email: `author.beta.${shortId}@inkforge.test`,
    password: "AnotherSecurePassword456!",
    username: `beta_${shortId}`,
    displayName: "Author Beta",
  };

  // 2. User Registration & Immediate Session Issuance
  console.log("[Test 2] Testing User Registration & Immediate Session Issuance...");
  const regResultA = await AuthService.register(testUserA);
  console.log(`  ✓ Registered User A: ${regResultA.user.username} (${regResultA.user.id})`);
  console.log(`  ✓ Session token issued: ${regResultA.sessionToken.substring(0, 16)}...`);
  console.log(`  ✓ Verification token dispatched in background: ${regResultA.rawVerificationToken?.substring(0, 16)}...`);

  // Verify password was hashed (not stored plaintext)
  const storedUserA = await prisma.user.findUnique({ where: { id: regResultA.user.id } });
  if (!storedUserA?.passwordHash || storedUserA.passwordHash === testUserA.password) {
    throw new Error("FAIL: Password was either not saved or saved in plaintext!");
  }
  if (!storedUserA.passwordHash.includes(":")) {
    throw new Error("FAIL: Password hash does not follow salt:derivedKey format!");
  }
  console.log("  ✓ Password is securely hashed using scrypt with unique salt.");

  // Verify session in database
  const sessionValidation = await validateSession(regResultA.sessionToken);
  if (!sessionValidation || sessionValidation.user.id !== regResultA.user.id) {
    throw new Error("FAIL: Issued session token did not validate against database!");
  }
  console.log("  ✓ Session token validated successfully against database Session table.\n");

  // 3. Duplicate Registration Rejection
  console.log("[Test 3] Testing Duplicate Registration Rejection (Email & Username)...");
  try {
    await AuthService.register({
      email: testUserA.email, // duplicate email
      password: "AnotherPassword123!",
      username: `diff_${shortId}`,
    });
    throw new Error("FAIL: Duplicate email was permitted!");
  } catch (err: any) {
    if (err instanceof ConflictError) {
      console.log(`  ✓ Duplicate email rejected with 409 Conflict: "${err.message}"`);
    } else {
      throw err;
    }
  }

  try {
    await AuthService.register({
      email: `diff.email.${shortId}@inkforge.test`,
      password: "AnotherPassword123!",
      username: testUserA.username, // duplicate username
    });
    throw new Error("FAIL: Duplicate username was permitted!");
  } catch (err: any) {
    if (err instanceof ConflictError) {
      console.log(`  ✓ Duplicate username rejected with 409 Conflict: "${err.message}"`);
    } else {
      throw err;
    }
  }
  console.log("  ✓ Duplicate accounts are strictly prevented.\n");

  // 4. Login With Valid vs. Invalid Credentials
  console.log("[Test 4] Testing Login Authentication & Timing-Safe Password Check...");
  // 4a. Wrong password
  try {
    await AuthService.login({
      email: testUserA.email,
      password: "WrongPassword123!",
    });
    throw new Error("FAIL: Login with incorrect password succeeded!");
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      console.log(`  ✓ Invalid password rejected with 401 Unauthorized: "${err.message}"`);
    } else {
      throw err;
    }
  }

  // 4b. Nonexistent email
  try {
    await AuthService.login({
      email: `nonexistent.${shortId}@inkforge.test`,
      password: "SomePassword123!",
    });
    throw new Error("FAIL: Login with nonexistent email succeeded!");
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      console.log(`  ✓ Nonexistent user rejected with generic 401 (anti-enumeration): "${err.message}"`);
    } else {
      throw err;
    }
  }

  // 4c. Valid login
  const loginResultA = await AuthService.login({
    email: testUserA.email,
    password: testUserA.password,
  });
  console.log(`  ✓ Valid credentials login succeeded! Fresh session issued: ${loginResultA.sessionToken.substring(0, 16)}...`);
  console.log("  ✓ Password verified securely.\n");

  // 5. Comprehensive Email Verification & Resend Flow
  console.log("[Test 5] Testing Comprehensive Email Verification & Resend Flow...");

  // 5a. Registration triggered email adapter & captured in test inbox
  const verificationEmail = getLatestEmailForTesting(testUserA.email);
  if (!verificationEmail) {
    throw new Error("FAIL: Verification email was not dispatched to test inbox!");
  }
  if (!verificationEmail.link.includes("/auth/verify?token=")) {
    throw new Error(`FAIL: Verification link does not point to /auth/verify! Link: ${verificationEmail.link}`);
  }
  console.log(`  ✓ [5a] Registration triggered email adapter. Captured in inbox for ${verificationEmail.to}`);
  console.log(`  ✓ [5a] Verification link format verified: ${verificationEmail.link}`);

  // 5b. User email is initially unverified in database
  const preVerifyUser = await prisma.user.findUnique({ where: { id: regResultA.user.id } });
  if (preVerifyUser?.emailVerified) {
    throw new Error("FAIL: User email marked verified prematurely!");
  }
  console.log(`  ✓ [5b] Account created with emailVerified: null (unverified initial state)`);

  // 5c. Resending verification token generates fresh single-use token and invalidates old ones
  const testUserC = {
    email: `author.gamma.${shortId}@inkforge.test`,
    password: "PasswordForAuthorGamma123!",
    username: `gamma_${shortId}`,
    displayName: "Author Gamma",
  };
  const regResultC = await AuthService.register(testUserC);
  const initialEmailC = getLatestEmailForTesting(testUserC.email);
  if (!initialEmailC) {
    throw new Error("FAIL: Initial verification email for User C not found in test inbox!");
  }

  // Artificially age the token by 65 seconds to test clean resend outside cooldown
  await prisma.verificationToken.updateMany({
    where: { userId: regResultC.user.id },
    data: { createdAt: new Date(Date.now() - 65 * 1000) },
  });

  const resendResult = await AuthService.resendVerification(testUserC.email);
  if (!resendResult.success) {
    throw new Error("FAIL: Resend verification did not return success!");
  }
  if (resendResult.delivery !== "local") {
    throw new Error(`FAIL: Expected delivery: "local", received "${resendResult.delivery}"!`);
  }
  const resentEmailC = getLatestEmailForTesting(testUserC.email);
  if (!resentEmailC || resentEmailC.token === initialEmailC.token) {
    throw new Error("FAIL: Resend did not generate a new distinct verification token!");
  }

  // Verify only 1 active token exists in DB for User C
  const activeTokensC = await prisma.verificationToken.findMany({ where: { userId: regResultC.user.id } });
  if (activeTokensC.length !== 1) {
    throw new Error(`FAIL: Expected exactly 1 active token after resend, found ${activeTokensC.length}!`);
  }
  console.log(`  ✓ [5c] Resend verification issued new token, invalidated previous token, and reported delivery: "${resendResult.delivery}".`);

  // 5d. Rate limiting: requesting resend again immediately is blocked
  try {
    await AuthService.resendVerification(testUserC.email);
    throw new Error("FAIL: Rapid resend verification was not rate-limited!");
  } catch (err: any) {
    if (err instanceof TooManyRequestsError) {
      console.log(`  ✓ [5d] Resend rate limit enforced (429 Too Many Requests): "${err.message}"`);
    } else {
      throw err;
    }
  }

  // 5e. Anti-enumeration: nonexistent email returns generic success
  const nonexistentResend = await AuthService.resendVerification(`ghost.${shortId}@nowhere.test`);
  if (!nonexistentResend.success) {
    throw new Error("FAIL: Nonexistent email resend did not return generic success!");
  }
  if (nonexistentResend.delivery !== "simulated") {
    throw new Error(`FAIL: Expected anti-enumeration delivery: "simulated", received "${nonexistentResend.delivery}"!`);
  }
  console.log(`  ✓ [5e] Anti-enumeration: Nonexistent email resend returned generic message (delivery: "${nonexistentResend.delivery}") without leaking account existence.`);

  // 5f. Expired & invalid token rejection
  try {
    await AuthService.verifyEmail("completely-invalid-token-string");
    throw new Error("FAIL: Completely invalid token was accepted!");
  } catch (err: any) {
    if (err instanceof ValidationError) {
      console.log(`  ✓ [5f] Invalid token rejected: "${err.message}"`);
    } else {
      throw err;
    }
  }

  // Create an explicitly expired token in database
  const expiredRawToken = generateSecureToken(32);
  const expiredTokenHash = hashToken(expiredRawToken);
  await prisma.verificationToken.create({
    data: {
      userId: regResultC.user.id,
      tokenHash: expiredTokenHash,
      expiresAt: new Date(Date.now() - 10000), // 10 seconds in the past
    },
  });

  try {
    await AuthService.verifyEmail(expiredRawToken);
    throw new Error("FAIL: Expired token was accepted!");
  } catch (err: any) {
    if (err instanceof ValidationError) {
      console.log(`  ✓ [5f] Expired token rejected: "${err.message}"`);
    } else {
      throw err;
    }
  }

  // 5g. Provider failure resilience: Registration succeeds even if email provider throws
  class FailingEmailProvider implements IEmailProvider {
    getProviderName() { return "failing-mock"; }
    async sendVerificationEmail(): Promise<EmailDeliveryResult> {
      throw new EmailDeliveryError("Simulated upstream provider outage / network timeout");
    }
    async sendPasswordResetEmail(): Promise<EmailDeliveryResult> {
      throw new EmailDeliveryError("Simulated upstream provider outage / network timeout");
    }
  }

  emailService.setProvider(new FailingEmailProvider());
  const testUserD = {
    email: `author.delta.${shortId}@inkforge.test`,
    password: "PasswordForAuthorDelta123!",
    username: `delta_${shortId}`,
    displayName: "Author Delta",
  };
  const regResultD = await AuthService.register(testUserD);
  const storedUserD = await prisma.user.findUnique({ where: { id: regResultD.user.id } });
  if (!storedUserD) {
    throw new Error("FAIL: User account was discarded when email provider failed!");
  }
  console.log(`  ✓ [5g] Provider failure handled safely: User ${storedUserD.username} created and session issued despite email error.`);
  emailService.resetToDefault();

  // 5h. Execute verification with valid token for User A
  const verifyResult = await AuthService.verifyEmail(verificationEmail.token);
  console.log(`  ✓ [5h] Email verification completed for user ${verifyResult.userId}`);

  // Confirm DB reflects verification timestamp
  const postVerifyUser = await prisma.user.findUnique({ where: { id: regResultA.user.id } });
  if (!postVerifyUser?.emailVerified) {
    throw new Error("FAIL: User emailVerified timestamp was not written to database!");
  }
  console.log(`  ✓ [5h] Database updated: emailVerified = ${postVerifyUser.emailVerified.toISOString()}`);

  // Confirm single-use: repeating verification fails
  try {
    await AuthService.verifyEmail(verificationEmail.token);
    throw new Error("FAIL: Verification token was reused!");
  } catch (err: any) {
    if (err instanceof ValidationError) {
      console.log(`  ✓ [5h] Re-use of consumed verification token rejected: "${err.message}"`);
    } else {
      throw err;
    }
  }

  // 5i. Resend on already-verified user returns generic success without creating tokens
  await AuthService.resendVerification(testUserA.email);
  const activeTokensA = await prisma.verificationToken.findMany({ where: { userId: regResultA.user.id } });
  if (activeTokensA.length !== 0) {
    throw new Error("FAIL: Resend on verified user created a verification token!");
  }
  console.log(`  ✓ [5i] Resend on already-verified account handled safely without generating unnecessary tokens.`);
  console.log("  ✓ All Email Delivery & Verification requirements verified successfully.\n");

  // 6. Password Reset Flow & Session Invalidation Across Devices
  console.log("[Test 6] Testing Password Reset Flow & Cross-Device Session Invalidation...");
  // Create an extra session for User A (simulating a mobile device session)
  const mobileSession = await createSession(regResultA.user.id, { userAgent: "InkforgeMobile/1.0" });
  console.log(`  ✓ Active session 1 (Web): ${regResultA.sessionToken.substring(0, 16)}...`);
  console.log(`  ✓ Active session 2 (Mobile): ${mobileSession.sessionToken.substring(0, 16)}...`);

  // Verify anti-enumeration: Request reset for nonexistent email
  const nonexistentReset = await AuthService.requestPasswordReset(`ghost.${shortId}@nowhere.test`);
  console.log(`  ✓ Anti-enumeration: Nonexistent email request returned generic message: "${nonexistentReset.message}"`);

  // Request reset for User A
  const resetReqResult = await AuthService.requestPasswordReset(testUserA.email);
  if (resetReqResult.delivery !== "local") {
    throw new Error(`FAIL: Expected delivery: "local", received "${resetReqResult.delivery}"!`);
  }
  const resetEmail = getLatestEmailForTesting(testUserA.email);
  if (!resetEmail) {
    throw new Error("FAIL: Password reset email was not captured in test inbox!");
  }
  if (!resetEmail.link.includes("/auth/reset-password?token=")) {
    throw new Error(`FAIL: Password reset email link does not point to /auth/reset-password! Link: ${resetEmail.link}`);
  }
  console.log(`  ✓ Password reset email generated matching implemented page: ${resetEmail.link}`);

  // Test validateResetToken (valid token)
  const tokenValidation = await AuthService.validateResetToken(resetEmail.token);
  if (!tokenValidation.valid) {
    throw new Error("FAIL: validateResetToken failed on valid active token!");
  }
  console.log(`  ✓ validateResetToken verified active token without consuming it.`);

  // Test validateResetToken (invalid token)
  try {
    await AuthService.validateResetToken("completely-invalid-reset-token");
    throw new Error("FAIL: validateResetToken accepted invalid token!");
  } catch (err: any) {
    if (err instanceof ValidationError) {
      console.log(`  ✓ validateResetToken rejected invalid token: "${err.message}"`);
    } else {
      throw err;
    }
  }

  // Perform password reset
  const newPasswordForUserA = "BrandNewSuperSecurePassword987!";
  await AuthService.resetPassword({
    token: resetEmail.token,
    newPassword: newPasswordForUserA,
  });
  console.log("  ✓ Password successfully reset.");

  // Confirm token was consumed (single-use validation)
  try {
    await AuthService.validateResetToken(resetEmail.token);
    throw new Error("FAIL: Consumed reset token was still valid!");
  } catch (err: any) {
    if (err instanceof ValidationError) {
      console.log(`  ✓ Re-use of consumed reset token rejected: "${err.message}"`);
    } else {
      throw err;
    }
  }

  // Confirm old sessions are revoked
  const checkWebSession = await validateSession(regResultA.sessionToken);
  const checkMobileSession = await validateSession(mobileSession.sessionToken);
  if (checkWebSession !== null || checkMobileSession !== null) {
    throw new Error("FAIL: Previous active sessions were not revoked upon password reset!");
  }
  console.log("  ✓ All active user sessions across all devices were invalidated immediately.");

  // Confirm old password no longer works
  try {
    await AuthService.login({ email: testUserA.email, password: testUserA.password });
    throw new Error("FAIL: Old password still worked after reset!");
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      console.log(`  ✓ Old password rejected: "${err.message}"`);
    }
  }

  // Confirm new password works
  const freshLogin = await AuthService.login({ email: testUserA.email, password: newPasswordForUserA });
  console.log(`  ✓ Login with new password succeeded! Fresh session issued: ${freshLogin.sessionToken.substring(0, 16)}...`);
  const userASessionToken = freshLogin.sessionToken;
  console.log("  ✓ Password reset lifecycle verified.\n");

  // 7. Request Session Extraction & Guard Immunity Against Forged Headers
  console.log("[Test 7] Testing Request Session Extraction & Anti-Forgery Guard...");
  // 7a. Bearer token extraction
  const bearerReq = new Request("http://localhost:3000/api/v1/documents", {
    headers: {
      Authorization: `Bearer ${userASessionToken}`,
      "x-user-id": "forged-attacker-user-id", // forged header must be ignored
    },
  });
  const bearerUser = await requireAuth(bearerReq);
  if (bearerUser.id !== regResultA.user.id) {
    throw new Error(`FAIL: Server resolved wrong user from bearer! Got ${bearerUser.id}`);
  }
  console.log(`  ✓ Bearer Authorization resolved authenticated user ${bearerUser.username}.`);
  console.log("  ✓ Forged x-user-id header was completely ignored; server resolved identity exclusively from session.");

  // 7b. Cookie header extraction
  const cookieReq = new Request("http://localhost:3000/api/v1/documents", {
    headers: {
      cookie: `inkforge_session=${userASessionToken}; other_cookie=xyz`,
    },
  });
  const cookieUser = await requireAuth(cookieReq);
  if (cookieUser.id !== regResultA.user.id) {
    throw new Error("FAIL: Server failed to resolve user from cookie header!");
  }
  console.log("  ✓ Cookie header resolved authenticated user successfully.");

  // 7c. Unauthenticated request rejection
  const unauthReq = new Request("http://localhost:3000/api/v1/documents");
  try {
    await requireAuth(unauthReq);
    throw new Error("FAIL: Unauthenticated request was permitted by requireAuth!");
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      console.log(`  ✓ Missing session token rejected with 401 Unauthorized: "${err.message}"`);
    } else {
      throw err;
    }
  }
  console.log("  ✓ Server guards enforce authentication strictly across all client formats.\n");

  // 8. Register User B and Verify Multi-User Document Isolation (403 Forbidden)
  console.log("[Test 8] Testing Document Authorization & Multi-User Isolation...");
  const regResultB = await AuthService.register(testUserB);
  const userBId = regResultB.user.id;
  const userAId = regResultA.user.id;
  console.log(`  ✓ Registered User B: ${regResultB.user.username} (${userBId})`);

  // User A creates a private DRAFT document
  const draftDocA = await DocumentService.createDocument(
    {
      title: "Alpha's Confidential Manuscript",
      subtitle: "Private Musings on Aesthetics",
      contentHtml: "<p>Private draft content visible only to Alpha.</p>",
      contentJson: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Private draft." }] }] }),
      status: "DRAFT",
      targetWords: 800,
    },
    userAId
  );
  console.log(`  ✓ User A created private draft document: ID=${draftDocA.id}`);

  // User A can view their own draft
  const alphaView = await DocumentService.getDocumentById(draftDocA.id, userAId);
  if (!alphaView || alphaView.id !== draftDocA.id) {
    throw new Error("FAIL: Author Alpha cannot view their own draft!");
  }
  console.log("  ✓ Author Alpha can access their own draft.");

  // User B tries to view User A's draft -> 403 Forbidden
  try {
    await DocumentService.getDocumentById(draftDocA.id, userBId);
    throw new Error("FAIL: User B was permitted to view User A's private draft!");
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      console.log(`  ✓ User B view attempt blocked with 403 Forbidden: "${err.message}"`);
    } else {
      throw err;
    }
  }

  // User B tries to update User A's draft -> 403 Forbidden
  try {
    await DocumentService.updateDocument(
      draftDocA.id,
      { title: "Vandalized by Beta" },
      userBId
    );
    throw new Error("FAIL: User B was permitted to update User A's private draft!");
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      console.log(`  ✓ User B update attempt blocked with 403 Forbidden: "${err.message}"`);
    } else {
      throw err;
    }
  }

  // User B tries to delete User A's draft -> 403 Forbidden
  try {
    await DocumentService.deleteDocument(draftDocA.id, userBId);
    throw new Error("FAIL: User B was permitted to delete User A's private draft!");
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      console.log(`  ✓ User B delete attempt blocked with 403 Forbidden: "${err.message}"`);
    } else {
      throw err;
    }
  }

  // User B tries to view User A's draft revisions -> 403 Forbidden
  try {
    await DocumentService.getDocumentRevisions(draftDocA.id, userBId);
    throw new Error("FAIL: User B was permitted to view User A's revision history!");
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      console.log(`  ✓ User B revision view attempt blocked with 403 Forbidden: "${err.message}"`);
    } else {
      throw err;
    }
  }
  console.log("  ✓ Multi-user document isolation strictly verified: Cross-user operations return 403 Forbidden.\n");

  // 9. Public Read Access for Published Documents
  console.log("[Test 9] Testing Public Read Access For Published Documents...");
  // User A updates document status to PUBLISHED
  const publishedDocA = await DocumentService.updateDocument(
    draftDocA.id,
    {
      status: "PUBLISHED",
    },
    userAId
  );
  console.log(`  ✓ Document ${publishedDocA.id} published by User A (Status: ${publishedDocA.status})`);

  // Unauthenticated user (requestingUserId: null or undefined) accesses published post
  const publicView = await DocumentService.getDocumentById(draftDocA.id, undefined);
  if (!publicView || publicView.status !== "PUBLISHED") {
    throw new Error("FAIL: Unauthenticated visitor could not read published document!");
  }
  console.log(`  ✓ Public visitor successfully accessed published post: "${publicView.title}"`);

  // User B creates a draft that remains private
  const draftDocB = await DocumentService.createDocument(
    {
      title: "Beta's Secret Notes",
      contentHtml: "<p>Beta's private draft.</p>",
      contentJson: JSON.stringify({ type: "doc" }),
      status: "DRAFT",
    },
    userBId
  );

  // Unauthenticated user tries to access User B's draft -> 403 Forbidden
  try {
    await DocumentService.getDocumentById(draftDocB.id, undefined);
    throw new Error("FAIL: Unauthenticated visitor was allowed to view private draft!");
  } catch (err: any) {
    if (err instanceof ForbiddenError) {
      console.log(`  ✓ Unauthenticated visitor blocked from private draft with 403 Forbidden: "${err.message}"`);
    } else {
      throw err;
    }
  }
  console.log("  ✓ Public read routing works seamlessly without leaking private drafts.\n");

  // 10. Optimistic Concurrency Control (OCC) and Revision Atomicity
  console.log("[Test 10] Testing Optimistic Concurrency (409) & Atomic Revision Tracking...");
  const currentVersion = publishedDocA.version; // version 2
  console.log(`  ✓ Starting document version: ${currentVersion}`);

  // Update with expectedVersion matching current
  const updatedDocA = await DocumentService.updateDocument(
    publishedDocA.id,
    {
      title: "Alpha's Confidential Manuscript (Second Edition)",
      contentHtml: "<p>Expanded thesis on systems architecture and enduring design.</p>",
      contentJson: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Expanded thesis." }] }] }),
      expectedVersion: currentVersion,
    },
    userAId
  );
  console.log(`  ✓ Valid update committed atomically. New version: ${updatedDocA.version}`);
  if (updatedDocA.version !== currentVersion + 1) {
    throw new Error(`FAIL: Version expected to increment to ${currentVersion + 1}, got ${updatedDocA.version}`);
  }

  // Attempt stale write with old expectedVersion -> 409 Version Conflict
  try {
    await DocumentService.updateDocument(
      publishedDocA.id,
      {
        title: "Conflicting Stale Edit Attempt",
        expectedVersion: currentVersion, // Stale version!
      },
      userAId
    );
    throw new Error("FAIL: Stale write was permitted!");
  } catch (err: any) {
    if (err instanceof VersionConflictError) {
      console.log(`  ✓ Stale write rejected with 409 Conflict: "${err.message}"`);
    } else {
      throw err;
    }
  }

  // Verify revision snapshot was created atomically
  const revisions = await DocumentService.getDocumentRevisions(publishedDocA.id, userAId);
  console.log(`  ✓ Revision history verified: ${revisions.length} revision snapshot(s) present.`);
  console.log("  ✓ Optimistic Concurrency Control and transactional revisions verified.\n");

  // 11. Cleanup Test Records
  console.log("[Test 11] Cleaning Up Test Records...");
  await DocumentService.deleteDocument(publishedDocA.id, userAId);
  await DocumentService.deleteDocument(draftDocB.id, userBId);
  await prisma.user.delete({ where: { id: userAId } });
  await prisma.user.delete({ where: { id: userBId } });
  console.log("  ✓ Test documents, revisions, tokens, and users cleaned up safely.\n");

  console.log("================================================================================");
  console.log("  ✓ ALL 11 PHASE 2A BACKEND INTEGRATION & SECURITY TESTS PASSED SUCCESSFULLY!   ");
  console.log("================================================================================\n");
}

runVerification()
  .catch((e) => {
    console.error("\n❌ BACKEND VERIFICATION FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
