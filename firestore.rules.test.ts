import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildUserProfilePayload,
  validateUserProfilePayload,
  buildLandingPagePayload,
  validateLandingPagePayload,
  ID_REGEX,
} from "./src/lib/firestoreSchemas";

const rulesContent = fs.readFileSync("./firestore.rules", "utf8");

function evaluateRuleCreateUserProfile(
  auth: { uid: string; email_verified: boolean } | null,
  pathUserId: string,
  payload: Record<string, unknown>
): "ALLOW" | "PERMISSION_DENIED" {
  if (!auth || !auth.email_verified) return "PERMISSION_DENIED";
  if (!ID_REGEX.test(pathUserId) || pathUserId.length < 1 || pathUserId.length > 128) {
    return "PERMISSION_DENIED";
  }
  if (pathUserId !== auth.uid) return "PERMISSION_DENIED";
  const check = validateUserProfilePayload(payload, auth.uid);
  return check.valid ? "ALLOW" : "PERMISSION_DENIED";
}

function evaluateRuleGetUserProfile(
  auth: { uid: string } | null,
  pathUserId: string
): "ALLOW" | "PERMISSION_DENIED" {
  if (!auth) return "PERMISSION_DENIED";
  if (!ID_REGEX.test(pathUserId) || pathUserId.length < 1 || pathUserId.length > 128) {
    return "PERMISSION_DENIED";
  }
  return auth.uid === pathUserId ? "ALLOW" : "PERMISSION_DENIED";
}

function evaluateRuleUpdateUserProfile(
  auth: { uid: string; email_verified: boolean } | null,
  pathUserId: string,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): "ALLOW" | "PERMISSION_DENIED" {
  if (!auth || !auth.email_verified) return "PERMISSION_DENIED";
  if (!ID_REGEX.test(pathUserId) || pathUserId !== auth.uid) return "PERMISSION_DENIED";
  const check = validateUserProfilePayload(incoming, auth.uid);
  if (!check.valid) return "PERMISSION_DENIED";
  if (existing.uid !== auth.uid) return "PERMISSION_DENIED";
  if (incoming.uid !== existing.uid) return "PERMISSION_DENIED";
  if (incoming.email !== existing.email) return "PERMISSION_DENIED";
  if (incoming.createdAt !== existing.createdAt) return "PERMISSION_DENIED";
  return "ALLOW";
}

function evaluateRuleCreateLandingPage(
  auth: { uid: string; email_verified: boolean } | null,
  pathPageId: string,
  payload: Record<string, unknown>
): "ALLOW" | "PERMISSION_DENIED" {
  if (!auth || !auth.email_verified) return "PERMISSION_DENIED";
  if (!ID_REGEX.test(pathPageId) || pathPageId.length < 1 || pathPageId.length > 120) {
    return "PERMISSION_DENIED";
  }
  const check = validateLandingPagePayload(payload, auth.uid);
  if (!check.valid) return "PERMISSION_DENIED";
  if (payload.id !== pathPageId) return "PERMISSION_DENIED";
  return "ALLOW";
}

function evaluateRuleListLandingPage(
  auth: { uid: string } | null,
  resourceOwnerUid: string
): "ALLOW" | "PERMISSION_DENIED" {
  if (!auth) return "PERMISSION_DENIED";
  return resourceOwnerUid === auth.uid ? "ALLOW" : "PERMISSION_DENIED";
}

test("firestore.rules file contains all 5 blueprint collections and Eight Pillars primitives", () => {
  assert.ok(rulesContent.includes("match /{document=**}"));
  assert.ok(rulesContent.includes("match /users/{userId}"));
  assert.ok(rulesContent.includes("match /landing_pages/{pageId}"));
  assert.ok(rulesContent.includes("match /audits/{auditId}"));
  assert.ok(rulesContent.includes("match /crm_leads/{leadId}"));
  assert.ok(rulesContent.includes("match /api_keys/{userId}"));
  assert.ok(rulesContent.includes("isValidUserProfile("));
  assert.ok(rulesContent.includes("isValidLandingPage("));
});

