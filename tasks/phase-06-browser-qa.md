# Phase 06 — Browser QA, Accessibility, and Web Release Readiness

- Status: AWAITING_EVALUATION
- Dependencies: Phases 02–05 (including 04B) accepted

## Objective

Verify the web product against approved requirements and prepare a controlled release candidate.

## Scope
- Execute unit, integration, and end-to-end tests.
- Test agreed browser/device matrix, including the BYOR tier matrix (Tier 1 desktop Chromium, Tier 2 desktop Safari/Firefox, mobile "not supported yet").
- Review responsive layout, accessibility, performance, and offline behavior.
- Review dependencies, security posture, and asset licensing.
- Resolve critical/high defects or obtain explicit owner acceptance of documented residual risks.
- Prepare release notes, deployment/rollback procedure, and support route.

## Excluded
- Native store submission
- Unapproved marketing/analytics integrations

## Acceptance criteria
- [ ] All release checklist items are completed or explicitly waived by owner.
- [ ] Critical/high severity defects are resolved or release is blocked.
- [ ] Browser/device matrix evidence is attached.
- [ ] Offline launch evidence is attached.
- [ ] Accessibility review is documented.
- [ ] Performance results are compared to approved targets.
- [ ] Licensing/provenance records are complete.
- [ ] Deployment and rollback instructions are documented.
- [ ] Owner explicitly authorizes web release.

## AI report (draft v0.1, DEC-003 — partial)
- Summary of QA done:
  - 77 unit tests and 5 Playwright e2e tests on the installed Chrome;
  - three-way TypeScript typecheck;
  - manifest validation;
  - `npm audit` (0 vulnerabilities);
  - a risky-pattern scan (no innerHTML or eval in app code);
  - threat model (`docs/quality/THREAT_MODEL.md`);
  - GPL-3.0 `LICENSE` added (verbatim, SHA-256 `3972dc97…fb36986`).
- Not done:
  - Safari and Firefox matrix (manual checklist in SPIKE-001);
  - accessibility review;
  - performance against targets on real games;
  - deployment and rollback procedure;
  - independent security review.
- Release is not ready; owner decision required.

## Human evaluation — owner only
- Reviewer:
- Review date:
- Owner decision: PENDING
- Comments:
- Release authorized: NO
