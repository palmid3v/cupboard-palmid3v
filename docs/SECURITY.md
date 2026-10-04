# Cupboard — Security

## Authentication

Cupboard uses Firebase Authentication with email/password accounts.

Email verification is mandatory before a user can access household data.

The client flow is:

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

The verification screen supports:

- resend verification email;
- explicit verification-state refresh;
- preserving the pending household invitation until verification succeeds.

## Firestore authorization

Firestore Rules independently require:

```text
request.auth != null
AND
request.auth.token.email_verified == true
```

This means hiding the application behind a React screen is not the security boundary.

### Household access

A user must also be a member of:

```text
households/{householdId}/members/{uid}
```

Roles currently used:

- `admin` — household owner/general administrator;
- `editor` — can modify household inventory/features where allowed;
- `member` — can read household data but does not receive owner/editor write privileges.

## Invitations

Invitation documents live under:

```text
householdInvites/{inviteCode}
```

They contain:

- household ID;
- role;
- creation timestamp;
- expiration timestamp;
- creator UID.

Invited membership creation requires:

- authenticated verified user;
- matching invitation code;
- matching household;
- member role;
- unexpired invitation.

The invited user is granted membership before the household document is read, avoiding a pre-membership permission failure.

## Protected identity fields

Users cannot change their own:

- `householdId`;
- `role`.

Household ownership cannot be reassigned by the client.

## Current operational policy

The existing Firebase data is intentionally preserved while the security and UX changes are being implemented.

**No reset, deletion, or destructive migration is part of this checkpoint.**

Any future clean reset must be an explicit operational step performed before the reset implementation is enabled.

## Deployment checklist

Before deploying the new rules:

1. Confirm the current household owner has verified their email.
2. Confirm Email/Password Authentication is enabled in Firebase.
3. Deploy `firestore.rules`.
4. Sign in with the verified owner.
5. Generate a fresh invitation.
6. Test a second account with an unverified email.
7. Verify that the second account is blocked before verification.
8. Verify the email and confirm the invitation flow resumes.
9. Confirm both users can access the intended household.
10. Confirm a member cannot generate invitations.

## Data preservation

Existing household products remain valid test data.

Do not delete:

- `households`;
- `households/*/products`;
- `householdInvites`;
- Firebase Authentication users;

as part of this implementation.

A future reset will be announced explicitly before any destructive operation.
