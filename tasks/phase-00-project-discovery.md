# Phase 00 — Project Discovery and Product Validation

- Status: AWAITING_EVALUATION
- Type: Documentation and decision work; no application implementation
- Dependencies: None

## Objective

Turn the starter concept into a validated product brief and define an achievable MVP. Resolve assumptions about audience, first game(s), devices, online/offline meaning, content rights, and success criteria.

## Scope

### Included
- Review and refine `GOALS.md` and the PRD.
- Confirm that online/offline means single-player offline capability or explicitly revise it.
- Define target users and primary device priorities.
- Select initial game count/genres or record a staged plan.
- Agree MVP feature boundaries and non-goals.
- Define supported browsers/devices at a practical level.
- Identify rights-cleared content strategy.
- Define preliminary success metrics and major risks.

### Excluded
- Application source code
- Dependency installation
- Production hosting setup
- Native mobile app development

## Work steps
1. Summarize current assumptions and open questions.
2. Present options for first-game concept and target device priorities.
3. Review/complete PRD, MVP scope, user flows, and game catalog policy.
4. Create a risk register and initial success metrics.
5. Prepare a change summary for owner review.

## Acceptance criteria
- [ ] Product vision and primary users are clear.
- [ ] Online/offline definition is explicit.
- [ ] MVP scope and non-goals are approved.
- [ ] First-game selection method is agreed.
- [ ] Target browser/device priorities are recorded.
- [ ] Content licensing/provenance policy is accepted.
- [ ] Key risks and success metrics are documented.
- [ ] Owner has approved Phase 00 outputs.

## Evidence
- Updated PRD and MVP scope
- Recorded owner decisions
- Risk register
- Phase evaluation record

## AI report
- Summary: Executed owner-approved scope change SCR-001 (BYOR PS1 in MVP; PS2 experimental post-MVP; no distributed ROMs/BIOS/commercial titles; browser tiers; `NEEDS_PERMISSION`; licence direction GPL-3.0-or-later). Aligned MVP scope, goals, PRD, user flows, risk register, and catalogue policy; reset pre-filled owner fields in ADR-0002/ADR-0003 (G-1) and reworded ADR-0002 option 3 (G-3). Phase 01 architecture files were deliberately left unchanged. This report does not accept Phase 00.
- Files changed: `GOALS.md`, `PLANS.md` (checkpoint only), `CHANGELOG.md`, `docs/product/MVP_SCOPE.md`, `docs/product/PRODUCT_REQUIREMENTS.md`, `docs/product/USER_FLOWS.md`, `docs/product/RISK_REGISTER.md`, `docs/product/GAME_CATALOG_POLICY.md`, `docs/product/SCOPE_CHANGE_001_BYOR.md` (new), `docs/decisions/ADR-0002-GAME-RUNTIME.md`, `docs/decisions/ADR-0003-OFFLINE-STORAGE.md`, `harness/decision-log.md`, `harness/context/OPEN_QUESTIONS.md`, `tasks/phase-00-project-discovery.md` (this status and report).
- Open questions: D2–D6 and the LICENSE-file step (`harness/context/OPEN_QUESTIONS.md` items 11–16); earlier questions 1, 3, 4, 7, 10 and the open parts of 2, 5, 6, 9.
- Evidence links: `docs/product/SCOPE_CHANGE_001_BYOR.md`; Git baseline on `main` and commits on branch `phase-00/scope-change-byor` (not pushed or merged).
- Acceptance checks (SCR-001 AC-1–AC-13): 13/13 PASS on 2026-11-21 (read-only check script run locally outside the repository; AC-9 also manually reviewed). Results reported to the owner for evaluation; automated checks do not constitute Phase 00 acceptance.

## Human evaluation — owner only
- Reviewer:
- Review date:
- Owner decision: PENDING
- Comments:
- Phase accepted: NO
- Next phase authorized: NO
