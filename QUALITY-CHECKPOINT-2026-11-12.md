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
- CI passed on commit c386e32: regression 19/19, Firestore Rules 8/8, lint and production build. The separate theme-engine validation job also passed.
- npm audit reports 25 dependency vulnerabilities in the full tree: 5 low, 10 moderate, 9 high and 1 critical. The critical advisory is websocket-driver, pulled through faye-websocket by @firebase/database. High findings include @grpc/grpc-js, brace-expansion, fast-uri, js-yaml, nanoid, postcss, source-map-js, vite and zod. npm audit marks fixes as available for these high/critical findings.
- CI now prints the package-level advisory report and has a blocking npm audit --audit-level=high gate. Functional regression/Rules/lint/build checks passed, but the security gate intentionally blocks this PR until dependency remediation is complete.

## Validation status
- Previous failing run: https://github.com/palmid3v/cupboard-palmid3v/actions/runs/42540534363
- Functional checks passed on commit c386e32. The security gate is intentionally red on the current dependency tree; remediate the high/critical advisories and rerun the full workflow before merging or releasing.
- No Firebase production data, Rules deployment or import was changed.

## Next gates
1. Confirm PR CI: regression, Firestore Rules, lint and production build.
2. Run the scan → recognize → register → inventory path on target mobile browsers.
3. Review the Sandwichies import dry-run and mapping before any apply.
4. Verify workspace permissions and offline/reconnect behavior against emulator and real accounts.
