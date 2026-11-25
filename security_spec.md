# Security Specification — 聖誕薑餅人尋寶賽 (Gingerbread Sticker Hunt)

## 1. Data Invariants
1. **Verified Identity**: Only authenticated users with `request.auth.token.email_verified == true` can read event submissions or create entries.
2. **One Entry Per Employee Per Sticker Day**: Self-submitted entries MUST use deterministic document ID `${uid}_day${stickerDay}` (`stickerDay` integer `1..7`), preventing duplicate farming of Top-10 speed bonuses.
3. **Immutable Speed Timestamp**: `createdAt` MUST equal `request.time` on creation and cannot be modified on update.
4. **PII Isolation**: Email addresses reside strictly in `/users/{userId}`, readable only by the owner (`uid == userId`) or an administrator. Public `/submissions` documents contain zero email/phone PII.
5. **No Self-Assigned Admin**: Users cannot write to `/admins/{adminId}` unless already verified as an admin (`email == 'yasmineye.cgtec@gmail.com'` with `email_verified == true`, or existing `/admins/{uid}`).
6. **Bounded Image Payloads**: `imageDataUrl` MUST start with `data:image/(jpeg|jpg|png|webp);base64,` and be `<= 450000` characters to stay safely within Firestore's 1MB document limit and prevent storage exhaustion.
7. **Strict Key Allowlisting**: Every collection enforces `keys().hasAll(...)` and `keys().hasOnly(...)` on create, and `affectedKeys().hasOnly(...)` on update.

## 2. The "Dirty Dozen" Attack Payloads
1. **Unauthenticated Write**: Create `/submissions/attacker_day1` with `request.auth == null`. -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: Create `/eventConfig/main` with `email == 'yasmineye.cgtec@gmail.com'` and `email_verified == false`. -> `PERMISSION_DENIED`.
3. **UID Spoofing on Submission**: Create `/submissions/victim_day1` as `userA` with `uid: "victim"`. -> `PERMISSION_DENIED`.
4. **Duplicate Day Farming**: Create `/submissions/userA_day1_copy` as non-admin `userA` with `isProxy: false`. -> `PERMISSION_DENIED`.
5. **Timestamp Backdating (Speed Rank Cheating)**: Create `/submissions/userA_day1` with `createdAt` set to 1 day in the past (`createdAt != request.time`). -> `PERMISSION_DENIED`.
6. **Immutable Timestamp Tampering**: Update `/submissions/userA_day1` attempting to alter `createdAt` to climb the Top-10 ranking. -> `PERMISSION_DENIED`.
7. **Shadow Ghost Field Injection**: Create `/submissions/userA_day1` with extra field `bonusOverride: 9999`. -> `PERMISSION_DENIED`.
8. **Invalid Sticker Day Out-of-Bounds**: Create `/submissions/userA_day9` with `stickerDay: 9`. -> `PERMISSION_DENIED`.
9. **XSS / Non-Image Data URL Injection**: Create `/submissions/userA_day1` with `imageDataUrl: "javascript:alert(1)"` or `"data:text/html;base64,..."`. -> `PERMISSION_DENIED`.
10. **PII Leak Attempt**: UserA calls `get` on `/users/userB` or `list` on `/users`. -> `PERMISSION_DENIED`.
11. **Privilege Escalation**: Non-admin UserA attempts to create `/admins/userA` or update `/eventConfig/main`. -> `PERMISSION_DENIED`.
12. **Resource Poisoning via Oversized ID**: Attempt to read/write `/submissions/<200-char-invalid-id!@#>` -> `PERMISSION_DENIED`.
