# Cupboard — Security

## Authentication

Cupboard uses Firebase Authentication with email/password accounts.

Email verification is mandatory before a user can access household data.

```text
Account
  ↓
Verification email
  ↓
emailVerified = true
  ↓
Invitation / existing household
  ↓
Household data
```

## Firestore authorization

Firestore Rules independently require verified authentication:

`request.auth != null && request.auth.token.email_verified == true`

A user must also belong to the requested household.

### Roles

- `admin` — household owner/general administrator.
- `editor` — can modify household inventory/features where allowed.
- `member` — can read household data but does not receive owner/editor write privileges.

## Invitations

Invitation documents live under:

`householdInvites/{inviteCode}`

Membership creation requires a matching, unexpired invitation and a verified authenticated user.

The invited user is granted membership before the household document is read, avoiding a pre-membership permission failure.

## Protected identity fields

Users cannot change their own household or role.

Household ownership cannot be reassigned by the client.

## Shared catalog security

`productCatalog/{barcode}` contains reusable product identity metadata.

Catalog creation requires:

- verified authentication;
- `createdBy == request.auth.uid`;
- required product metadata;
- an allowlisted field set.

Catalog updates preserve `createdBy` and are limited to metadata fields. Client-side catalog deletion is disabled.

## Household inventory security

`households/{householdId}/inventory/{barcode}`

- reads require verified household membership;
- writes require an editor-capable role;
- users cannot access another household's inventory;
- household state remains separate from shared catalog metadata.

## Movement security

`households/{householdId}/movements/{movementId}`

- reads require household membership;
- creation requires an editor-capable role;
- updates/deletes are owner-only;
- movement data remains household-scoped.

## Firestore Rules deployment

Rules are versioned in `firestore.rules` but are not deployed by `npm run dev`.

Deploy explicitly:

```powershell
firebase deploy --only firestore:rules
```

After deployment, validate owner/editor/member access and verified-email enforcement.

## Data safety

The October 2026 catalog/inventory migration has completed.

The retired household product collection is no longer part of the application's Firestore Rules boundary. FASE 10 removes migration-only runtime access rather than introducing another destructive operation.

## Operational principle

Keep authorization in Firestore Rules, not only in React UI. Client-side visibility is a convenience; Rules are the security boundary.

## Runtime availability versus authorization

Firebase Authentication can temporarily return availability errors such as HTTP 503 / `auth/the-service-is-currently-unavailable`. This should be communicated as a recoverable service/connectivity condition, not as a permission failure.

Separately, a catalog product can be readable by a verified user while household inventory writes still require an editor-capable role. Recognizing a barcode and having permission to add that product to a household are different security decisions.
