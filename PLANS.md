# Master Development Roadmap

This roadmap is the single index for phase status. Phase files contain the detailed scope and acceptance criteria.

## Status vocabulary

- `PROPOSED` — drafted, not yet approved.
- `READY_FOR_REVIEW` — AI has prepared a proposal; owner review is pending.
- `APPROVED` — owner explicitly approved the plan.
- `IN_PROGRESS` — approved implementation is underway.
- `AWAITING_EVALUATION` — AI implementation/report is complete; human review is pending.
- `CHANGES_REQUIRED` — owner review identified required corrections.
- `ACCEPTED` — owner accepted the phase.
- `BLOCKED` — work cannot proceed due to a documented blocker.
- `DEFERRED` — intentionally postponed by the owner.

**Control rule:** AI agents may update implementation-related statuses where appropriate, but only the project owner may set `APPROVED`, `ACCEPTED`, or owner approval fields. The agent must not authorize a subsequent phase.

## Roadmap

| Phase | File | Outcome | Initial status | Depends on |
|---|---|---|---|---|
| 00 | `tasks/phase-00-project-discovery.md` | Validated product brief, scope, personas, and risks | PROPOSED | None |
| 01 | `tasks/phase-01-architecture.md` | Approved technical architecture and ADRs | PROPOSED | Phase 00 accepted |
| 02 | `tasks/phase-02-application-foundation.md` | Browser app shell, navigation, responsive catalogue shell | PROPOSED | Phase 01 accepted |
| 03 | `tasks/phase-03-first-game.md` | First playable game integrated through shared runtime | PROPOSED | Phase 02 accepted |
| 04 | `tasks/phase-04-game-library.md` | Extensible catalogue and additional game modules | PROPOSED | Phase 03 accepted |
| 04B | `tasks/phase-04b-ps1-byor-adapter.md` | Generic PS1 BYOR player through the `wasm-libretro` adapter (added by SCR-001, owner decision D6) | PROPOSED | Phase 04 accepted |
| 05 | `tasks/phase-05-offline-support.md` | Installable PWA and tested offline game delivery, including BYOR offline readiness | PROPOSED | Phases 01–04B accepted |
| 06 | `tasks/phase-06-browser-qa.md` | Quality, accessibility, compatibility, and release readiness | PROPOSED | Phases 02–05 (including 04B) accepted |
| 07 | `tasks/phase-07-mobile-expansion.md` | Android/iOS packaging and device validation | DEFERRED | Phase 06 accepted |

## Current project checkpoint

- Current phase: Draft-first build across Phases 02–06 and 04B (DEC-003; branch `draft/v0.1-first-build`)
- Current phase status: AWAITING_EVALUATION (draft v0.1; Phase 06 partial)
- Application code started: Yes (draft v0.1)
- Approved technology stack: No
- First game selected: No
- Product owner: To be completed
- Last owner review: To be completed

## Change control

A scope or architecture change must include:

1. Reason for the change
2. Affected goals, requirements, phases, and files
3. Alternatives considered
4. Cost/risk/compatibility implications
5. Recommendation
6. Owner decision and date

Record material architecture choices in `docs/decisions/` and update this roadmap only after owner authorization.
