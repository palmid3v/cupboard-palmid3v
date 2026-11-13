# Cupboard — Quality checkpoint (2026-11-12)

## Scope reviewed
- Public repository structure and current main-branch documentation.
- app/package.json, inventory subscription hook, regression suite, Firestore Rules, roadmap and CI workflow.
- Latest available GitHub Actions runs through 2026-11-09.

## Findings
- The application now subscribes to exactly one inventory workspace at a time, selected by activeWorkspaceId.
- The regression test still expected the older implementation to subscribe to both home and sandwichies. This stale assertion caused the latest regression workflow to fail: 18 tests passed and 1 failed.
- The workflow stopped after the regression failure, so Firestore Rules, lint and build were skipped in that run.
- The inventory import remains dry-run by default. Applying it still requires a reviewed mapping, backup and explicit authorization.
- The public README's architecture/security boundaries remain valid; CI status needed to be made explicit.

## Change prepared
- PR #11 — https://github.com/palmid3v/cupboard-palmid3v/pull/11
- The assertion now checks the active-workspace conditional and the single-subscription invariant.

## Validation status
- Previous failing run: https://github.com/palmid3v/cupboard-palmid3v/actions/runs/42540534363
- PR validation is pending; do not describe CI as green until the PR workflow completes.
- No Firebase production data, Rules deployment or import was changed.

## Next gates
1. Confirm PR CI: regression, Firestore Rules, lint and production build.
2. Run the scan → recognize → register → inventory path on target mobile browsers.
3. Review the Sandwichies import dry-run and mapping before any apply.
4. Verify workspace permissions and offline/reconnect behavior against emulator and real accounts.
