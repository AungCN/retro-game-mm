# Human Evaluation Guidelines

## Purpose

Human evaluation is a formal control point, not a rubber stamp. Automated checks are evidence; they do not replace product judgment, manual playtesting, licensing review, or release authorization.

## Review sequence

1. Confirm the phase and implementation plan were approved before implementation.
2. Review the diff and ensure changes stayed within scope.
3. Run or inspect the relevant automated checks.
4. Open the application and reproduce the main user journey.
5. Test relevant edge cases and failure recovery.
6. Review documentation, dependencies, and asset provenance.
7. Record findings with severity and concrete reproduction steps.
8. Decide: approve, request changes, reject, or block.
9. If changes are required, authorize a focused correction task and repeat evaluation.
10. Only the owner records acceptance and authorizes the next phase.

## Suggested severity levels

- `CRITICAL`: data loss, security compromise, unusable application, or release-blocking failure.
- `HIGH`: major feature broken, offline claim false, game cannot be completed, or severe accessibility/compatibility issue.
- `MEDIUM`: feature partially broken, significant usability issue, or non-critical regression.
- `LOW`: cosmetic issue, minor copy/layout issue, or low-impact inconsistency.

## Reviewer questions

- Does the implementation solve the approved problem?
- Is the behavior consistent with the PRD and phase scope?
- Does it work on the intended browsers/devices?
- Does offline-ready mean truly playable offline?
- Are game resources cleaned up after leaving a game?
- Are saved data and user settings handled safely?
- Are all game assets and dependencies appropriately licensed?
- Can another developer understand and extend the code?
- Are limitations and untested areas disclosed?

## Approval rule

Do not accept a phase with unresolved critical/high findings unless the owner explicitly documents why the risk is acceptable. Do not authorize the next phase until dependencies are accepted.
