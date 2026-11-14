# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default Deny Catch-All**: All unmatched paths in `/databases/{database}/documents/{document=**}` are unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Enforcement**: Every write operation (`create`, `update`, `delete`) requires `request.auth != null && request.auth.token.email_verified == true`.
3. **PII Isolation (Split Collection Strategy)**:
   - Public user profiles at `/users/{userId}` never store PII (`email`, `phone`, `address`).
   - Private PII records live exclusively in `/users/{userId}/private/{docId}` and are strictly readable and writable only when `request.auth.uid == userId && docId == 'info'`.
4. **Strict Key & Volumetric Validation**:
   - Every string field enforces explicit `.size()` bounds matching `firebase-blueprint.json`.
   - Every ID variable enforces `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
   - `isValidUserPublicProfile`, `isValidUserPrivateInfo`, and `isValidCloudPost` enforce `hasAll` and `hasOnly` key allowlists.
5. **Temporal & Ownership Immutability**:
   - On `create`: `incoming().createdAt == request.time && incoming().updatedAt == request.time`.
   - On `update`: `incoming().createdAt == existing().createdAt && incoming().updatedAt == request.time` and owner UIDs (`uid`, `authorId`) are immutable.
6. **Query Enforcer (No Blanket List)**:
   - `/cloudPosts` `list` requires `isSignedIn() && (existing().privacy == 'public' || existing().authorId == request.auth.uid)`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unverified Email Write**: Authenticated user with `email_verified: false` attempting to create `/users/{uid}`.
2. **Identity Spoofing on Profile**: User `uid_A` attempting to create `/users/uid_B` or set `uid: "uid_B"`.
3. **Shadow Field Injection on Profile**: Adding `isAdmin: true` to `/users/{uid}`.
4. **PII Leak Attempt**: User `uid_A` attempting `get` on `/users/uid_B/private/info`.
5. **Oversized Bio DoW Attack**: Sending a 10,000-character `bio` to `/users/{uid}`.
6. **ID Poisoning Attack**: Creating `/cloudPosts/invalid$id!with*spaces`.
7. **Post Author Spoofing**: User `uid_A` creating `/cloudPosts/post_1` with `authorId: "uid_B"` or without an existing `/users/uid_A` profile.
8. **Invalid Privacy Enum**: Creating `/cloudPosts/post_1` with `privacy: "everyone_hacked"`.
9. **Client Timestamp Forgery**: Creating `/cloudPosts/post_1` with a past/future `createdAt` instead of `request.time`.
10. **Immutable Field Mutation**: Updating `createdAt` or `authorId` on `/cloudPosts/{postId}`.
11. **Unauthorized Private Post Read**: User `uid_B` attempting `get` or `list` on a `/cloudPosts/{postId}` where `privacy == 'only_me'` and `authorId == 'uid_A'`.
12. **Value Poisoning on Update**: Updating `content` on `/cloudPosts/{postId}` with a number or a 20,000-character string.
