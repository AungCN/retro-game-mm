# Tests

- `unit/` — Vitest (`npm test`): zip safety, disc-set validation, frame protocol, routing, security headers, game rules, lifecycle, manifests, backups.
- `e2e/` — Playwright on the installed Chrome (`npm run test:e2e`): headers/CSP, native game lifecycle, offline, emulator frame guard, and the sandboxed PS1 flow. The PS1 test needs `npm run fetch:emulator` and `npm run fetch:fixtures` first.

Strategy and the BYOR tier matrix: `docs/quality/TEST_STRATEGY.md`.
