# Product Requirements Document (PRD)

- Product name: Retro Arcade (working name)
- Document status: Draft for owner review
- Product owner: To be assigned
- Last reviewed: To be completed

## 1. Problem and opportunity

People who enjoy classic and retro-style games need a simple place to discover and play a curated collection without installing a separate native application for every game. The product will provide a consistent browser experience and, where game assets have been made available offline, continued play without an internet connection.

## 2. Vision

A lightweight, approachable arcade library that feels nostalgic while following modern standards for usability, accessibility, privacy, and maintainability.

## 3. Target users / provisional personas

### Casual player

Wants to open a game quickly, understand the controls, and play for a short session.

### Nostalgia-focused player

Wants to browse a curated collection, see game descriptions and screenshots, and revisit favorites.

### Offline/mobile player

Wants to install or cache selected games and continue playing when connectivity is unreliable.

### Platform maintainer

Wants a repeatable way to add, test, license, update, and retire game modules without destabilizing the platform.

### Own-disc player (BYOR) — added by SCR-001

Owns legally obtained PS1 disc images and wants to play them in a desktop browser without installing a separate emulator, keep memory-card saves locally, and relaunch quickly, including offline. Expects the app never to upload their files.

Personas are hypotheses to validate during Phase 00, not user research findings.

## 4. Product experience

1. User opens the web application.
2. User sees the catalogue and connection/offline status.
3. User filters or searches the catalogue.
4. User opens a game detail page and reviews description, controls, requirements, and offline availability.
5. User launches the game.
6. The platform prepares the game and shows loading/error states where needed.
7. User plays, pauses, resumes, saves where supported, or exits.
8. The platform records local progress/settings where appropriate.
9. When offline, the platform launches games already available locally and explains when a game is not available.

## 5. Functional requirements

| ID | Requirement | MVP priority |
|---|---|---|
| FR-001 | Display a home/catalogue view of available games | Must |
| FR-002 | Show title, description, category, controls, and availability for each game | Must |
| FR-003 | Launch a game through a shared platform entry point | Must |
| FR-004 | Provide a consistent exit/back-to-library action | Must |
| FR-005 | Support keyboard input for games that declare keyboard controls | Must |
| FR-006 | Support touch controls for games that declare touch controls | Must for mobile browser |
| FR-007 | Provide pause/resume where supported by game design | Must |
| FR-008 | Show whether a game is ready for offline play | Must |
| FR-009 | Launch previously installed/cached games without internet | Must |
| FR-010 | Persist user settings locally | Should |
| FR-011 | Save/restore game progress where meaningful and supported | Should |
| FR-012 | Search/filter catalogue | Should |
| FR-013 | Mark favorite games | Could |
| FR-014 | Allow the user to remove a downloaded game's offline package | Should |
| FR-015 | Support controller input where technically feasible and declared | Could |

### PS1 BYOR requirements (added by SCR-001)

Tiers are defined in `docs/product/MVP_SCOPE.md`: Tier 1 = desktop Chromium; Tier 2 = desktop Safari and Firefox; mobile browsers have no BYOR in the MVP.

| ID | Requirement | MVP priority |
|---|---|---|
| FR-016 | Provide a generic PS1 player that accepts user-supplied disc images in formats approved in Phase 01 (candidates: `.chd`, `.cue`/`.bin`, `.m3u`) | Must (Tier 1 and Tier 2) |
| FR-017 | Keep a linked disc in the user's local disc list so it can be relaunched without re-importing | Must on Tier 1; Tier 2 behavior depends on the Phase 01 fallback choice |
| FR-018 | Make BIOS optional: accept a user-supplied BIOS, or use HLE/no-BIOS mode where the core supports it, and tell the user which mode is active and what it means for compatibility | Must |
| FR-019 | Check browser capabilities and tier before launch and explain unsupported or limited cases in plain language | Must |
| FR-020 | Persist virtual memory cards locally per disc | Must |
| FR-021 | Create and load save states | Should |
| FR-022 | Export and import a save backup (`.zip`) of memory cards and save states | Should on Tier 1; Must on Tier 2 (owner decision D4) |
| FR-023 | Support multi-disc `.m3u` playlists and disc swapping from the pause menu | Should |
| FR-024 | Show `NEEDS_PERMISSION` for a linked disc whose permission must be re-granted, and re-grant it with one user action | Must on Tier 1 |
| FR-025 | Let the user remove a linked disc, BIOS file, or save data, explaining what is deleted and whether it can be recovered | Should |
| FR-026 | Provide PS1 controls: keyboard mapping (Must); gamepad with a DualShock-style layout (Should); touch controls are out of the MVP | Must / Should |
| FR-027 | Never send user disc images, BIOS files, or saves in any network request | Must |
| FR-028 | PS2 emulation | Won't (MVP) — experimental, post-MVP |

