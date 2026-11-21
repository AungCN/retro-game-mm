# SCR-001 — Scope Change: BYOR PS1 in MVP, Experimental PS2 Post-MVP

- Change ID: SCR-001
- Related decision-log entry: DEC-002 (`harness/decision-log.md`); architecture direction DEC-001
- Phase: 00 — Project Discovery
- Date prepared: 2026-11-21
- Implementation status: AWAITING_EVALUATION
- Git: baseline `main`; edits on branch `phase-00/scope-change-byor` (not pushed or merged)

## 1. Reason for the change

DEC-001 proposed an architecture of native games plus BYOR (Bring Your Own ROM) PS1/PS2 emulation, but the product documents described a native-only MVP. Adding emulation is a product scope change and belongs in Phase 00 under the change control in `PLANS.md`. This change:

- aligns the approved MVP with what will be built;
- records the rights posture in policy (no ROMs, BIOS, commercial titles, or box art are distributed);
- records and scores the new risks before architecture approval;
- resets ADR owner fields that had been pre-filled by the assistant (finding G-1), so only the owner records approvals.

## 2. Resulting scope (summary)

Authoritative wording is in `docs/product/MVP_SCOPE.md`.

| Area | In the MVP | Out of the MVP |
|---|---|---|
| Native games | First original vertical slice, then a small library (unchanged) | — |
| PS1 BYOR | Generic PS1 player; local disc list named by the user; formats approved in Phase 01 (candidates `.chd`, `.cue`/`.bin`, `.m3u`); user BIOS or HLE/no-BIOS; per-disc memory cards | Shipped ROMs/disc images/BIOS; commercial titles, metadata databases, box art, logos; loading ROMs from a URL |
| PS2 | — | Experimental, post-MVP; never blocks the MVP; Phase 01 desk research only |
| Other platforms | — | `nes`, `snes`, `gba`, `arcade` |
| Browser tiers | Tier 1 desktop Chromium (full BYOR); Tier 2 desktop Safari/Firefox (OPFS copy or session-only file, chosen in Phase 01) | BYOR on mobile browsers (native games only; "not supported yet" message) |
| Offline | `NEEDS_PERMISSION` state: playable offline after a one-action re-grant | — |
| Privacy | User files and saves never leave the device | — |
| Hosting | Host must support custom COOP/COEP response headers; specific host chosen in ADR-0001 (Phase 01) | — |
| Licence | Repository licence direction GPL-3.0-or-later; LICENSE file added in a separate approved step | — |

## 3. Alternatives considered

| Option | Verdict |
|---|---|
| A. Native games only; emulation deferred | Lowest risk but does not meet the owner's goal — rejected |
| **B. Native first + PS1 BYOR in MVP + PS2 experimental post-MVP** | **Selected by the owner** |
| C. Native + PS1 + PS2 all in MVP | PS2 feasibility unknown; would make the MVP depend on it — rejected |
| D. Emulation first (PS1 player as first slice) | Native slice tests the contract more cheaply and without rights questions — rejected for the first slice |
| E. Curated catalogue of commercial titles with art | Trademark/copyright exposure; conflicts with GOALS — rejected |
| F. Generic player without a local disc list | Persisted handles and per-disc saves need a disc identity anyway — not recommended |

## 4. Traceability: owner answers to documents

Owner answers were given in conversation on 2026-11-21 and confirmed as final when the owner approved this change.

| Owner answer | Recorded in |
|---|---|
| 1. MVP scope option (b) | `MVP_SCOPE.md` (PS1 BYOR section, out of scope); `GOALS.md` (goal 9, non-goals); PRD FR-016–FR-028 |
| 1 vs 10. PS2 timing: post-MVP, never blocks MVP, Phase 01 desk research only | `MVP_SCOPE.md` out of scope; `GOALS.md` non-goals; PRD FR-028; §6 below |
| 2. Generic player, no commercial titles or box art | `GAME_CATALOG_POLICY.md` (Emulation and BYOR); `MVP_SCOPE.md`; `GOALS.md` non-goals |
| 3. User BIOS and HLE/no-BIOS; never commit BIOS | `MVP_SCOPE.md`; PRD FR-018; `USER_FLOWS.md` Flow F; `GAME_CATALOG_POLICY.md`; `RISK_REGISTER.md` R-014 |
| 4. Platforms limited to `web-native`, `ps1`, `ps2` | `MVP_SCOPE.md` and `GOALS.md` out-of-scope lists; R-021 (schema enum trimmed in Phase 01) |
| 5. Browser tiers | `MVP_SCOPE.md`; PRD tier note, FR-017, FR-019; `USER_FLOWS.md` Flows F and J |
| 6. Licence GPL-3.0-or-later; no LICENSE file yet; avoid trademarks/box art | `GAME_CATALOG_POLICY.md` (licence direction, trademark rule); R-013, R-015 |
| 7. `NEEDS_PERMISSION` state | `MVP_SCOPE.md`; PRD FR-024 and §7 BYOR clause; `USER_FLOWS.md` Flow G; R-011 |
| 8. Host must support custom COOP/COEP headers | PRD NFR (Hosting); R-016 |
| 9. Openly licensed PS1 homebrew test images; no large binaries committed | `GAME_CATALOG_POLICY.md` (Test fixtures); `MVP_SCOPE.md` exit criteria; R-019 |
| 10. PS1 full speed on MacBook M4 | `MVP_SCOPE.md` provisional target; PRD NFR (PS1 performance); R-017 |
| 11. Reset G-1 owner fields | `docs/decisions/ADR-0002-GAME-RUNTIME.md`, `docs/decisions/ADR-0003-OFFLINE-STORAGE.md` |
| G-3. Reword "Selected Direction" in ADR-0002 | `docs/decisions/ADR-0002-GAME-RUNTIME.md` option 3 |
| 12. Git baseline and phase branch | Baseline commit on `main`; branch `phase-00/scope-change-byor` |

