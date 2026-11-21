# AGENTS.md — AI Coding Agent Operating Rules

These instructions apply to every AI coding agent working in this repository. More specific nested instructions may be added later, but they must not weaken the human approval rules below.

## 1. Mission

Help build a modular, browser-first retro gaming platform with offline gameplay and a planned path to Android/iOS. Work in small, reviewable increments and preserve the approved product and architecture decisions.

## 2. Required reading before work

Before planning or changing files, read:

1. `README.md`
2. `GOALS.md`
3. `PLANS.md`
4. The requested phase file under `tasks/`
5. All architecture/product documents directly relevant to that phase
6. Relevant ADRs under `docs/decisions/`

Inspect the repository and current Git state before editing. Do not assume the repository is empty or that previous work is disposable.

## 3. Approval gates — mandatory

The workflow has separate gates:

- **Plan approval:** the project owner approves the proposed scope, file changes, approach, risks, and acceptance criteria.
- **Implementation:** only after plan approval, implement only the approved scope.
- **Automated verification:** run relevant checks and report actual outcomes, including failures.
- **Human evaluation:** the owner reviews the running application, evidence, code changes, and acceptance criteria.
- **Phase acceptance:** only the owner may accept the phase and authorize the next one.

Do not infer approval from a vague message, silence, a passing build, a previous phase's approval, or your own recommendation. Ask for explicit authorization before implementation when the phase does not contain an owner-recorded approval.

### Owner-only fields

Do not create, edit, or change the following on behalf of the owner:

- `Owner approval`
- `Owner decision`
- `Reviewer`
- `Review date`
- `Phase accepted`
- `Next phase authorized`

The agent may prepare these fields as blank placeholders and may update AI-generated implementation/report sections. The owner fills in approval fields.

## 4. Scope discipline

- Work on one named task or phase at a time.
- Do not implement future-phase features early unless the owner explicitly approves a scope change.
- Do not add accounts, cloud sync, multiplayer, payments, analytics, ads, or social features to the MVP by assumption.
- Do not redesign approved architecture silently. Propose a change and write/update an ADR for owner review.
- Do not make unrelated cleanup changes while implementing a focused task.
- Do not delete user data, game assets, tests, or documentation without explicit approval.

## 5. Technical principles

- Use TypeScript for application code unless an approved ADR says otherwise.
- Keep platform UI separate from game-specific logic.
- Keep each game isolated behind the approved game-module contract.
- Prefer small, well-named modules and explicit types.
- Validate game manifests and saved-data versions.
- Handle loading, errors, pause/resume, focus changes, and cleanup explicitly.
- Avoid executing arbitrary remotely downloaded code.
- Avoid storing large binary game assets in localStorage; use Cache Storage or an approved asset store.
- Make offline state visible to users and test it rather than assuming it works.
- Make keyboard, touch, and supported controller input deliberate, not accidental.

## 6. Dependencies, assets, and licensing

- Do not add a runtime or development dependency without explaining why it is needed.
- Check current maintenance, browser compatibility, security posture, license, and bundle impact before recommending a dependency.
- Do not download or redistribute commercial ROMs, game code, sprites, fonts, music, sound effects, logos, or trademarks without appropriate rights.
- Record each distributed game's provenance and license in its game specification and the game catalog register.
- Prefer original assets and original game implementations for the prototype.

## 7. Required implementation procedure

### Before editing

Return a short plan containing:

1. Goal and scope
2. Relevant requirements and ADRs
3. Files to create/modify
4. Proposed implementation steps
5. Dependencies and licensing implications
6. Risks and assumptions
7. Acceptance criteria and tests
8. Anything requiring owner decision

Wait for explicit plan approval.

### While editing

- Implement only the approved plan.
- Keep changes incremental and easy to review.
- Add/update tests with behavior changes.
- Update relevant docs and examples.
- Preserve compatibility with already accepted phases.

### After editing

Report:

- Summary of what changed
- Files created/modified/deleted
- Dependencies added/removed and rationale
- Commands actually run
- Test/build/lint results (do not claim checks that were not run)
- Screenshots or other evidence where useful
- Known limitations and unresolved issues
- Acceptance criteria met/not met
- Suggested next step, without starting it

Set the AI implementation status to `AWAITING_EVALUATION`. Never mark the phase `ACCEPTED`.

## 8. Git and release safety

- Inspect `git status` before changes.
- Do not discard or overwrite uncommitted user changes.
- Use a task/phase branch where Git is available.
- Prefer focused commits with descriptive messages.
- Do not force-push, merge to the protected branch, publish packages, deploy, or release without explicit owner authorization.
- Do not rewrite Git history unless explicitly requested.

## 9. Reporting honesty

Distinguish clearly between implemented, tested, manually inspected, and merely planned. A successful compile does not prove functionality. If a tool, device, browser, or test environment was unavailable, state that limitation plainly.