## 6. Non-functional requirements

- Reliability: handle game load failures, corrupted/unsupported save data, and browser storage errors gracefully.
- Performance: define measurable targets after selecting representative devices and game complexity during Phase 00/01.
- Compatibility: support a documented browser/device matrix, finalized before release.
- Accessibility: follow the project's accessibility checklist; do not rely only on color, sound, or fine motor precision.
- Privacy: MVP data should remain local unless the owner approves a backend or telemetry requirement.
- Security: do not execute untrusted game code or install unreviewed dependencies.
- Maintainability: use typed interfaces, modular code, tests, and architecture decision records.
- Portability: avoid unnecessary browser-only assumptions in game logic where they would prevent future mobile packaging.
- PS1 performance (provisional, added by SCR-001): ≥ 59 fps NTSC (≥ 49 fps PAL) sustained over a 5-minute session, ≤ 1% dropped frames, no audible audio underruns, on the owner's MacBook M4 in current stable Chrome with an openly licensed homebrew test image. To be baselined in the Phase 01 spike before it becomes binding; Tier 2 is measured and reported, not gated.
- Storage durability (added by SCR-001): request persistent storage where the browser supports it, and tell users that clearing site data deletes BIOS files and saves.
- Data locality (added by SCR-001): user disc images, BIOS files, and saves stay on the device (see FR-027).
- Hosting (added by SCR-001): the production host must support custom response headers, including COOP/COEP for cross-origin isolation. The specific host is selected in ADR-0001 during Phase 01.

## 7. Offline definition

A game is “available offline” only when its required application shell, game code, and required assets are present and verified locally, and the game can be launched successfully without a network connection. A cached catalogue card alone does not mean the game itself is offline-ready.

**BYOR clause (added by SCR-001):** a user-linked PS1 disc is “available offline” only when the application shell, the required emulator core, the BIOS (if the selected mode requires one), and the user's disc image are all available locally without network access. A disc in `NEEDS_PERMISSION` has everything local but needs one user action to re-grant file access; it must be shown distinctly from offline-ready and from unavailable, and must become playable offline after the re-grant.

## 8. Out of scope for MVP

Accounts, cloud saves, multiplayer, leaderboards, payments, ads, public user content, and social features.

## 9. Open questions for Phase 00

- Which initial game genre(s) and number of games should form the MVP?
- Is the target audience primarily desktop, mobile browser, or both equally?
- Which browsers and minimum device capabilities should be supported?
- Should users explicitly download each game for offline use, or should a small starter set be pre-cached?
- What storage limit and user-facing download controls are appropriate?
- What visual direction best fits the intended audience?
- Will the catalogue contain only original games, or curated third-party games with verified distribution rights?
- What are the success targets for load time, offline launch, and stability?

Status after SCR-001 (see `harness/context/OPEN_QUESTIONS.md` for the current list):

- Catalogue content: resolved — original native games plus a generic BYOR PS1 player; no third-party games are distributed.
- Desktop vs. mobile: resolved — the BYOR tiers are recorded in `docs/product/MVP_SCOPE.md`; native games are desktop first, responsive mobile second (owner decision, 2026-11-21).
- Browser support: partly resolved — tiers are recorded; minimum browser versions remain open.
- Performance targets: partly resolved — a provisional PS1 target is recorded above; other targets remain open.

## 10. Acceptance of this PRD

Owner decision: PENDING
Owner comments: To be completed
Approval date: To be completed