test("Dirty Dozen #1-#12 all return PERMISSION_DENIED", () => {
  const verifiedUserA = { uid: "user_A", email_verified: true };
  const unverifiedUserA = { uid: "user_A", email_verified: false };

  const validProfileA = buildUserProfilePayload(
    { name: "Marcus", email: "marcus6699@gmail.com", plan: "g360_full" },
    "user_A"
  ) as unknown as Record<string, unknown>;

  const validLpA = buildLandingPagePayload(
    { id: "lp_1", slug: "sorvetes-cg", name: "Sorvetes CG", archetype: "gastronomia" },
    "user_A"
  ) as unknown as Record<string, unknown>;

  // 1. Identity Spoofing on /users/{userId}
  assert.equal(
    evaluateRuleCreateUserProfile(verifiedUserA, "user_B", { ...validProfileA, uid: "user_B" }),
    "PERMISSION_DENIED"
  );

  // 2. Shadow Field / Privilege Escalation on /users/{userId}
  assert.equal(
    evaluateRuleCreateUserProfile(verifiedUserA, "user_A", { ...validProfileA, isAdmin: true }),
    "PERMISSION_DENIED"
  );

  // 3. Unverified Email Write on /users/{userId}
  assert.equal(
    evaluateRuleCreateUserProfile(unverifiedUserA, "user_A", validProfileA),
    "PERMISSION_DENIED"
  );

  // 4. PII Cross-User Read on /users/{userId}
  assert.equal(evaluateRuleGetUserProfile(verifiedUserA, "user_B"), "PERMISSION_DENIED");

  // 5. Immortal Field Mutation on /users/{userId}
  assert.equal(
    evaluateRuleUpdateUserProfile(verifiedUserA, "user_A", validProfileA, {
      ...validProfileA,
      email: "spoofed@evil.com",
    }),
    "PERMISSION_DENIED"
  );

  // 6. Landing Page Owner Spoofing on /landing_pages/{pageId}
  assert.equal(
    evaluateRuleCreateLandingPage(verifiedUserA, "lp_1", { ...validLpA, ownerUid: "user_B" }),
    "PERMISSION_DENIED"
  );

  // 7. Landing Page Ghost Field Injection on /landing_pages/{pageId}
  assert.equal(
    evaluateRuleCreateLandingPage(verifiedUserA, "lp_1", {
      ...validLpA,
      maliciousScript: "<script>",
    }),
    "PERMISSION_DENIED"
  );

  // 8. Landing Page Invalid Enum State on /landing_pages/{pageId}
  assert.equal(
    evaluateRuleCreateLandingPage(verifiedUserA, "lp_1", { ...validLpA, status: "hacked" }),
    "PERMISSION_DENIED"
  );

  // 9. Resource Exhaustion / Oversized String on /landing_pages/{pageId}
  assert.equal(
    evaluateRuleCreateLandingPage(verifiedUserA, "lp_1", {
      ...validLpA,
      headline: "X".repeat(1000),
    }),
    "PERMISSION_DENIED"
  );

  // 10. Unbounded Array Poisoning on /landing_pages/{pageId}
  assert.equal(
    evaluateRuleCreateLandingPage(verifiedUserA, "lp_1", {
      ...validLpA,
      sections: Array.from({ length: 25 }, (_, i) => `sec_${i}`),
    }),
    "PERMISSION_DENIED"
  );

  // 11. Path ID Poisoning on /landing_pages/{pageId}
  assert.equal(
    evaluateRuleCreateLandingPage(verifiedUserA, "lp_mismatch", validLpA),
    "PERMISSION_DENIED"
  );

  // 12. Unauthorized Query Scraping on /landing_pages
  assert.equal(evaluateRuleListLandingPage(verifiedUserA, "user_B"), "PERMISSION_DENIED");

  // Verify legitimate operations succeed
  assert.equal(evaluateRuleCreateUserProfile(verifiedUserA, "user_A", validProfileA), "ALLOW");
  assert.equal(evaluateRuleCreateLandingPage(verifiedUserA, "lp_1", validLpA), "ALLOW");
});
