# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants & Relationship Mapping

1. **Global Default-Deny Safety Net**: Any path not explicitly matched is denied (`allow read, write: if false;`).
2. **Verified Identity Invariant**: All write operations (`create`, `update`, `delete`) require a verified authenticated user (`request.auth != null && request.auth.token.email_verified == true`).
3. **User Profile PII Isolation (`/users/{userId}`)**:
   - Document ID `{userId}` must match `^[a-zA-Z0-9_\-]+$` (1..128 chars) and strictly equal `request.auth.uid`.
   - `get` is restricted exclusively to the document owner (`request.auth.uid == userId`). Collection-wide `list` is forbidden to prevent PII scraping.
   - Immutable fields on update: `uid`, `email`, `createdAt`.
   - Allowed update keys: `name`, `photoUrl`, `agencyName`, `phone`, `plan`, `updatedAt`.
4. **Landing Pages Ownership & Schema Integrity (`/landing_pages/{pageId}`)**:
   - Document ID `{pageId}` must match `^[a-zA-Z0-9_\-]+$` (1..120 chars) and equal `incoming().id`.
   - `ownerUid` must strictly equal `request.auth.uid` on creation and remain immutable on update.
   - `list` queries are enforced at the rule level (`resource.data.ownerUid == request.auth.uid`).
   - `archetype` must be in `['produtos', 'servicos', 'gastronomia']`; `status` must be in `['draft', 'published', 'suspended']`.
   - `sections` list is bounded (`1..20` items, first item validated as string `<= 60` chars).
   - Immutable fields on update: `id`, `ownerUid`, `createdAt`.
5. **Audits (`/audits/{auditId}`), CRM Leads (`/crm_leads/{leadId}`), and API Keys (`/api_keys/{userId}`)**:
   - Strictly isolated per owner (`ownerUid == request.auth.uid` or `userId == request.auth.uid`) with full key allowlists (`hasAll` + `hasOnly`) and string length limits.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Identity Spoofing on `/users/{userId}`)**: Authenticated user `user_A` attempts to create `/users/user_B` with `uid: "user_B"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Shadow Field / Privilege Escalation on `/users/{userId}`)**: Authenticated user `user_A` creates `/users/user_A` including an undeclared field `"isAdmin": true`. -> `PERMISSION_DENIED`
3. **Payload 3 (Unverified Email Write on `/users/{userId}`)**: User with `email_verified: false` attempts to write their profile. -> `PERMISSION_DENIED`
4. **Payload 4 (PII Cross-User Read on `/users/{userId}`)**: Authenticated user `user_A` attempts `get` on `/users/user_B`. -> `PERMISSION_DENIED`
5. **Payload 5 (Immortal Field Mutation on `/users/{userId}`)**: Owner `user_A` attempts to update `createdAt` or `email` on `/users/user_A`. -> `PERMISSION_DENIED`
6. **Payload 6 (Landing Page Owner Spoofing on `/landing_pages/{pageId}`)**: User `user_A` creates a landing page with `ownerUid: "user_B"`. -> `PERMISSION_DENIED`
7. **Payload 7 (Landing Page Ghost Field Injection on `/landing_pages/{pageId}`)**: User `user_A` sends a valid landing page payload plus `"maliciousScript": "<script>"`. -> `PERMISSION_DENIED`
8. **Payload 8 (Landing Page Invalid Enum State on `/landing_pages/{pageId}`)**: User `user_A` sets `status: "hacked"` or `archetype: "unknown"`. -> `PERMISSION_DENIED`
9. **Payload 9 (Resource Exhaustion / Oversized String on `/landing_pages/{pageId}`)**: User `user_A` sends a `headline` of 1,000 characters (limit 300). -> `PERMISSION_DENIED`
10. **Payload 10 (Unbounded Array Poisoning on `/landing_pages/{pageId}`)**: User `user_A` sends `sections` with 25 elements (limit 20) or non-string first element. -> `PERMISSION_DENIED`
11. **Payload 11 (Path ID Poisoning on `/landing_pages/{pageId}`)**: User `user_A` attempts to create a document where path `{pageId}` (`lp_1`) does not match `data.id` (`lp_2`) or contains invalid characters (`lp$bad!`). -> `PERMISSION_DENIED`
12. **Payload 12 (Unauthorized Query Scraping on `/landing_pages`)**: User `user_A` attempts to `list` documents owned by `user_B`. -> `PERMISSION_DENIED`
