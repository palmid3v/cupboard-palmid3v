# Cupboard — User/Household Reset

## Purpose

This is a one-time administrative reset for the current Firebase project.

It removes user and household state while preserving the consolidated shared product catalog.

### Preserved

`productCatalog/*`

This collection is never a deletion target in the reset script.

### Removed

- Firebase Authentication users.
- `users/{uid}` profiles.
- `households/{householdId}` and all household subcollections.
- `householdInvites/*`.

Household inventory and movements are therefore reset, while the shared product catalog remains available for the next users.

## Why an Admin SDK script

Firebase Admin SDK server libraries have privileged access that is not evaluated against Firestore Security Rules. Firebase documents the Admin SDK as the appropriate server-side mechanism for administrative database tasks and user management. See the official Firebase Admin SDK setup documentation: https://firebase.google.com/docs/admin/setup

The reset must not be implemented as a normal browser feature.

## Required environment

- Node.js 22+.
- Firebase project: `cupboard-app-ce528`.
- A Firebase Admin SDK service-account JSON file stored outside the repository.

Firebase's setup documentation explains how to create/download the service-account credentials. See: https://firebase.google.com/docs/admin/setup

**Never commit the service-account JSON. Never paste its contents into chat.**

The repository ignores common service-account filenames under `app/.gitignore`.

## Step 1 — Get the service-account JSON

In Firebase/Google Cloud administration for the project, create/download an Admin SDK service-account key.

Save it somewhere outside the repository, for example:

```text
C:\secure\cupboard-firebase-admin.json
```

Do not put it under `app/`.

## Step 2 — Install the admin dependency

From PowerShell:

```powershell
cd D:\PALMI-D3V\projects\cupboard\app
npm install
```

The project uses `firebase-admin` only for this server-side administrative command. It is not imported by the React application.

## Step 3 — Run the dry run

The default command is non-destructive:

```powershell
npm run reset:data -- --credentials "C:\secure\cupboard-firebase-admin.json"
```

It prints:

- Authentication users;
- Firestore user profiles;
- households;
- invitations;
- household subcollection counts;
- number of `productCatalog/*` documents that will be preserved.

**Nothing is deleted during this command.**

Stop here if the counts do not look correct.

## Step 4 — Verify the catalog count

The dry run must show the expected number for:

```text
productCatalog/* TO PRESERVE
```

The reset script has an explicit safety boundary that rejects `productCatalog` as a deletion target.

## Step 5 — Execute

Only after reviewing the dry-run output:

```powershell
npm run reset:data -- --credentials "C:\secure\cupboard-firebase-admin.json" --execute --confirm "RESET CUPBOARD USERS + HOUSEHOLDS"
```

The confirmation phrase is intentionally different from the old migration gate.

## Step 6 — Verify the result

The script performs a post-reset check and must report:

```text
productCatalog/* preserved: <expected count>
users/* remaining: 0
households/* remaining: 0
householdInvites/* remaining: 0

RESET COMPLETE — PRODUCT CATALOG WAS NOT TARGETED.
```

Firebase Authentication users are also deleted through the Admin SDK. Firebase documents both listing users in batches and bulk user deletion through the Admin SDK. See: https://firebase.google.com/docs/auth/admin/manage-users

## Step 7 — Start Cupboard again

After the reset:

1. Start the app normally.
2. Create the first account.
3. Verify its email.
4. Create/use the initial household flow.
5. Scan a product that already exists in `productCatalog`.
6. Confirm that the product is recognized without recreating its shared identity.
7. Confirm that the new household receives its own empty inventory record only when the product is added.

## Important

The reset is **not** a Firebase project reset.

It does not delete:

- `productCatalog/*`;
- Firestore Rules;
- application code;
- Firebase configuration;
- the Firebase project itself.

The reset script is intentionally a local operator tool. It should not be exposed through the web UI.
