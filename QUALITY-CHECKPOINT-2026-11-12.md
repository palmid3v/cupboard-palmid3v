# Cupboard — Quality checkpoint (2026-11-12)

## Scope reviewed
- Public repository structure and current main-branch documentation.
- app/package.json, inventory subscription hook, regression suite, Firestore Rules, roadmap and CI workflow.
- Latest available GitHub Actions runs through 2026-11-09.

## Findings
- The application now subscribes to exactly one inventory workspace at a time, selected by activeWorkspaceId.
- The regression suite contained multiple stale UI assumptions: it expected simultaneous subscriptions to both workspaces, a workspace filter inside InventoryView, and a broader destination-selection condition than the current admin-only/new-product guard. The current UI scopes the main inventory at the top-level workspace selector, while InventoryView filters/sorts only the selected workspace.
- The workflow stopped after the regression failure, so Firestore Rules, lint and build were skipped in that run.
- The inventory import remains dry-run by default. Applying it still requires a reviewed mapping, backup and explicit authorization.
- The public README's architecture/security boundaries remain valid; CI status needed to be made explicit.

## Change prepared
- PR #11 — https://github.com/palmid3v/cupboard-palmid3v/pull/11
- The test now checks the active-workspace conditional, the single-subscription invariant, the current admin-only destination selector guard and the selected inventory view's own search/filter behavior.
- The updated regression and theme-engine validation jobs have passed on commit 5c1427f; Firestore Rules, lint and build were still running at the last check.

## Validation status
- Previous failing run: https://github.com/palmid3v/cupboard-palmid3v/actions/runs/42540534363
- PR validation is pending; do not describe CI as green until the PR workflow completes.
- No Firebase production data, Rules deployment or import was changed.

## Next gates
1. Confirm PR CI: regression, Firestore Rules, lint and production build.
2. Run the scan → recognize → register → inventory path on target mobile browsers.
3. Review the Sandwichies import dry-run and mapping before any apply.
4. Verify workspace permissions and offline/reconnect behavior against emulator and real accounts.
