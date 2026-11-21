# Phase 02 — Application Foundation and Platform Shell

- Status: AWAITING_EVALUATION
- Dependencies: Phase 01 accepted

## Objective

Create the smallest working browser application shell with navigation, catalogue scaffolding, responsive layout, and agreed design-system foundations.

## Scope

### Included
- Initialize the approved web stack.
- Add lint/type-check/test/build scripts as approved.
- Create app shell and routes/views.
- Create catalogue using mock/approved local metadata.
- Create game detail and player placeholder screens.
- Add responsive layout, basic accessibility, error/empty/loading states.
- Add agreed visual tokens and reusable components.

### Excluded
- Full gameplay implementation (Phase 03)
- Authentication/cloud services
- Multiplayer or payments
- Unapproved analytics

## Work steps
1. Verify owner approval and accepted ADRs.
2. Propose file-level implementation plan.
3. Scaffold approved project and lock dependencies.
4. Implement shell, navigation, catalogue, detail, and placeholder player views.
5. Add component tests and responsive checks.
6. Update README and technical docs to reflect actual scaffold.

## Acceptance criteria
- [ ] App installs/builds using documented steps.
- [ ] Catalogue, detail, and player placeholder navigation work.
- [ ] Layout works at agreed narrow and wide viewports.
- [ ] Loading, empty, and error states are present where relevant.
- [ ] Keyboard navigation and visible focus are verified.
- [ ] Automated checks pass or failures are documented.
- [ ] No unapproved features/dependencies are added.
- [ ] Human visual/functional review completed.

## AI report (draft v0.1, DEC-003)
- Summary:
  - Built the React + TypeScript + Vite shell with hash routes for the library, game details, player, settings, about, and not-found.
  - Responsive layout using safe-area insets.
  - Loading, empty and error states.
  - Accessibility basics: skip control, `:focus-visible`, `aria-current` navigation, status/alert roles, badges that pair text with colour, 44 px controls.
  - Security headers via `config/security-headers.ts`.
- Files: `index.html`, `src/app/*`, `src/pages/*`, `src/components/*`, `src/styles.css`, `vite.config.ts`, `config/*`, `package.json` (exact pins).
- Dependencies: react, react-dom (runtime); vite, typescript, @types/*, vitest, ajv, @playwright/test (dev). All MIT/Apache-2.0, installed with `--ignore-scripts`, `npm audit` 0 vulnerabilities.
- Evidence: e2e "library loads cross-origin isolated with the strict CSP and no violations" (Chrome 158); typecheck clean.
- Not done:
  - visual-direction approval;
  - formal keyboard/zoom/screen-reader audit;
  - narrow-viewport screenshots on real devices;
  - ADR-0001 owner decision.

## Human evaluation — owner only
- Reviewer:
- Review date:
- Owner decision: PENDING
- Comments:
- Phase accepted: NO
- Next phase authorized: NO