## 5. Cost, schedule, risk, and compatibility impact

No velocity baseline exists, so sizes are relative.

- **This change:** small — documentation only.
- **Phase 01:** grows from medium to large: alignment of the remaining architecture documents, a PS1 BYOR spike, PS2 desk research, and a licence review.
- **Roadmap:** adds one large phase for the PS1 BYOR adapter (placement decided in the Phase 01 plan; see D6). Phases 05 and 06 grow. PS2 adds nothing before the MVP.
- **Dependencies:** none in this change. The Phase 01 spike will require dependencies, each explained and approved separately.
- **Compatibility:** no phase has been accepted, so nothing accepted is affected. FR-001–FR-015 are unchanged; DEC-001 remains `PROPOSED`.
- **Risk:** rights risk decreases (policy forbids distributing ROMs, BIOS, or commercial art); technical risk increases and is recorded as R-010–R-021.

## 6. Sequencing into Phase 01

1. Owner evaluates this change and decides on Phase 00 acceptance.
2. The assistant prepares a Phase 01 plan for separate approval, covering:
   - ADR-0001: header-capable host selection, dev-server and preview headers, licence application step;
   - ADR-0002: consequences and spike plan; ADR-0003: OPFS vs. IndexedDB fallback, `NEEDS_PERMISSION`, persistent storage;
   - `GAME_MODULE_CONTRACT.md` v2, `DATA_MODEL.md` BYOR entities, manifest schema conditional rules and platform enum trimmed to three values, example manifest fixed;
   - `SYSTEM_OVERVIEW.md`, `APPLICATION_ARCHITECTURE.md`, `SECURITY_GUIDELINES.md`, `TEST_STRATEGY.md` alignment;
   - a roadmap amendment adding the PS1 BYOR adapter phase;
   - a time-boxed PS1 BYOR spike (never merged) and PS2 desk research.

Files deliberately not changed by SCR-001 (Phase 01 scope): ADR-0001, ADR-0004, `GAME_MODULE_CONTRACT.md`, `DATA_MODEL.md`, `SYSTEM_OVERVIEW.md`, `APPLICATION_ARCHITECTURE.md`, `OFFLINE_FIRST_DESIGN.md`, `game-manifest.schema.json`, `game-001.manifest.example.json`, `SECURITY_GUIDELINES.md`, `TEST_STRATEGY.md`, `.gitignore`. No LICENSE file is added.

## 7. Remaining owner decisions

Tracked in `harness/context/OPEN_QUESTIONS.md`.

Owner decisions given on 2026-11-21 after SCR-001 was executed:

| Item | Decision | Recorded in |
|---|---|---|
| D1 — Repository licence | GPL-3.0-or-later; LICENSE file (verbatim GNU GPL-3.0 text) as an optional Phase 01 item approved separately | `GAME_CATALOG_POLICY.md` (Repository licence direction) |
| D2 — Console-name wording | "PS1" with a clear non-affiliation notice | `GAME_CATALOG_POLICY.md` (Trademark wording); R-015 |
| D3 — Tier 2 fallback | **Open:** decided from SPIKE-001 evidence in Phase 01 | `harness/context/OPEN_QUESTIONS.md` item 12 |
| D4 — Save export on Tier 2 | FR-022 is Must on Tier 2 | PRD FR-022 |
| D5 — Committed fixture size | ≤ 1 MB per committed fixture | `GAME_CATALOG_POLICY.md` (Test fixtures); R-019 |
| D6 — Roadmap placement | Insert Phase 04B between Phase 04 and Phase 05, no renumbering (row added in Phase 01) | This section; `PLANS.md` in Phase 01 |
| Native device priority | Desktop first, responsive mobile second | PRD §9 |
| GAME_001 selection method | Small original arcade vertical slice first; concept chosen in the brief | `docs/games/GAME_001_FIRST_GAME_BRIEF.md`; OPEN_QUESTIONS item 4 |

## 8. Files changed by this scope change

- `docs/decisions/ADR-0002-GAME-RUNTIME.md` (G-1 reset, G-3 wording)
- `docs/decisions/ADR-0003-OFFLINE-STORAGE.md` (G-1 reset; AI note moved to Recommendation)
- `docs/product/MVP_SCOPE.md`
- `GOALS.md`
- `docs/product/PRODUCT_REQUIREMENTS.md`
- `docs/product/USER_FLOWS.md`
- `docs/product/RISK_REGISTER.md`
- `docs/product/GAME_CATALOG_POLICY.md`
- `harness/context/OPEN_QUESTIONS.md`
- `harness/decision-log.md`
- `tasks/phase-00-project-discovery.md` (status and AI report only)
- `PLANS.md` (checkpoint only)
- `CHANGELOG.md`
- `docs/product/SCOPE_CHANGE_001_BYOR.md` (this file, new)

## 9. Owner decision — owner only

- Owner decision: APPROVED
- Reviewer: AUNG CHAN NYEIN
- Review date: NOV 22 2026
- Comments: N/A
