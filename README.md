# Retro Arcade — AI-Assisted, Human-Governed Project Starter Kit

A documentation-first starter kit for building a modular retro-style game collection that runs in modern web browsers, supports offline play, and can later be packaged for Android and iOS.

> **Status:** first working draft (v0.1, branch `draft/v0.1-first-build`), built in draft-first mode (DEC-003) for owner review. It is a study and research project, not for commercial use. Technology choices remain proposals until the owner accepts the ADRs.
>
> **Licence:** GPL-3.0-or-later (`LICENSE`). Third-party emulator components keep their own licences; see `docs/games/PS1_PLAYER_SPEC.md`.

## Product concept

Build a browser-first arcade hub containing independently maintained game modules. Users can discover a game, open its details, launch it, play with keyboard/touch/controller input where supported, and retain local progress. The platform should clearly show which games are installed and playable offline. A later release may add accounts, cloud synchronization, leaderboards, multiplayer, and native mobile packaging.

**Initial assumption:** online/offline refers to single-player games being playable with or without an internet connection. Online multiplayer is explicitly out of the initial MVP unless the owner changes the scope.

## Core principles

1. **Browser-first:** the web application is the primary product, not a thin mobile-app prototype.
2. **Offline by design:** offline requirements shape the architecture from the beginning; implementation is delivered in a dedicated phase.
3. **Modular games:** each game has a manifest, a documented contract, isolated assets, and its own tests.
4. **Human approval gates:** the AI may propose, implement, and test, but it cannot approve its own plan, accept a phase, merge to the protected branch, or release.
5. **Rights-cleared content:** only original, public-domain, or appropriately licensed code, game names, art, sound, and other assets may be distributed.
6. **Small changes:** implement one approved task at a time, with reviewable commits and evidence.

## Running the draft

Requires Node.js ≥ 22.12 (developed on Node 26 on an Apple M4) and Google Chrome for the end-to-end tests.

```sh
npm ci --ignore-scripts      # pinned dependencies; no package install scripts are needed
npm run fetch:emulator       # EmulatorJS 4.2.3 + PS1 core, sha512-verified, into public/emulator/ejs/ (gitignored)
npm run fetch:fixtures       # optional: MIT PS1 test programs for e2e tests, into test-fixtures/local/ (gitignored)
npm run dev                  # http://localhost:5173 (no service worker in dev)
npm run build && npm run preview   # production build on http://localhost:4173, with service worker and offline support
```

Checks:

```sh
npm run typecheck            # app, Node config, and test TypeScript
npm test                     # unit tests (Vitest)
npm run test:e2e             # Playwright with the installed Chrome: headers/CSP, game lifecycle, offline, sandboxed PS1 flow
npm run validate:manifests   # every game manifest against the JSON Schema
npm run audit:deps           # npm audit
```

What is in the draft:

- **Library, game details, player, settings, about.** React shell with hash routes; works offline after the first visit.
- **Comet Courier.** An original Canvas 2D game with keyboard, touch, and gamepad input, pause on focus loss, and a saved best score.
- **PS1 Player (bring your own disc).**
  - Link discs (desktop Chromium) or upload them (Safari/Firefox; copied into browser storage by default).
  - Optional BIOS, or the built-in replacement.
  - Memory cards and save states stored per disc, with `.zip` backup/restore.
  - An offline emulator package.
  - The emulator runs in an opaque-origin sandbox.
- **Security.** COOP/COEP/CORP everywhere, a strict shell CSP, and emulator relaxations confined to its frame (DEC-004). See `docs/quality/THREAT_MODEL.md`.

## Start here

1. Read `GOALS.md` and `AGENTS.md`.
2. Review the assumptions in `docs/product/PRODUCT_REQUIREMENTS.md`.
3. Work through `tasks/phase-00-project-discovery.md` without writing application code.
4. Record decisions in `docs/decisions/` and have the owner approve them.
5. Only then begin Phase 01 and subsequent implementation phases.

## Repository map

- `AGENTS.md` — rules for AI coding agents.
- `GOALS.md` — product vision, boundaries, and success outcomes.
- `PLANS.md` — master roadmap and human-controlled phase status.
- `PROMPTS.md` — reusable prompts for discovery, planning, implementation, review, and correction.
- `docs/product/` — product requirements, MVP scope, user flows, and content policy.
- `docs/architecture/` — system, game-module, offline, data, and mobile architecture.
- `docs/design/` — UI and design-system guidance.
- `docs/decisions/` — Architecture Decision Records (ADRs).
- `docs/quality/` — testing, security, accessibility, and release expectations.
- `docs/games/` — reusable per-game specification template and first-game decision brief.
- `tasks/` — phase-specific implementation briefs and acceptance criteria.
- `evaluations/` — human review guidance and forms.
- `harness/` — build, decision, and review logs for AI-assisted work.
- `src/`, `public/`, and `tests/` — suggested future application folders, not a working application yet.

## Status and approval policy

Use the status vocabulary in `PLANS.md`. The project owner is the only person who may set a human approval decision to `APPROVED` or a phase to `ACCEPTED`. AI agents must not edit owner-only approval fields. Approval must be explicit in the relevant phase file or a recorded review, not inferred from silence or from successful automated tests.

## Suggested initial technical direction

Candidate stack for evaluation in Phase 01:

- React + TypeScript + Vite for the web application shell.
- A 2D browser game runtime such as Phaser, subject to a small technical spike and ADR approval.
- IndexedDB for structured local saves and metadata.
- Cache Storage + a service worker for offline application/game assets.
- Vitest for unit tests and Playwright for browser/end-to-end tests.
- Capacitor as a candidate packaging route for a later Android/iOS phase.

Do not install or commit dependencies solely because they appear in this list. Confirm current compatibility, maintenance status, licensing, and project fit before selection.

## First milestone

The first milestone is a reviewed and approved product/technical plan—not a playable game. Once Phase 00 and Phase 01 are accepted, build the smallest end-to-end vertical slice: one rights-cleared game launched from the catalogue, with input, pause/resume, local save/restore where meaningful, and a documented offline test.
