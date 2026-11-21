# AI Build and Verification Log

Use one entry per implementation attempt. Record actual commands/results; do not record planned checks as completed.

## Entry template

### [YYYY-MM-DD] [PHASE/TASK] — [ATTEMPT]

- Agent/tool:
- Branch/commit:
- Approved plan reference:
- Summary:
- Files changed:
- Dependencies changed:
- Commands executed:
- Test/build results:
- Manual checks performed:
- Evidence links:
- Known issues:
- Status: AWAITING_EVALUATION

---

## Initial baseline

- Date: 2026-11-21
- Project state: Documentation starter kit created; application code not yet implemented.
- Approved stack: None.
- Tests/build: Not applicable; no application package has been initialized.

---

### 2026-11-22 DRAFT v0.1 (DEC-003) — first build across Phases 02–06 and 04B

- Agent/tool: AI coding agent (Claude Code), at the owner's request
- Branch/commit: `draft/v0.1-first-build` (based on `phase-01/architecture`)
- Approved plan reference: DEC-003 (draft-first mode, owner instruction 2026-11-22); DEC-004 (emulator CSP/core)
- Summary: see the AI reports in the Phase 02, 03, 04, 04B, 05 and 06 files.
- Dependencies changed:
  - runtime: react 19.3.1, react-dom 19.3.1;
  - dev: vite 8.3.8, typescript 7.0.2, @types/react 19.3.0, @types/react-dom 19.3.0, @types/node 26.6.6, vitest 5.1.1, ajv 8.20.0, @playwright/test 1.65.1;
  - all exact versions, installed with `--ignore-scripts`; emulator via verified tarballs (not npm deps).
- Commands executed: `npm install --ignore-scripts`, `npm run fetch:emulator`, `npm run fetch:fixtures`, `npm run typecheck`, `npx vitest run`, `npx playwright test`, `npm run build`, `npm audit`, `npm audit --omit=dev`.
- Test/build results: see the final verification run in the owner report and PR (recorded at the end of the session).
- Manual checks performed: screenshots of the emulator rendering the MIT test program inside the app player.
- Known issues: listed in each phase's "Not done" and in `docs/quality/THREAT_MODEL.md` (gaps).
- Status: AWAITING_EVALUATION

